/**
 * OperationalStatusService
 *
 * Converts EDORI scores into
 * operational dashboard states.
 */


import {

    OPERATIONAL_STATES

}

from "../config/operationalStates";


import type {

    OperationalState

}

from "../config/operationalStates";




export function getOperationalState(

    score:number

):OperationalState {


    const state =

        OPERATIONAL_STATES.find(

            item =>

                score >= item.minimum

                &&

                score <= item.maximum

        );



    if(state){

        return state;

    }



    return OPERATIONAL_STATES[0];

}