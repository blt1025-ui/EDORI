import { calculateDemand } from "./DemandService";
import { numberValue } from "./DomService";

export function updateDemand() {

    const occupiedBeds = numberValue("occupiedBeds");

const hallwayPatients = numberValue("hallwayPatients");

const waitingPatients = numberValue("waitingPatients");

    const result = calculateDemand(
        occupiedBeds,
        hallwayPatients,
        waitingPatients
    );

    document.getElementById("totalVolume")!.textContent =
        result.totalVolume.toString();

    document.getElementById("occupancyRatio")!.textContent =
    `${result.totalVolume}/63 (${(result.occupancyRatio * 100).toFixed(0)}%)`;

    document.getElementById("volumeCard")!.textContent =
        result.totalVolume.toString();

}