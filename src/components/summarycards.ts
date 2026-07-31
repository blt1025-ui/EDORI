/**
 * SummaryCards
 *
 * Displays the most recently committed EDORI
 * assessment and calculation result.
 *
 * This component does not calculate EDORI.
 *
 * Data sources:
 *
 * StateService
 *      - committed assessment values
 *
 * ResultService
 *      - authoritative EDORI calculation result
 */

import {

    subscribe

}

from "../services/EventService";


import {

    getState

}

from "../services/StateService";


import {

    getLatestResult

}

from "../services/ResultService";


const MEDICAL_BED_CAPACITY = 273;


/**
 * Render the Operational Readiness cards.
 */
export function SummaryCards():string {

    return `

        <section class="summary-cards-section">

            <div class="summary-cards">

                <div class="card">

                    <h3>
                        EDORI
                    </h3>

                    <h1 id="scoreCard">
                        --
                    </h1>

                    <p class="card-detail">
                        Overall operational readiness score
                    </p>

                </div>


                <div class="card">

                    <h3>
                        ED Volume
                    </h3>

                    <h1 id="volumeCard">
                        --
                    </h1>

                    <p class="card-detail">
                        Current emergency department census
                    </p>

                </div>


                <div class="card">

                    <h3>
                        Boarding
                    </h3>

                    <h1 id="boardingCard">
                        --
                    </h1>

                    <p class="card-detail">
                        Admitted patients boarding in the ED
                    </p>

                </div>


                <div class="card">

                    <h3>
                        Clinical Capacity
                    </h3>

                    <h1 id="capacityCard">
                        --
                    </h1>

                    <p
                        id="capacityDetail"
                        class="card-detail"
                    >
                        Current nursing and physician coverage
                    </p>

                </div>


                <div class="card">

                    <h3>
                        Hospital Occupancy
                    </h3>

                    <h1 id="medicalBedsCard">
                        --
                    </h1>

                    <p
                        id="medicalBedsDetail"
                        class="card-detail"
                    >
                        Occupied medical beds
                    </p>

                </div>


                <div class="card">

                    <h3>
                        Operational State
                    </h3>

                    <h1 id="statusCard">
                        --
                    </h1>

                    <p class="card-detail">
                        Current operational readiness level
                    </p>

                </div>

            </div>

        </section>

    `;

}


/**
 * Initialize the cards.
 */
export function initializeSummaryCards():void {

    updateSummaryCards();


    subscribe(

        "resultChanged",

        updateSummaryCards

    );

}


/**
 * Update cards using the committed assessment
 * and latest authoritative EDORI result.
 */
function updateSummaryCards():void {

    const state = getState();

    const result = getLatestResult();


    if(!result){

        resetSummaryCards();

        return;

    }


    const operationalState =

        result.operationalState;


    const hospitalOccupancy =

        calculateHospitalOccupancy(

            state.occupiedMedicalBeds

        );


    setCardText(

        "scoreCard",

        String(

            Math.round(

                result.score

            )

        )

    );


    setCardText(

        "volumeCard",

        String(

            state.totalEDVolume

        )

    );


    setCardText(

        "boardingCard",

        String(

            state.boardedPatients

        )

    );


    setCardText(

        "capacityCard",

        `${state.currentRN} RN / ${state.currentMD} MD`

    );


    setCardText(

        "capacityDetail",

        createCapacityDetail(

            state.expectedRN,

            state.expectedMD

        )

    );


    setCardText(

        "medicalBedsCard",

        `${hospitalOccupancy}%`

    );


    setCardText(

        "medicalBedsDetail",

        `${state.occupiedMedicalBeds} of ${MEDICAL_BED_CAPACITY} beds occupied`

    );


    setCardText(

        "statusCard",

        `${operationalState.icon} ${operationalState.title}`

    );


    updateCardAccent(

        "scoreCard",

        operationalState.color

    );


    updateCardAccent(

        "statusCard",

        operationalState.color

    );


    updateStatusTextColor(

        operationalState.color

    );

}


/**
 * Calculate hospital medical-bed occupancy.
 */
function calculateHospitalOccupancy(

    occupiedMedicalBeds:number

):number {

    if(

        !Number.isFinite(

            occupiedMedicalBeds

        ) ||

        occupiedMedicalBeds < 0

    ){

        return 0;

    }


    return Math.round(

        (

            occupiedMedicalBeds /

            MEDICAL_BED_CAPACITY

        ) * 100

    );

}


/**
 * Create the expected clinical-resource detail.
 */
function createCapacityDetail(

    expectedRN:number,

    expectedMD:number

):string {

    if(

        expectedRN <= 0 &&

        expectedMD <= 0

    ){

        return "Current nursing and physician coverage";

    }


    return `Expected: ${expectedRN} RN / ${expectedMD} MD`;

}


/**
 * Safely update an element's text.
 */
function setCardText(

    elementId:string,

    value:string

):void {

    const element = document.getElementById(

        elementId

    );


    if(!element){

        console.warn(

            `SummaryCards could not find element: ${elementId}`

        );

        return;

    }


    element.textContent = value;

}


/**
 * Reset cards before the first calculation.
 */
function resetSummaryCards():void {

    setCardText(

        "scoreCard",

        "--"

    );


    setCardText(

        "volumeCard",

        "--"

    );


    setCardText(

        "boardingCard",

        "--"

    );


    setCardText(

        "capacityCard",

        "--"

    );


    setCardText(

        "capacityDetail",

        "Current nursing and physician coverage"

    );


    setCardText(

        "medicalBedsCard",

        "--"

    );


    setCardText(

        "medicalBedsDetail",

        "Occupied medical beds"

    );


    setCardText(

        "statusCard",

        "--"

    );


    updateCardAccent(

        "scoreCard",

        ""

    );


    updateCardAccent(

        "statusCard",

        ""

    );


    updateStatusTextColor(

        ""

    );

}


/**
 * Update the colored top border of a card.
 */
function updateCardAccent(

    elementId:string,

    color:string

):void {

    const valueElement = document.getElementById(

        elementId

    );


    const card = valueElement?.closest(

        ".card"

    ) as HTMLElement | null;


    if(!card){

        return;

    }


    if(color){

        card.style.borderTopColor = color;

        return;

    }


    card.style.removeProperty(

        "border-top-color"

    );

}


/**
 * Apply operational-state color to status text.
 */
function updateStatusTextColor(

    color:string

):void {

    const statusElement = document.getElementById(

        "statusCard"

    ) as HTMLElement | null;


    if(!statusElement){

        return;

    }


    if(color){

        statusElement.style.color = color;

        return;

    }


    statusElement.style.removeProperty(

        "color"

    );

}