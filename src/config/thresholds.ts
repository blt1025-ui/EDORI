/**
 * EDORI Thresholds
 *
 * Maps numerical EDORI scores to the configured
 * Alpha through Echo operational states.
 */

import {

    OPERATIONAL_STATES

}

from "./operationalStates";


import type {

    OperationalState,

    OperationalStateRange

}

from "./operationalStates";


export interface Threshold {

    minimum:number;

    maximum:number;

    operationalState:OperationalState;

}


/**
 * Return the threshold associated with a score.
 */
export function getThreshold(

    score:number

):Threshold {

    const safeScore = Math.min(

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


    const match:OperationalStateRange =

        OPERATIONAL_STATES.find(

            state =>

                safeScore >= state.minimum

                &&

                safeScore <= state.maximum

        )

        ?? OPERATIONAL_STATES[0];


    return {

        minimum:
            match.minimum,

        maximum:
            match.maximum,

        operationalState:{

            title:
                match.title,

            icon:
                match.icon,

            color:
                match.color,

            recommendation:
                match.recommendation

        }

    };

}