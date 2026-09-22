/**
 * environment
 *
 * Loads Hospital Readiness backend environment variables
 * before database or server configuration is evaluated.
 */

import dotenv from "dotenv";

import {

    resolve

}

from "node:path";


/**
 * The Hospital Readiness API is normally started from
 * the repository root, so explicitly resolve server/.env
 * rather than depending on the current working-directory
 * default.
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
            "Hospital Readiness backend environment file was not loaded.",
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

            `Required Hospital Readiness environment variable "${name}" is not configured.`

        );

    }


    return value.trim();

}


/**
 * Read one optional environment variable.
 */
export function getOptionalEnvironmentVariable(

    name:string

):string | null {

    const value =
        process.env[name];


    if(typeof value !== "string"){

        return null;

    }


    const normalized =
        value.trim();


    return normalized
        ? normalized
        : null;

}


/**
 * Read a boolean environment variable.
 *
 * Accepted true values:
 * true, 1, yes, on
 *
 * Accepted false values:
 * false, 0, no, off
 */
export function getBooleanEnvironmentVariable(

    name:string,

    defaultValue:boolean

):boolean {

    const value =

        getOptionalEnvironmentVariable(
            name
        );


    if(value === null){

        return defaultValue;

    }


    switch(value.toLowerCase()){

        case "true":
        case "1":
        case "yes":
        case "on":

            return true;


        case "false":
        case "0":
        case "no":
        case "off":

            return false;


        default:

            throw new Error(

                `Hospital Readiness environment variable "${name}" must be true or false.`

            );

    }

}


/**
 * Validate the core PostgreSQL configuration early.
 *
 * Email-provider configuration is deliberately NOT
 * validated here. Missing Brevo configuration should
 * disable email delivery, not prevent the entire
 * Hospital Readiness application from starting.
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
 * Read and validate Executive Report email settings.
 *
 * This function should only be called when the email
 * feature actually needs provider configuration.
 */
export function getExecutiveReportEmailEnvironment():{

    apiKey:string;

    fromEmail:string;

    fromName:string;

    sandbox:boolean;

} {

    const apiKey =

        requireEnvironmentVariable(
            "BREVO_API_KEY"
        );


    const fromEmail =

        requireEnvironmentVariable(
            "EXECUTIVE_REPORT_FROM_EMAIL"
        );


    const fromName =

        getOptionalEnvironmentVariable(
            "EXECUTIVE_REPORT_FROM_NAME"
        )
        ?? "Hospital Readiness";


    const sandbox =

        getBooleanEnvironmentVariable(

            "EXECUTIVE_REPORT_SANDBOX",

            true

        );


    return {

        apiKey,

        fromEmail,

        fromName,

        sandbox

    };

}


/**
 * Safe diagnostic information.
 *
 * Password and API-key contents are deliberately
 * excluded.
 */
export function getBackendEnvironmentSummary():{

    pgHost:string;

    pgPort:string;

    pgDatabase:string;

    pgUser:string;

    passwordConfigured:boolean;

    brevoConfigured:boolean;

    executiveReportSenderConfigured:boolean;

    executiveReportSandbox:boolean;

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

            process.env.PGPASSWORD.length > 0,

        brevoConfigured:

            typeof process.env.BREVO_API_KEY
            ===
            "string"

            &&

            process.env.BREVO_API_KEY.trim().length > 0,

        executiveReportSenderConfigured:

            typeof process.env.EXECUTIVE_REPORT_FROM_EMAIL
            ===
            "string"

            &&

            process.env.EXECUTIVE_REPORT_FROM_EMAIL.trim().length > 0,

        executiveReportSandbox:

            getBooleanEnvironmentVariable(

                "EXECUTIVE_REPORT_SANDBOX",

                true

            )

    };

}