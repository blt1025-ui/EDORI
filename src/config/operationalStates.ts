/**
 * Operational States
 *
 * Defines the visual and operational interpretation
 * associated with EDORI score ranges.
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

}


export const OPERATIONAL_STATES:

OperationalStateRange[] = [

    {

        minimum:0,

        maximum:20,

        title:
            "Normal Operations",

        icon:
            "🟢",

        color:
            "#2E7D32",

        recommendation:
            "Emergency department operations are stable. Continue routine monitoring."

    },


    {

        minimum:21,

        maximum:40,

        title:
            "Elevated Activity",

        icon:
            "🔵",

        color:
            "#1565C0",

        recommendation:
            "Patient demand is increasing. Monitor patient flow and hospital capacity closely."

    },


    {

        minimum:41,

        maximum:60,

        title:
            "Busy",

        icon:
            "🟡",

        color:
            "#F9A825",

        recommendation:
            "Operational strain is developing. Evaluate throughput barriers and available capacity."

    },


    {

        minimum:61,

        maximum:80,

        title:
            "Surge",

        icon:
            "🟠",

        color:
            "#EF6C00",

        recommendation:
            "Hospital surge interventions should be considered. Increase operational awareness and throughput response."

    },


    {

        minimum:81,

        maximum:100,

        title:
            "Severe Surge",

        icon:
            "🔴",

        color:
            "#C62828",

        recommendation:
            "Immediate hospital-wide intervention is recommended. Activate the highest appropriate surge response."

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


    if(!match){

        const fallback =

            OPERATIONAL_STATES[0];


        return {

            title:
                fallback.title,

            icon:
                fallback.icon,

            color:
                fallback.color,

            recommendation:
                fallback.recommendation

        };

    }


    return {

        title:
            match.title,

        icon:
            match.icon,

        color:
            match.color,

        recommendation:
            match.recommendation

    };

}