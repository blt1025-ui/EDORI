/**
 * CredentialService
 *
 * Development-only username/password credential storage.
 *
 * Passwords are never stored directly. This service uses
 * the browser Web Crypto API to derive a PBKDF2-SHA-256
 * password hash with a unique random salt.
 *
 * IMPORTANT:
 * This is NOT the final production credential store.
 * Production EDORI will move authentication to the
 * backend/database so browser JavaScript cannot access
 * password hashes.
 */

import type {

    UserCredential

}

from "../types/UserCredential";


import {

    getUserById,
    getUsers

}

from "./UserService";


const CREDENTIAL_STORAGE_KEY =

    "edori_user_credentials_v1";


const DEFAULT_ITERATIONS =

    310_000;


/**
 * Temporary development bootstrap password.
 *
 * Do not use this password in production.
 */
export const DEVELOPMENT_BOOTSTRAP_PASSWORD =

    "ChangeMe-EDORI-2026!";


/**
 * Ensure the bootstrap Administrator has a development
 * credential so a new EDORI installation can be entered.
 */
export async function ensureBootstrapCredential():Promise<void> {

    const administrator =

        getUsers()

            .find(

                user =>
                    user.id
                    ===
                    "bootstrap-administrator"

            );


    if(!administrator){

        return;

    }


    if(

        hasCredential(
            administrator.id
        )

    ){

        return;

    }


    await setPassword(

        administrator.id,

        DEVELOPMENT_BOOTSTRAP_PASSWORD,

        {
            mustChangePassword:
                true
        }

    );

}


/**
 * Verify one username/password pair.
 */
export async function verifyCredentials(

    username:string,

    password:string

):Promise<string | null> {

    const normalizedUsername =

        username
            .trim()
            .toLowerCase();


    if(

        normalizedUsername.length === 0

        ||

        password.length === 0

    ){

        return null;

    }


    const user =

        getUsers()

            .find(

                candidate =>
                    candidate.active
                    &&
                    candidate.username
                        .trim()
                        .toLowerCase()
                    ===
                    normalizedUsername

            );


    if(!user){

        return null;

    }


    const credential =

        getCredentialByUserId(
            user.id
        );


    if(!credential){

        return null;

    }


    const derivedHash =

        await derivePasswordHash(

            password,

            credential.salt,

            credential.iterations

        );


    return timingSafeStringEqual(

        derivedHash,

        credential.passwordHash

    )

        ? user.id

        : null;

}


/**
 * Set or replace one user's development password.
 */
export async function setPassword(

    userId:string,

    password:string,

    options?:{

        mustChangePassword?:boolean;

    }

):Promise<void> {

    const user =

        getUserById(
            userId
        );


    if(!user){

        throw new Error(

            "Cannot set a password for an unknown EDORI user."

        );

    }


    validatePassword(
        password
    );


    const credentials =

        readCredentials();


    const existingIndex =

        credentials.findIndex(

            credential =>
                credential.userId
                ===
                userId

        );


    const now =

        new Date().toISOString();


    const salt =

        createRandomSalt();


    const passwordHash =

        await derivePasswordHash(

            password,

            salt,

            DEFAULT_ITERATIONS

        );


    const credential:UserCredential = {

        userId,

        salt,

        passwordHash,

        iterations:
            DEFAULT_ITERATIONS,

        mustChangePassword:
            options?.mustChangePassword
            ?? false,

        passwordChangedAt:
            now,

        createdAt:
            existingIndex >= 0
                ? credentials[existingIndex]?.createdAt
                    ?? now
                : now,

        updatedAt:
            now

    };


    if(existingIndex >= 0){

        credentials[existingIndex] =

            credential;

    }
    else {

        credentials.push(

            credential

        );

    }


    writeCredentials(

        credentials

    );

}


/**
 * Return non-sensitive credential status for one user.
 */
export function getCredentialStatus(

    userId:string

):{

    configured:boolean;

    mustChangePassword:boolean;

    passwordChangedAt:string | null;

} {

    const credential =

        getCredentialByUserId(
            userId
        );


    if(!credential){

        return {

            configured:
                false,

            mustChangePassword:
                false,

            passwordChangedAt:
                null

        };

    }


    return {

        configured:
            true,

        mustChangePassword:
            credential.mustChangePassword,

        passwordChangedAt:
            credential.passwordChangedAt

    };

}


/**
 * Determine whether the user must change the password.
 */
export function mustChangePassword(

    userId:string

):boolean {

    return getCredentialStatus(
        userId
    ).mustChangePassword;

}


/**
 * Remove credential material for one user.
 */
export function removeCredential(

    userId:string

):void {

    writeCredentials(

        readCredentials()

            .filter(

                credential =>
                    credential.userId
                    !==
                    userId

            )

    );

}


/**
 * Determine whether one user currently has a password.
 */
export function hasCredential(

    userId:string

):boolean {

    return (

        getCredentialByUserId(
            userId
        )

        !==

        null

    );

}


/**
 * Return one credential record.
 */
function getCredentialByUserId(

    userId:string

):UserCredential | null {

    return readCredentials()

        .find(

            credential =>
                credential.userId
                ===
                userId

        )

        ?? null;

}


/**
 * Derive a password hash with Web Crypto.
 */
async function derivePasswordHash(

    password:string,

    salt:string,

    iterations:number

):Promise<string> {

    if(

        typeof crypto === "undefined"

        ||

        !crypto.subtle

    ){

        throw new Error(

            "Secure browser cryptography is not available."

        );

    }


    const encoder =

        new TextEncoder();


    const keyMaterial =

        await crypto.subtle.importKey(

            "raw",

            encoder.encode(
                password
            ),

            "PBKDF2",

            false,

            [
                "deriveBits"
            ]

        );


    const derivedBits =

        await crypto.subtle.deriveBits(

            {

                name:
                    "PBKDF2",

                salt:
                    toArrayBuffer(
                        base64ToBytes(
                            salt
                        )
                    ),

                iterations,

                hash:
                    "SHA-256"

            },

            keyMaterial,

            256

        );


    return bytesToBase64(

        new Uint8Array(
            derivedBits
        )

    );

}


/**
 * Create a random 128-bit salt.
 */
function createRandomSalt():string {

    if(

        typeof crypto === "undefined"

        ||

        !crypto.getRandomValues

    ){

        throw new Error(

            "Secure random-number generation is not available."

        );

    }


    const bytes =

        new Uint8Array(
            16
        );


    crypto.getRandomValues(

        bytes

    );


    return bytesToBase64(

        bytes

    );

}


/**
 * Apply a practical development password floor.
 */
function validatePassword(

    password:string

):void {

    if(password.length < 12){

        throw new Error(

            "EDORI passwords must contain at least 12 characters."

        );

    }


    if(password.length > 128){

        throw new Error(

            "EDORI passwords cannot exceed 128 characters."

        );

    }

}


/**
 * Read stored credentials defensively.
 */
function readCredentials():UserCredential[] {

    let storedValue:string | null = null;


    try {

        storedValue =

            localStorage.getItem(

                CREDENTIAL_STORAGE_KEY

            );

    }
    catch(error){

        console.error(

            "CredentialService could not read stored credentials.",

            error

        );


        return [];

    }


    if(!storedValue){

        return [];

    }


    try {

        const parsed:unknown =

            JSON.parse(
                storedValue
            );


        if(!Array.isArray(parsed)){

            return [];

        }


        return parsed

            .filter(

                isUserCredential

            )

            .map(

                credential => ({

                    ...credential,

                    mustChangePassword:
                        credential.mustChangePassword
                        ?? false,

                    passwordChangedAt:
                        credential.passwordChangedAt
                        ?? credential.updatedAt

                })

            );

    }
    catch(error){

        console.error(

            "CredentialService could not parse stored credentials.",

            error

        );


        return [];

    }

}


/**
 * Persist credentials.
 */
function writeCredentials(

    credentials:UserCredential[]

):void {

    try {

        localStorage.setItem(

            CREDENTIAL_STORAGE_KEY,

            JSON.stringify(

                credentials

            )

        );

    }
    catch(error){

        console.error(

            "CredentialService could not persist credentials.",

            error

        );


        throw new Error(

            "EDORI could not save the password credential."

        );

    }

}


/**
 * Runtime credential validation.
 */
function isUserCredential(

    value:unknown

):value is UserCredential {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return false;

    }


    const candidate =

        value as Partial<UserCredential>;


    return (

        typeof candidate.userId
        ===
        "string"

        &&

        typeof candidate.salt
        ===
        "string"

        &&

        typeof candidate.passwordHash
        ===
        "string"

        &&

        typeof candidate.iterations
        ===
        "number"

        &&

        Number.isFinite(
            candidate.iterations
        )

        &&

        candidate.iterations > 0

        &&

        typeof candidate.createdAt
        ===
        "string"

        &&

        typeof candidate.updatedAt
        ===
        "string"

        &&

        (
            candidate.mustChangePassword === undefined
            ||
            typeof candidate.mustChangePassword === "boolean"
        )

        &&

        (
            candidate.passwordChangedAt === undefined
            ||
            typeof candidate.passwordChangedAt === "string"
        )

    );

}


/**
 * Constant-work comparison for equal-length strings.
 */
function timingSafeStringEqual(

    first:string,

    second:string

):boolean {

    if(first.length !== second.length){

        return false;

    }


    let difference = 0;


    for(

        let index = 0;

        index < first.length;

        index += 1

    ){

        difference |=

            first.charCodeAt(
                index
            )

            ^

            second.charCodeAt(
                index
            );

    }


    return difference === 0;

}


/**
 * Copy bytes into a plain ArrayBuffer for Web Crypto.
 *
 * This avoids TypeScript DOM typing conflicts where
 * Uint8Array may be backed by ArrayBufferLike.
 */
function toArrayBuffer(

    bytes:Uint8Array

):ArrayBuffer {

    const copy =

        new Uint8Array(
            bytes.length
        );


    copy.set(
        bytes
    );


    return copy.buffer;

}


/**
 * Convert bytes to base64.
 */
function bytesToBase64(

    bytes:Uint8Array

):string {

    let binary = "";


    bytes.forEach(

        byte => {

            binary +=

                String.fromCharCode(
                    byte
                );

        }

    );


    return btoa(
        binary
    );

}


/**
 * Convert base64 to bytes.
 */
function base64ToBytes(

    value:string

):Uint8Array {

    const binary =

        atob(
            value
        );


    const bytes =

        new Uint8Array(
            binary.length
        );


    for(

        let index = 0;

        index < binary.length;

        index += 1

    ){

        bytes[index] =

            binary.charCodeAt(
                index
            );

    }


    return bytes;

}