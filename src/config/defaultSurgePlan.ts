/**
 * Default Hospital Surge Plan
 *
 * Creates the built-in operational response plan
 * from the EDORI intervention library.
 *
 * The intervention library remains the authoritative
 * source for factory-default actions.
 *
 * Hospital-specific customization is handled by
 * SurgePlanService and must not mutate the built-in
 * intervention definitions.
 */

import {

    OPERATIONAL_INTERVENTIONS

}

from "./interventions";


import {

    SURGE_PLAN_SCHEMA_VERSION

}

from "../types/SurgePlanConfiguration";


import type {

    SurgePlanConfiguration

}

from "../types/SurgePlanConfiguration";


/**
 * Return a fresh copy of the built-in surge plan.
 *
 * A new object is returned every time so callers
 * cannot accidentally mutate factory defaults.
 */
export function getDefaultSurgePlan():

SurgePlanConfiguration {

    return {

        schemaVersion:
            SURGE_PLAN_SCHEMA_VERSION,

        name:
            "Hospital Surge Plan",

        description:
            "Built-in operational response actions associated with Hospital Readiness operational triggers.",

        interventions:
            OPERATIONAL_INTERVENTIONS.map(

                intervention => ({

                    ...intervention

                })

            )

    };

}