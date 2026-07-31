/**
 * EdoriResult
 *
 * Output of the EDORI calculation engine.
 */

import type { Driver } 
from "./Driver";


import type { OperationalState }
from "../config/operationalStates";



export interface EdoriResult {


    /**
     * Overall EDORI score
     * 0-100
     */
    score:number;



    /**
     * Basic status label
     */
    status:string;



    /**
     * Expanded operational interpretation
     */
    operationalState:OperationalState;



    /**
     * Individual scoring domains
     */

    demandScore:number;

    boardingScore:number;

    hospitalScore:number;

    capacityScore:number;

    acuityScore:number;

    forecastScore:number;



    /**
     * Explanation of score
     */

    drivers:Driver[];



    /**
     * Recommended actions
     */

    recommendations:string[];



    /**
     * Calculation timestamp
     */

    timestamp:Date;

}