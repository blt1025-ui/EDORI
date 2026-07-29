import { defaultSettings } from "../config/defaultSettings";

export interface DemandResult {

    occupancyRatio:number;

    boardingPercent:number;

}

export function calculateDemand(

    totalEDVolume:number,

    boardedPatients:number

):DemandResult{

    return{

        occupancyRatio:
            totalEDVolume/defaultSettings.edCapacity,

        boardingPercent:
            boardedPatients/Math.max(totalEDVolume,1)

    };

}