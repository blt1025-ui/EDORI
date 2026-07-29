import { defaultSettings } from "../config/defaultSettings";

export interface DemandResult {
    totalVolume: number;
    occupancyRatio: number;
}

export function calculateDemand(
    occupiedBeds: number,
    hallwayPatients: number,
    waitingPatients: number
): DemandResult {

    const totalVolume =
        occupiedBeds +
        hallwayPatients +
        waitingPatients;

    const occupancyRatio =
        totalVolume /
        defaultSettings.edCapacity;

    return {
        totalVolume,
        occupancyRatio
    };

}