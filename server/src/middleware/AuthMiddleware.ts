/**
 * AuthMiddleware
 *
 * Resolves EDORI sessions from the HttpOnly cookie.
 */

import type {

    NextFunction,
    Request,
    Response

}

from "express";


import {

    findActiveSessionByToken

}

from "../repositories/SessionRepository.js";


import {

    findUserById

}

from "../repositories/UserRepository.js";


import {

    touchUserSession

}

from "../services/SessionService.js";


export const EDORI_SESSION_COOKIE =

    "edori_session";


export interface AuthenticatedRequest extends Request {

    edoriUser?:{

        id:string;

        username:string;

        displayName:string;

        email:string;

        role:
            | "viewer"
            | "operator"
            | "administrator";

        active:boolean;

    };

    edoriSessionToken?:string;

}


export async function requireAuthentication(

    request:AuthenticatedRequest,

    response:Response,

    next:NextFunction

):Promise<void> {

    try {

        const token =

            readCookie(

                request.headers.cookie,

                EDORI_SESSION_COOKIE

            );


        if(!token){

            response.status(401).json({

                error:
                    "unauthorized"

            });


            return;

        }


        const session =

            await findActiveSessionByToken(
                token
            );


        if(!session){

            response.status(401).json({

                error:
                    "unauthorized"

            });


            return;

        }


        const user =

            await findUserById(
                session.userId
            );


        if(

            !user

            ||

            !user.active

        ){

            response.status(401).json({

                error:
                    "unauthorized"

            });


            return;

        }


        await touchUserSession(

            session.id,

            user.role

        );


        request.edoriUser =
            user;


        request.edoriSessionToken =
            token;


        next();

    }
    catch(error){

        next(
            error
        );

    }

}


function readCookie(

    rawCookieHeader:string | undefined,

    name:string

):string | null {

    if(!rawCookieHeader){

        return null;

    }


    const cookies =

        rawCookieHeader.split(
            ";"
        );


    for(const cookie of cookies){

        const separatorIndex =

            cookie.indexOf(
                "="
            );


        if(separatorIndex < 0){

            continue;

        }


        const cookieName =

            cookie
                .slice(
                    0,
                    separatorIndex
                )
                .trim();


        if(cookieName !== name){

            continue;

        }


        return decodeURIComponent(

            cookie
                .slice(
                    separatorIndex + 1
                )
                .trim()

        );

    }


    return null;

}