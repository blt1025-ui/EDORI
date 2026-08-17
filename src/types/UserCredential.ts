/**
 * UserCredential
 *
 * Development authentication credential metadata.
 *
 * IMPORTANT:
 * This browser-persisted credential model is used only
 * while EDORI is being developed without a backend.
 * Production authentication will move password
 * verification and session management to the server.
 */

export interface UserCredential {

    userId:string;

    salt:string;

    passwordHash:string;

    iterations:number;

    mustChangePassword:boolean;

    passwordChangedAt:string;

    createdAt:string;

    updatedAt:string;

}