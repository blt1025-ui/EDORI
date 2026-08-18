/**
 * TriggerConfigurationRoutes
 *
 * Authenticated API for EDORI hospital-specific
 * operational-trigger overrides.
 *
 * Protected trigger logic is never accepted through this
 * endpoint. Only triggerId, enabled, and interventionIds
 * are persisted.
 */

import {

    Router

}

from "express";


import {

    requireAuthentication

}

from "../middleware/AuthMiddleware.js";


import type {

    AuthenticatedRequest

}

from "../middleware/AuthMiddleware.js";


import {

    requirePermission

}

from "../middleware/AuthorizationMiddleware.js";


import {

    clearTriggerConfigurationOverride,
    getTriggerConfigurationOverride,
    saveTriggerConfigurationOverride

}

from "../repositories/TriggerConfigurationRepository.js";


import type {

    StoredTriggerConfiguration,
    StoredTriggerConfigurationOverride

}

from "../repositories/TriggerConfigurationRepository.js";


export const triggerConfigurationRouter =

    Router();


const TRIGGER_CONFIGURATION_SCHEMA_VERSION = 1;


triggerConfigurationRouter.use(
    requireAuthentication
);


/**
 * Read the optional hospital-specific trigger override.
 */
triggerConfigurationRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                override:
                    await getTriggerConfigurationOverride()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Save or replace the hospital-specific trigger override.
 */
triggerConfigurationRouter.put(

    "/",

    requirePermission(
        "triggerConfiguration.manage"
    ),

    async (
        request:AuthenticatedRequest,
        response,
        next
    ) => {

        try {

            const user =
                request.edoriUser;


            if(!user){

                response.status(401).json({

                    error:
                        "unauthorized"

                });


                return;

            }


            const configuration =

                normalizeConfiguration(
                    request.body?.configuration
                );


            if(!configuration){

                response.status(400).json({

                    error:
                        "invalid_trigger_configuration",

                    message:
                        "The EDORI trigger configuration is invalid."

                });


                return;

            }


            await saveTriggerConfigurationOverride({

                schemaVersion:
                    TRIGGER_CONFIGURATION_SCHEMA_VERSION,

                savedAt:
                    new Date().toISOString(),

                savedByUserId:
                    user.id,

                savedByUsername:
                    user.username,

                savedByDisplayName:
                    user.displayName,

                configuration

            });


            response.status(200).json({

                saved:
                    true,

                override:
                    await getTriggerConfigurationOverride()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


/**
 * Restore built-in trigger behavior.
 */
triggerConfigurationRouter.delete(

    "/",

    requirePermission(
        "triggerConfiguration.manage"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearTriggerConfigurationOverride()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


function normalizeConfiguration(

    value:unknown

):StoredTriggerConfiguration | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        schemaVersion?:unknown;

        overrides?:unknown;

    };


    if(
        candidate.schemaVersion
        !==
        TRIGGER_CONFIGURATION_SCHEMA_VERSION
        ||
        !Array.isArray(
            candidate.overrides
        )
    ){

        return null;

    }


    const normalizedOverrides =

        candidate.overrides.map(
            normalizeOverride
        );


    if(
        normalizedOverrides.some(
            override =>
                override === null
        )
    ){

        return null;

    }


    const overrides =

        normalizedOverrides as StoredTriggerConfigurationOverride[];


    const seenTriggerIds =

        new Set<string>();


    for(const override of overrides){

        if(
            seenTriggerIds.has(
                override.triggerId
            )
        ){

            return null;

        }


        seenTriggerIds.add(
            override.triggerId
        );

    }


    return {

        schemaVersion:
            TRIGGER_CONFIGURATION_SCHEMA_VERSION,

        overrides

    };

}


function normalizeOverride(

    value:unknown

):StoredTriggerConfigurationOverride | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        triggerId?:unknown;

        enabled?:unknown;

        interventionIds?:unknown;

    };


    if(
        typeof candidate.triggerId !== "string"
        ||
        !candidate.triggerId.trim()
        ||
        typeof candidate.enabled !== "boolean"
        ||
        !Array.isArray(
            candidate.interventionIds
        )
    ){

        return null;

    }


    const interventionIds:string[] = [];


    for(const value of candidate.interventionIds){

        if(
            typeof value !== "string"
            ||
            !value.trim()
        ){

            return null;

        }


        const normalized =
            value.trim();


        if(
            interventionIds.includes(
                normalized
            )
        ){

            return null;

        }


        interventionIds.push(
            normalized
        );

    }


    return {

        triggerId:
            candidate.triggerId.trim(),

        enabled:
            candidate.enabled,

        interventionIds

    };

}