/**
 * SurgePlanRoutes
 *
 * Authenticated API for the optional hospital-specific
 * EDORI surge-plan override.
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

    clearSurgePlanOverride,
    getSurgePlanOverride,
    saveSurgePlanOverride

}

from "../repositories/SurgePlanRepository.js";


import type {

    StoredSurgePlanConfiguration,
    StoredSurgePlanIntervention,
    SurgePlanCategory,
    SurgePlanPriority

}

from "../repositories/SurgePlanRepository.js";


export const surgePlanRouter =

    Router();


const SURGE_PLAN_SCHEMA_VERSION = 1;


const VALID_CATEGORIES:SurgePlanCategory[] = [

    "ED Capacity",
    "ED Flow",
    "Boarding",
    "Hospital Throughput",
    "Leadership Escalation",
    "Clinical Operations",
    "Monitoring"

];


const VALID_PRIORITIES:SurgePlanPriority[] = [

    "Routine",
    "Moderate",
    "High",
    "Immediate"

];


surgePlanRouter.use(
    requireAuthentication
);


/**
 * Read the optional saved surge-plan override.
 */
surgePlanRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                override:
                    await getSurgePlanOverride()

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
 * Save or replace the complete surge-plan override.
 */
surgePlanRouter.put(

    "/",

    requirePermission(
        "surgePlan.manage"
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
                        "invalid_surge_plan",

                    message:
                        "The EDORI Hospital Surge Plan is invalid."

                });


                return;

            }


            await saveSurgePlanOverride({

                schemaVersion:
                    SURGE_PLAN_SCHEMA_VERSION,

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
                    await getSurgePlanOverride()

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
 * Restore built-in surge-plan defaults.
 */
surgePlanRouter.delete(

    "/",

    requirePermission(
        "surgePlan.manage"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearSurgePlanOverride()

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

):StoredSurgePlanConfiguration | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        schemaVersion?:unknown;

        name?:unknown;

        description?:unknown;

        interventions?:unknown;

    };


    if(
        candidate.schemaVersion
        !==
        SURGE_PLAN_SCHEMA_VERSION
        ||
        typeof candidate.name !== "string"
        ||
        !candidate.name.trim()
        ||
        typeof candidate.description !== "string"
        ||
        !Array.isArray(
            candidate.interventions
        )
        ||
        candidate.interventions.length === 0
    ){

        return null;

    }


    const interventions =

        candidate.interventions.map(
            normalizeIntervention
        );


    if(
        interventions.some(
            intervention =>
                intervention === null
        )
    ){

        return null;

    }


    const normalizedInterventions =

        interventions as StoredSurgePlanIntervention[];


    const ids =

        new Set<string>();


    for(const intervention of normalizedInterventions){

        if(
            ids.has(
                intervention.id
            )
        ){

            return null;

        }


        ids.add(
            intervention.id
        );

    }


    return {

        schemaVersion:
            SURGE_PLAN_SCHEMA_VERSION,

        name:
            candidate.name.trim(),

        description:
            candidate.description.trim(),

        interventions:
            normalizedInterventions

    };

}


function normalizeIntervention(

    value:unknown

):StoredSurgePlanIntervention | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        id?:unknown;

        title?:unknown;

        description?:unknown;

        category?:unknown;

        defaultPriority?:unknown;

        responsibleGroup?:unknown;

        objective?:unknown;

        reassessmentMinutes?:unknown;

        enabled?:unknown;

    };


    if(
        typeof candidate.id !== "string"
        ||
        !candidate.id.trim()
        ||
        typeof candidate.title !== "string"
        ||
        !candidate.title.trim()
        ||
        typeof candidate.description !== "string"
        ||
        !candidate.description.trim()
        ||
        typeof candidate.category !== "string"
        ||
        !VALID_CATEGORIES.includes(
            candidate.category as SurgePlanCategory
        )
        ||
        typeof candidate.defaultPriority !== "string"
        ||
        !VALID_PRIORITIES.includes(
            candidate.defaultPriority as SurgePlanPriority
        )
        ||
        typeof candidate.responsibleGroup !== "string"
        ||
        !candidate.responsibleGroup.trim()
        ||
        typeof candidate.objective !== "string"
        ||
        !candidate.objective.trim()
        ||
        typeof candidate.enabled !== "boolean"
    ){

        return null;

    }


    const reassessmentMinutes =

        candidate.reassessmentMinutes === null

            ? null

            : typeof candidate.reassessmentMinutes === "number"
                &&
                Number.isFinite(
                    candidate.reassessmentMinutes
                )
                &&
                candidate.reassessmentMinutes > 0

                    ? candidate.reassessmentMinutes

                    : null;


    if(
        candidate.reassessmentMinutes !== null
        &&
        reassessmentMinutes === null
    ){

        return null;

    }


    return {

        id:
            candidate.id.trim(),

        title:
            candidate.title.trim(),

        description:
            candidate.description.trim(),

        category:
            candidate.category as SurgePlanCategory,

        defaultPriority:
            candidate.defaultPriority as SurgePlanPriority,

        responsibleGroup:
            candidate.responsibleGroup.trim(),

        objective:
            candidate.objective.trim(),

        reassessmentMinutes,

        enabled:
            candidate.enabled

    };

}