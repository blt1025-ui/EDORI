/**
 * SummaryStatus
 *
 * Displays a live summary of the current
 * emergency department operational state.
 */

import { subscribe } from "../services/EventService";
import { getState } from "../services/StateService";
import { calculateEdori } from "../services/EdoriService";
import { HOSPITAL } from "../config/constants";

export function SummaryStatus(): string {

    return `

<section class="card summary-status">

    <div class="card-header">
        <h3>Current ED Status</h3>
    </div>

    <div class="summary-grid">

        <div class="summary-label">ED Volume</div>
        <div id="summaryVolume">0</div>

        <div class="summary-label">Boarding Patients</div>
        <div id="summaryBoarding">0</div>

        <div class="summary-label">Occupied Medical Beds</div>
        <div id="summaryBeds">0 / ${HOSPITAL.MEDICAL_BEDS}</div>

        <div class="summary-label">Registered Nurses</div>
        <div id="summaryRN">0</div>

        <div class="summary-label">Providers</div>
        <div id="summaryMD">0</div>

        <div class="summary-divider"></div>
        <div class="summary-divider"></div>

        <div class="summary-label summary-highlight">
            EDORI Score
        </div>

        <div
            id="summaryScore"
            class="summary-highlight">
            0
        </div>

        <div class="summary-label summary-highlight">
            Status
        </div>

        <div
            id="summaryStatus"
            class="summary-highlight">
            Normal
        </div>

    </div>

</section>

`;

}

export function initializeSummaryStatus(): void {

    updateSummaryStatus();

    subscribe(
        "stateChanged",
        updateSummaryStatus
    );

}

function updateSummaryStatus(): void {

    const state = getState();

    const result = calculateEdori(state);

    setText(
        "summaryVolume",
        state.totalEDVolume
    );

    setText(
        "summaryBoarding",
        state.boardedPatients
    );

    setText(
        "summaryBeds",
        `${state.occupiedMedicalBeds} / ${HOSPITAL.MEDICAL_BEDS}`
    );

    setText(
        "summaryRN",
        state.currentRN
    );

    setText(
        "summaryMD",
        state.currentMD
    );

    setText(
        "summaryScore",
        result.score
    );

    setText(
        "summaryStatus",
        result.status
    );

}

function setText(
    id: string,
    value: string | number
): void {

    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent = String(value);

}