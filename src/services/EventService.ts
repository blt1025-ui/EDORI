import { updateDemand } from "./UpdateDemand";

export function registerEventHandlers() {

    const ids = [

        "occupiedBeds",

        "hallwayPatients",

        "waitingPatients"

    ];

    ids.forEach(id => {

        const input = document.getElementById(id);

        if (!input) return;

        input.addEventListener("input", () => {

            updateDemand();

        });

    });

}