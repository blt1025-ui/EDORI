/**
 * SummaryCards
 *
 * Displays the latest committed EDORI assessment
 * and authoritative calculation result.
 *
 * Staffing is intentionally excluded from the
 * EDORI score and from this summary display.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


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
                        Patient Acuity
                    </h3>

                    <h1 id="acuityCard">
                        --
                    </h1>

                    <p
                        id="acuityDetail"
                        class="card-detail"
                    >
                        Current high-acuity patient volume
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

    APP_EVENTS.RESULT_CHANGED,

    updateSummaryCards

);

}


/**
 * Update all cards from the committed assessment
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


    const highAcuityPatients =

        state.esi1

        +

        state.esi2;


    const highAcuityPercentage =

        calculateHighAcuityPercentage(

            highAcuityPatients,

            state.totalEDVolume

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

        "medicalBedsCard",

        `${hospitalOccupancy}%`

    );


    setCardText(

        "medicalBedsDetail",

        `${state.occupiedMedicalBeds} of ${MEDICAL_BED_CAPACITY} beds occupied`

    );


    setCardText(

        "acuityCard",

        String(

            highAcuityPatients

        )

    );


    setCardText(

        "acuityDetail",

        `${highAcuityPercentage}% of ED patients are ESI 1 or ESI 2`

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

        )

        ||

        occupiedMedicalBeds < 0

    ){

        return 0;

    }


    return Math.round(

        (

            occupiedMedicalBeds

            /

            MEDICAL_BED_CAPACITY

        )

        * 100

    );

}


/**
 * Calculate the percentage of current ED patients
 * categorized as ESI 1 or ESI 2.
 */
function calculateHighAcuityPercentage(

    highAcuityPatients:number,

    totalEDVolume:number

):number {

    if(

        !Number.isFinite(

            highAcuityPatients

        )

        ||

        !Number.isFinite(

            totalEDVolume

        )

        ||

        totalEDVolume <= 0

    ){

        return 0;

    }


    return Math.round(

        (

            highAcuityPatients

            /

            totalEDVolume

        )

        * 100

    );

}


/**
 * Safely update card text.
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
 * Reset all cards before the first calculation.
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

        "medicalBedsCard",

        "--"

    );


    setCardText(

        "medicalBedsDetail",

        "Occupied medical beds"

    );


    setCardText(

        "acuityCard",

        "--"

    );


    setCardText(

        "acuityDetail",

        "Current high-acuity patient volume"

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