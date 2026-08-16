/**
 * UpdateDemand
 *
 * Updates legacy ED-demand display elements using
 * the effective administrative configuration.
 */

import {

    numberValue

}

from "./DomService";


import {

    calculateDemand

}

from "./DemandService";


import {

    getConfiguration

}

from "./ConfigurationService";


/**
 * Refresh ED-demand display values.
 */
export function updateDemand():void {

    const totalVolume =

        numberValue(

            "totalEDVolume"

        );


    const boardedPatients =

        numberValue(

            "boardedPatients"

        );


    const configuration =

        getConfiguration();


    const edCapacity =

        Math.max(

            1,

            configuration.hospital.edCapacity

        );


    const result =

        calculateDemand(

            totalVolume,

            boardedPatients

        );


    const volumeCard =

        document.getElementById(

            "volumeCard"

        );


    if(volumeCard){

        volumeCard.textContent =

            totalVolume.toString();

    }


    const occupancyRatio =

        document.getElementById(

            "occupancyRatio"

        );


    if(occupancyRatio){

        occupancyRatio.textContent =

            `${totalVolume}/${edCapacity} (${(
                result.occupancyRatio * 100
            ).toFixed(0)}%)`;

    }


    const boardingPercent =

        document.getElementById(

            "boardingPercent"

        );


    if(boardingPercent){

        boardingPercent.textContent =

            `${(
                result.boardingPercent * 100
            ).toFixed(0)}%`;

    }

}