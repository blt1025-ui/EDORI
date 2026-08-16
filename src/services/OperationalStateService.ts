/**
 * OperationalStateService
 *
 * Central runtime resolver for Hospital Readiness
 * operational levels.
 *
 * Numerical Alpha through Echo boundaries are read
 * from the effective System Configuration.
 *
 * Presentation metadata such as icon, color, and
 * recommendation continues to come from the built-in
 * operational-state definitions.
 */

import {

    getConfiguration

}

from "./ConfigurationService";


import {

    getOperationalStateByTitle

}

from "../config/operationalStates";


import type {

    OperationalState

}

from "../config/operationalStates";


import type {

    OperationalStateTitle

}

from "../types/OperationalStateTitle";


/**
 * Resolve a Hospital Readiness score using the
 * currently effective administrative Alpha through
 * Echo ranges.
 */
export function getConfiguredOperationalState(

    score:number

):OperationalState {

    const configuration =

        getConfiguration();


    const safeScore =

        Math.min(

            100,

            Math.max(

                0,

                Math.round(

                    Number.isFinite(score)

                        ? score

                        : 0

                )

            )

        );


    const configuredLevel =

        configuration.operationalLevels.find(

            level =>

                safeScore >= level.minimum

                &&

                safeScore <= level.maximum

        );


    const selectedTitle:OperationalStateTitle =

        configuredLevel?.title

        ??

        "Alpha";


    return getOperationalStateByTitle(

        selectedTitle

    );

}


/**
 * Resolve only the configured operational-level
 * title for a score.
 */
export function getConfiguredOperationalStateTitle(

    score:number

):OperationalStateTitle {

    return getConfiguredOperationalState(

        score

    ).title;

}