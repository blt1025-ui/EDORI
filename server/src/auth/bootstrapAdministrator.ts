/**
 * bootstrapAdministrator
 *
 * Creates the first PostgreSQL-backed EDORI Administrator.
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

    countActiveAdministrators,
    createUser,
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


async function bootstrapAdministrator():Promise<void> {

    const existingAdministratorCount =

        await countActiveAdministrators();


    if(existingAdministratorCount > 0){

        throw new Error(

            "An active PostgreSQL-backed EDORI Administrator already exists. Bootstrap is only for the first Administrator."

        );

    }


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

                    "Administrator username [admin]: "

                )
            ).trim()

            || "admin";


        const existingUser =

            await findUserByUsername(
                username
            );


        if(existingUser){

            throw new Error(

                "A PostgreSQL EDORI user with that username already exists."

            );

        }


        const displayName =

            (
                await input.question(

                    "Administrator display name [EDORI Administrator]: "

                )
            ).trim()

            || "EDORI Administrator";


        const email =

            (
                await input.question(

                    "Administrator email (optional): "

                )
            ).trim();


        output.setMuted(
            true
        );


        const password =

            await input.question(

                "Administrator password: "

            );


        stdout.write(
            "\n"
        );


        const passwordConfirmation =

            await input.question(

                "Confirm administrator password: "

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


        const user =

            await createUser({

                username,

                displayName,

                email,

                role:
                    "administrator",

                active:
                    true

            });


        try {

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

        }
        catch(error){

            /*
             * The user row is intentionally left in place if
             * credential persistence fails so the failure is
             * visible rather than silently losing identity data.
             * A later administrative recovery command can repair
             * credentials.
             */
            throw error;

        }


        console.info(

            [
                "",
                "PostgreSQL EDORI Administrator created successfully.",
                `Username: ${user.username}`,
                `Display name: ${user.displayName}`,
                `User ID: ${user.id}`,
                "Password: stored only as a server-side hash"
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

    await bootstrapAdministrator();

}
catch(error){

    console.error(

        "EDORI Administrator bootstrap failed:",

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