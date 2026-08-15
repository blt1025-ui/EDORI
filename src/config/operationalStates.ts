/**
 * Operational States
 *
 * Defines the five EDORI operational levels.
 *
 * Severity:
 *
 * Alpha   → Lowest
 * Bravo
 * Charlie
 * Delta
 * Echo    → Highest
 */

import type {

    OperationalStateTitle

}

from "../types/OperationalStateTitle";


export interface OperationalState {

    title:OperationalStateTitle;

    icon:string;

    color:string;

    recommendation:string;

}


export interface OperationalStateRange

extends OperationalState {

    minimum:number;

    maximum:number;

    description:string;

}


export const OPERATIONAL_STATES:

OperationalStateRange[] = [

    {

        minimum:
            0,

        maximum:
            19,

        title:
            "Alpha",

        icon:
            "🟢",

        color:
            "#16A34A",

        description:
            "Routine operations",

        recommendation:
            "Emergency department conditions are stable and within expected operating variation. Continue routine monitoring."

    },


    {

        minimum:
            20,

        maximum:
            39,

        title:
            "Bravo",

        icon:
            "🟡",

        color:
            "#EAB308",

        description:
            "Watch conditions",

        recommendation:
            "Operational demand is increasing. Monitor ED flow, boarding, acuity, and hospital capacity closely."

    },


    {

        minimum:
            40,

        maximum:
            59,

        title:
            "Charlie",

        icon:
            "🟠",

        color:
            "#F97316",

        description:
            "Sustained operational strain",

        recommendation:
            "Operational strain is developing. Review throughput barriers, available capacity, and emerging surge needs."

    },


    {

        minimum:
            60,

        maximum:
            79,

        title:
            "Delta",

        icon:
            "🔴",

        color:
            "#DC2626",

        description:
            "Elevated surge conditions",

        recommendation:
            "Significant operational strain is present. Activate coordinated surge interventions and increase reassessment frequency."

    },


    {

        minimum:
            80,

        maximum:
            100,

        title:
            "Echo",

        icon:
            "⚫",

        color:
            "#111827",

        description:
            "Critical operational conditions",

        recommendation:
            "Emergency department and hospital operations are under severe strain. Activate the highest appropriate organizational response."

    }

];


/**
 * Return the operational state associated
 * with an EDORI score.
 */
export function getOperationalState(

    score:number

):OperationalState {

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


    const match = OPERATIONAL_STATES.find(

        state =>

            safeScore >= state.minimum

            &&

            safeScore <= state.maximum

    );


    const selectedState = match

        ?? OPERATIONAL_STATES[0];


    return {

        title:
            selectedState.title,

        icon:
            selectedState.icon,

        color:
            selectedState.color,

        recommendation:
            selectedState.recommendation

    };

}


/**
 * Return the full configured range for a score.
 */
export function getOperationalStateRange(

    score:number

):OperationalStateRange {

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


    return OPERATIONAL_STATES.find(

        state =>

            safeScore >= state.minimum

            &&

            safeScore <= state.maximum

    )

    ?? OPERATIONAL_STATES[0];

}


/**
 * Return an operational state by title.
 */
export function getOperationalStateByTitle(

    title:OperationalStateTitle

):OperationalState {

    const match = OPERATIONAL_STATES.find(

        state =>

            state.title === title

    );


    const selectedState = match

        ?? OPERATIONAL_STATES[0];


    return {

        title:
            selectedState.title,

        icon:
            selectedState.icon,

        color:
            selectedState.color,

        recommendation:
            selectedState.recommendation

    };

}


/**
 * Return severity rank from lowest to highest.
 */
export function getOperationalStateRank(

    title:OperationalStateTitle

):number {

    const index = OPERATIONAL_STATES.findIndex(

        state =>

            state.title === title

    );


    return index >= 0

        ? index

        : 0;

}