import { numberValue } from "./DomService";
import { calculateDemand } from "./DemandService";
import { defaultSettings } from "../config/defaultSettings";

export function updateDemand() {

    const totalVolume = numberValue("totalEDVolume");
    const boardedPatients = numberValue("boardedPatients");

    const result = calculateDemand(
        totalVolume,
        boardedPatients
    );

    document.getElementById("volumeCard")!.textContent =
        totalVolume.toString();

    document.getElementById("occupancyRatio")!.textContent =
        `${totalVolume}/${defaultSettings.edCapacity} (${(result.occupancyRatio * 100).toFixed(0)}%)`;

    document.getElementById("boardingPercent")!.textContent =
        `${(result.boardingPercent * 100).toFixed(0)}%`;

}