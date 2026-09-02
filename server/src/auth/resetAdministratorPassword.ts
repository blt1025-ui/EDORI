/**
 * resetAdministratorPassword
 *
 * Resets the password for an existing PostgreSQL-backed
 * EDORI Administrator account.
 *
 * Password entry is masked and plaintext is never written
 * to disk or logged.
 */

import "../config/environment.js";

import {
    Writable
}
from "node:stream";

import {
    createInterface
}
from "node:readline/promises";

import {
    stdin,
    stdout
}
from "node:process";

import {
    closeDatabasePool
}
from "../database/database.js";

import {
    hashPassword
}
from "./PasswordService.js";

import {
    upsertCredential
}
from "../repositories/CredentialRepository.js";

import {
    clearFailedLogins
}
from "../repositories/LoginSecurityRepository.js";

import {
    findUserByUsername
}
from "../repositories/UserRepository.js";


class MaskedOutput extends Writable {

    private muted = false;


    setMuted(
        muted:boolean
    ):void {

        this.muted =
            muted;
    }


    override _write(
        chunk:Buffer | string,
        encoding:BufferEncoding,
        callback:(error?:Error | null) => void
    ):void {

        if(!this.muted){

            stdout.write(
                chunk,
                encoding
            );
        }
        else {

            const text =
                chunk.toString();

            if(
                text.includes(
                    "\n"
                )
                ||
                text.includes(
                    "\r"
                )
            ){

                stdout.write(
                    text
                );
            }
        }

        callback();
    }
}


async function resetAdministratorPassword():Promise<void> {

    const output =
        new MaskedOutput();

    const input =
        createInterface({
            input:
                stdin,

            output,

            terminal:
                true
        });

    try {

        const username =
            (
                await input.question(
                    "Administrator username: "
                )
            ).trim();

        if(!username){

            throw new Error(
                "Administrator username is required."
            );
        }


        const user =
            await findUserByUsername(
                username
            );

        if(!user){

            throw new Error(
                `No PostgreSQL EDORI user was found with username "${username}".`
            );
        }


        if(user.role !== "administrator"){

            throw new Error(
                `The EDORI user "${user.username}" is not an Administrator.`
            );
        }


        if(!user.active){

            throw new Error(
                `The EDORI Administrator "${user.username}" is inactive.`
            );
        }


        output.setMuted(
            true
        );

        const password =
            await input.question(
                "New administrator password: "
            );

        stdout.write(
            "\n"
        );


        const passwordConfirmation =
            await input.question(
                "Confirm new administrator password: "
            );

        stdout.write(
            "\n"
        );

        output.setMuted(
            false
        );


        if(password !== passwordConfirmation){

            throw new Error(
                "Administrator passwords do not match."
            );
        }


        const credential =
            await hashPassword(
                password
            );


        await upsertCredential({
            userId:
                user.id,

            passwordHash:
                credential.passwordHash,

            passwordSalt:
                credential.passwordSalt,

            passwordAlgorithm:
                credential.passwordAlgorithm,

            passwordIterations:
                credential.passwordIterations,

            mustChangePassword:
                false
        });


        /*
         * Clear any failed-login/lockout record so the
         * administrator can sign in immediately after reset.
         */
        await clearFailedLogins(
            user.username
        );


        console.info(
            [
                "",
                "EDORI Administrator password reset successfully.",
                `Username: ${user.username}`,
                `Display name: ${user.displayName}`,
                "Password: stored only as a server-side hash",
                "Login lockout state: cleared"
            ].join(
                "\n"
            )
        );
    }
    finally {

        output.setMuted(
            false
        );

        input.close();
    }
}


try {

    await resetAdministratorPassword();
}
catch(error){

    console.error(
        "EDORI Administrator password reset failed:",
        error instanceof Error
            ? error.message
            : error
    );

    process.exitCode =
        1;
}
finally {

    await closeDatabasePool();
}
