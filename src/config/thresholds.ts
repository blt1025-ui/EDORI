/**
 * EDORI Operational Thresholds
 *
 * Maps EDORI scores to
 * operational states.
 */


import {

    OPERATIONAL_STATES

}

from "./operationalStates";


import type {

    OperationalState

}

from "./operationalStates";







export interface Threshold {


    min:number;


    max:number;


    operationalState:OperationalState;


}







export const THRESHOLDS:Threshold[] = [


    {


        min:0,


        max:24,


        operationalState:

            OPERATIONAL_STATES[0]


    },


    {


        min:25,


        max:39,


        operationalState:

            OPERATIONAL_STATES[1]


    },



    {


        min:40,


        max:54,


        operationalState:

            OPERATIONAL_STATES[2]


    },



    {


        min:55,


        max:69,


        operationalState:

            OPERATIONAL_STATES[3]


    },



    {


        min:70,


        max:100,


        operationalState:

            OPERATIONAL_STATES[4]


    }


];









export function getThreshold(

    score:number

):Threshold {


    for(const threshold of THRESHOLDS){


        if(

            score >= threshold.min

            &&

            score <= threshold.max

        ){


            return threshold;


        }


    }




    return THRESHOLDS[0];


}