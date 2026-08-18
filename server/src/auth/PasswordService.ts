/**
 * PasswordService
 *
 * Server-side EDORI password hashing and verification.
 *
 * Uses Node.js scrypt with a unique random salt.
 * Plaintext passwords are never persisted.
 */

import {

    randomBytes,
    scrypt as scryptCallback,
    timingSafeEqual

}

from "node:crypto";


import {

    promisify

}

from "node:util";


const scrypt =

    promisify(
        scryptCallback
    );


const PASSWORD_ALGORITHM =

    "scrypt-v1";


const SALT_BYTES =

    16;


const DERIVED_KEY_BYTES =

    64;


const MINIMUM_PASSWORD_LENGTH =

    12;


const MAXIMUM_PASSWORD_LENGTH =

    128;


export interface PasswordCredentialData {

    passwordHash:string;

    passwordSalt:string;

    passwordAlgorithm:string;

    passwordIterations:null;

}


/**
 * Hash a new EDORI password.
 */
export async function hashPassword(

    password:string

):Promise<PasswordCredentialData> {

    validatePassword(
        password
    );


    const salt =

        randomBytes(
            SALT_BYTES
        );


    const derivedKey =

        await deriveKey(

            password,

            salt

        );


    return {

        passwordHash:
            derivedKey.toString(
                "base64"
            ),

        passwordSalt:
            salt.toString(
                "base64"
            ),

        passwordAlgorithm:
            PASSWORD_ALGORITHM,

        passwordIterations:
            null

    };

}


/**
 * Verify a plaintext password against stored credential
 * material.
 */
export async function verifyPassword(

    password:string,

    credential:{

        passwordHash:string;

        passwordSalt:string;

        passwordAlgorithm:string;

    }

):Promise<boolean> {

    if(

        credential.passwordAlgorithm

        !==

        PASSWORD_ALGORITHM

    ){

        throw new Error(

            `Unsupported EDORI password algorithm: ${credential.passwordAlgorithm}`

        );

    }


    const storedHash =

        Buffer.from(

            credential.passwordHash,

            "base64"

        );


    const salt =

        Buffer.from(

            credential.passwordSalt,

            "base64"

        );


    const derivedKey =

        await deriveKey(

            password,

            salt

        );


    if(

        storedHash.length

        !==

        derivedKey.length

    ){

        return false;

    }


    return timingSafeEqual(

        storedHash,

        derivedKey

    );

}


/**
 * Validate password length.
 *
 * Additional common-password screening can be layered
 * on later without changing repository storage.
 */
export function validatePassword(

    password:string

):void {

    if(password.length < MINIMUM_PASSWORD_LENGTH){

        throw new Error(

            `EDORI passwords must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`

        );

    }


    if(password.length > MAXIMUM_PASSWORD_LENGTH){

        throw new Error(

            `EDORI passwords cannot exceed ${MAXIMUM_PASSWORD_LENGTH} characters.`

        );

    }

}


/**
 * Return public password-policy values.
 */
export function getPasswordPolicy():{

    minimumLength:number;

    maximumLength:number;

} {

    return {

        minimumLength:
            MINIMUM_PASSWORD_LENGTH,

        maximumLength:
            MAXIMUM_PASSWORD_LENGTH

    };

}


async function deriveKey(

    password:string,

    salt:Buffer

):Promise<Buffer> {

    const result =

        await scrypt(

            password,

            salt,

            DERIVED_KEY_BYTES

        );


    return result as Buffer;

}