/**
 * DemandService
 *
 * Calculates simple Emergency Department demand
 * metrics using the effective administrative
 * configuration.
 */

import {

    getConfiguration

}

from "./ConfigurationService";


export interface DemandResult {

    occupancyRatio:number;

    boardingPercent:number;

}


/**
 * Calculate current ED demand indicators.
 */
export function calculateDemand(

    totalEDVolume:number,

    boardedPatients:number

):DemandResult {

    const configuration =

        getConfiguration();


    const edCapacity =

        Math.max(

            1,

            configuration.hospital.edCapacity

        );


    return {

        occupancyRatio:

            totalEDVolume

            /

            edCapacity,


        boardingPercent:

            boardedPatients

            /

            Math.max(

                totalEDVolume,

                1

            )

    };

}