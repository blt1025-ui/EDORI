/**
 * ModelConfigurationRoutes
 *
 * Authenticated API for EDORI model configuration
 * overrides.
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

    clearModelConfigurationOverride,
    getModelConfigurationOverride,
    saveModelConfigurationOverride

}

from "../repositories/ModelConfigurationRepository.js";


import type {

    StoredModelConfiguration

}

from "../repositories/ModelConfigurationRepository.js";


export const modelConfigurationRouter =

    Router();


const MODEL_CONFIGURATION_SCHEMA_VERSION = 1;

const WEIGHT_TOLERANCE = 0.000001;


modelConfigurationRouter.use(
    requireAuthentication
);


/**
 * Read the optional saved model override.
 *
 * A null override means the frontend should use its
 * built-in TypeScript defaults.
 */
modelConfigurationRouter.get(

    "/",

    requirePermission(
        "operational.view"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                override:
                    await getModelConfigurationOverride()

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
 * Save or replace the complete model override.
 */
modelConfigurationRouter.put(

    "/",

    requirePermission(
        "modelConfiguration.manage"
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


            const validation =

                configuration

                    ? validateConfiguration(
                        configuration
                    )

                    : {
                        valid:false,
                        errors:[
                            "The model configuration payload is invalid."
                        ]
                    };


            if(
                !configuration
                ||
                !validation.valid
            ){

                response.status(400).json({

                    error:
                        "invalid_model_configuration",

                    message:
                        "The EDORI model configuration is invalid.",

                    errors:
                        validation.errors

                });


                return;

            }


            await saveModelConfigurationOverride({

                schemaVersion:
                    MODEL_CONFIGURATION_SCHEMA_VERSION,

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
                    await getModelConfigurationOverride()

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
 * Remove the saved override and return to built-in
 * application defaults.
 */
modelConfigurationRouter.delete(

    "/",

    requirePermission(
        "modelConfiguration.manage"
    ),

    async (_request, response, next) => {

        try {

            response.status(200).json({

                cleared:
                    await clearModelConfigurationOverride()

            });

        }
        catch(error){

            next(
                error
            );

        }

    }

);


interface ConfigurationValidationResult {

    valid:boolean;

    errors:string[];

}


function normalizeConfiguration(

    value:unknown

):StoredModelConfiguration | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        hospital?:{
            edCapacity?:unknown;
        };

        domainWeights?:{
            edPressure?:unknown;
            acuteCapacity?:unknown;
            criticalCapacity?:unknown;
            inflow?:unknown;
            projectedCapacity?:unknown;
        };

        edPressureWeights?:{
            volume?:unknown;
            boarding?:unknown;
            acuity?:unknown;
        };

        operationalLevels?:unknown;

    };


    if(
        !candidate.hospital
        ||
        !candidate.domainWeights
        ||
        !candidate.edPressureWeights
        ||
        !Array.isArray(
            candidate.operationalLevels
        )
    ){

        return null;

    }


    const operationalLevels =

        candidate.operationalLevels.map(
            normalizeOperationalLevel
        );


    if(
        operationalLevels.some(
            level =>
                level === null
        )
    ){

        return null;

    }


    return {

        hospital:{
            edCapacity:
                Number(
                    candidate.hospital.edCapacity
                )
        },

        domainWeights:{
            edPressure:
                Number(
                    candidate.domainWeights.edPressure
                ),

            acuteCapacity:
                Number(
                    candidate.domainWeights.acuteCapacity
                ),

            criticalCapacity:
                Number(
                    candidate.domainWeights.criticalCapacity
                ),

            inflow:
                Number(
                    candidate.domainWeights.inflow
                ),

            projectedCapacity:
                Number(
                    candidate.domainWeights.projectedCapacity
                )
        },

        edPressureWeights:{
            volume:
                Number(
                    candidate.edPressureWeights.volume
                ),

            boarding:
                Number(
                    candidate.edPressureWeights.boarding
                ),

            acuity:
                Number(
                    candidate.edPressureWeights.acuity
                )
        },

        operationalLevels:
            operationalLevels as StoredModelConfiguration[
                "operationalLevels"
            ]

    };

}


function normalizeOperationalLevel(

    value:unknown

):StoredModelConfiguration["operationalLevels"][number] | null {

    if(
        typeof value !== "object"
        ||
        value === null
    ){

        return null;

    }


    const candidate = value as {

        title?:unknown;

        minimum?:unknown;

        maximum?:unknown;

    };


    const titles:StoredModelConfiguration[
        "operationalLevels"
    ][number]["title"][] = [

        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo"

    ];


    if(
        typeof candidate.title !== "string"
        ||
        !titles.includes(
            candidate.title as typeof titles[number]
        )
    ){

        return null;

    }


    return {

        title:
            candidate.title as typeof titles[number],

        minimum:
            Number(
                candidate.minimum
            ),

        maximum:
            Number(
                candidate.maximum
            )

    };

}


function validateConfiguration(

    configuration:StoredModelConfiguration

):ConfigurationValidationResult {

    const errors:string[] = [];


    validatePositiveNumber(

        configuration.hospital.edCapacity,

        "ED capacity",

        errors

    );


    validateWeights(

        [
            configuration.domainWeights.edPressure,
            configuration.domainWeights.acuteCapacity,
            configuration.domainWeights.criticalCapacity,
            configuration.domainWeights.inflow,
            configuration.domainWeights.projectedCapacity
        ],

        "HRI domain",

        errors

    );


    validateWeights(

        [
            configuration.edPressureWeights.volume,
            configuration.edPressureWeights.boarding,
            configuration.edPressureWeights.acuity
        ],

        "ED Operational Pressure component",

        errors

    );


    validateOperationalLevels(

        configuration.operationalLevels,

        errors

    );


    return {

        valid:
            errors.length === 0,

        errors

    };

}


function validatePositiveNumber(

    value:number,

    label:string,

    errors:string[]

):void {

    if(
        !Number.isFinite(
            value
        )
        ||
        value <= 0
    ){

        errors.push(
            `${label} must be greater than 0.`
        );

    }

}


function validateWeights(

    values:number[],

    label:string,

    errors:string[]

):void {

    values.forEach(

        (value,index) => {

            if(
                !Number.isFinite(
                    value
                )
                ||
                value < 0
                ||
                value > 1
            ){

                errors.push(
                    `${label} weight ${index + 1} must be between 0% and 100%.`
                );

            }

        }

    );


    const total =

        values.reduce(
            (sum,value) =>
                sum + value,
            0
        );


    if(
        Number.isFinite(
            total
        )
        &&
        Math.abs(
            total - 1
        )
        >
        WEIGHT_TOLERANCE
    ){

        errors.push(
            `${label} weights must total 100%.`
        );

    }

}


function validateOperationalLevels(

    levels:StoredModelConfiguration["operationalLevels"],

    errors:string[]

):void {

    const expectedTitles:StoredModelConfiguration[
        "operationalLevels"
    ][number]["title"][] = [

        "Alpha",
        "Bravo",
        "Charlie",
        "Delta",
        "Echo"

    ];


    if(
        levels.length
        !==
        expectedTitles.length
    ){

        errors.push(
            "Operational configuration must contain exactly five levels: Alpha through Echo."
        );

        return;

    }


    levels.forEach(

        (level,index) => {

            if(
                level.title
                !==
                expectedTitles[index]
            ){

                errors.push(
                    "Operational levels must remain ordered Alpha, Bravo, Charlie, Delta, Echo."
                );

            }


            if(
                !Number.isInteger(
                    level.minimum
                )
                ||
                !Number.isInteger(
                    level.maximum
                )
            ){

                errors.push(
                    `${level.title} score boundaries must be whole numbers.`
                );

            }


            if(
                level.minimum < 0
                ||
                level.maximum > 100
            ){

                errors.push(
                    `${level.title} score boundaries must remain between 0 and 100.`
                );

            }


            if(
                level.minimum
                >
                level.maximum
            ){

                errors.push(
                    `${level.title} minimum score cannot exceed its maximum score.`
                );

            }

        }

    );


    if(
        levels[0]?.minimum
        !==
        0
    ){

        errors.push(
            "Alpha must begin at score 0."
        );

    }


    if(
        levels[
            levels.length - 1
        ]?.maximum
        !==
        100
    ){

        errors.push(
            "Echo must end at score 100."
        );

    }


    for(
        let index = 1;
        index < levels.length;
        index += 1
    ){

        const previous =
            levels[index - 1];

        const current =
            levels[index];


        if(
            !previous
            ||
            !current
        ){

            continue;

        }


        if(
            current.minimum
            !==
            previous.maximum + 1
        ){

            errors.push(
                `${previous.title} and ${current.title} must have contiguous, non-overlapping score ranges.`
            );

        }

    }

}