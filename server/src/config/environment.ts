/**
 * environment
 *
 * Loads EDORI backend environment variables before
 * database or server configuration is evaluated.
 */

import dotenv from "dotenv";

import {

    resolve

}

from "node:path";


/**
 * The EDORI API is normally started from the repository
 * root, so explicitly resolve server/.env rather than
 * depending on the current working directory default.
 */
const environmentPath =

    resolve(

        process.cwd(),

        "server",

        ".env"

    );


const result =

    dotenv.config({

        path:
            environmentPath

    });


if(result.error){

    console.warn(

        [
            "EDORI backend environment file was not loaded.",
            `Expected: ${environmentPath}`,
            "Existing operating-system environment variables will still be used."
        ].join(
            "\n"
        )

    );

}


/**
 * Require one environment variable.
 */
export function requireEnvironmentVariable(

    name:string

):string {

    const value =

        process.env[name];


    if(

        typeof value !== "string"

        ||

        value.trim().length === 0

    ){

        throw new Error(

            `Required EDORI environment variable "${name}" is not configured.`

        );

    }


    return value.trim();

}


/**
 * Validate the core PostgreSQL configuration early.
 *
 * Do not return or log the password.
 */
export function validateBackendEnvironment():void {

    requireEnvironmentVariable(
        "PGHOST"
    );

    requireEnvironmentVariable(
        "PGPORT"
    );

    requireEnvironmentVariable(
        "PGDATABASE"
    );

    requireEnvironmentVariable(
        "PGUSER"
    );

    requireEnvironmentVariable(
        "PGPASSWORD"
    );

}


/**
 * Safe diagnostic information.
 *
 * Password contents are deliberately excluded.
 */
export function getBackendEnvironmentSummary():{

    pgHost:string;

    pgPort:string;

    pgDatabase:string;

    pgUser:string;

    passwordConfigured:boolean;

} {

    return {

        pgHost:
            process.env.PGHOST
            ?? "",

        pgPort:
            process.env.PGPORT
            ?? "",

        pgDatabase:
            process.env.PGDATABASE
            ?? "",

        pgUser:
            process.env.PGUSER
            ?? "",

        passwordConfigured:

            typeof process.env.PGPASSWORD
            ===
            "string"

            &&

            process.env.PGPASSWORD.length > 0

    };

}