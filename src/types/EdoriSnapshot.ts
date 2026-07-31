/**
 * EdoriSnapshot
 *
 * Represents a historical EDORI measurement.
 *
 * Used for trend analysis,
 * reporting, and operational review.
 */


import type { OperationalState }
from "../config/operationalStates";



export interface EdoriSnapshot {


    /**
     * EDORI numerical score
     */

    score:number;



    /**
     * Operational category
     */

    status:string;



    /**
     * Expanded operational state
     */

    operationalState:OperationalState;



    /**
     * Time of measurement
     */

    timestamp:Date;


}