/**
 * Gauge
 *
 * Displays the latest authoritative EDORI result.
 *
 * This component does not calculate EDORI.
 * It reads the stored result from ResultService.
 */

import {

    subscribe

}

from "../services/EventService";


import {

    getLatestResult

}

from "../services/ResultService";


/**
 * Render the EDORI gauge.
 */
export function Gauge():string {

    return `

        <section class="gauge-container">

            <div class="panel-header">

                <div>

                    <h3>
                        EDORI Score
                    </h3>

                    <p class="panel-description">
                        Current operational readiness index
                    </p>

                </div>

            </div>


            <div class="gauge">

                <div
                    id="edori-icon"
                    class="gauge-icon"
                >

                    ⚪

                </div>


                <div
                    id="edori-score"
                    class="gauge-value"
                >

                    --

                </div>


                <div
                    id="edori-status"
                    class="gauge-status"
                >

                    Awaiting Assessment

                </div>

            </div>


            <div
                id="edori-recommendation"
                class="gauge-recommendation"
            >

                Complete and calculate the situation assessment.

            </div>

        </section>

    `;

}


/**
 * Initialize the gauge.
 */
export function initializeGauge():void {

    updateGauge();


    subscribe(

        "resultChanged",

        updateGauge

    );

}


/**
 * Update the gauge from the latest stored result.
 */
function updateGauge():void {

    const result = getLatestResult();


    if(!result){

        resetGauge();

        return;

    }


    const operationalState =

        result.operationalState;


    setElementText(

        "edori-icon",

        operationalState.icon

    );


    setElementText(

        "edori-score",

        String(

            Math.round(

                result.score

            )

        )

    );


    setElementText(

        "edori-status",

        operationalState.title

    );


    setElementText(

        "edori-recommendation",

        operationalState.recommendation

    );


    updateGaugeColor(

        operationalState.color

    );

}


/**
 * Reset the gauge before the first result exists.
 */
function resetGauge():void {

    setElementText(

        "edori-icon",

        "⚪"

    );


    setElementText(

        "edori-score",

        "--"

    );


    setElementText(

        "edori-status",

        "Awaiting Assessment"

    );


    setElementText(

        "edori-recommendation",

        "Complete and calculate the situation assessment."

    );


    updateGaugeColor(

        "#94a3b8"

    );

}


/**
 * Safely update a gauge element.
 */
function setElementText(

    elementId:string,

    value:string

):void {

    const element = document.getElementById(

        elementId

    );


    if(!element){

        console.warn(

            `Gauge could not find element: ${elementId}`

        );

        return;

    }


    element.textContent = value;

}


/**
 * Apply the operational-state color.
 */
function updateGaugeColor(

    color:string

):void {

    const gauge = document.querySelector(

        ".gauge"

    ) as HTMLElement | null;


    if(!gauge){

        return;

    }


    gauge.style.borderColor = color;

    gauge.style.color = color;

}