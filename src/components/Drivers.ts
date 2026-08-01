/**
 * Drivers
 *
 * Displays operational factors contributing
 * to the latest submitted EDORI result.
 *
 * This component does not calculate EDORI.
 * It reads the authoritative result from
 * ResultService.
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

    getLatestResult

}

from "../services/ResultService";


import type {

    Driver

}

from "../types/Driver";


/**
 * Render the Primary Drivers panel.
 */
export function Drivers():string {

    return `

        <section class="drivers-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Primary Drivers
                    </h3>

                    <p class="panel-description">
                        Factors contributing to the current EDORI score
                    </p>

                </div>

            </div>


            <div id="drivers-list">

                <div class="drivers-empty-state">

                    <span class="empty-state-icon">
                        …
                    </span>

                    <p>
                        Complete and calculate an assessment to identify operational drivers.
                    </p>

                </div>

            </div>

        </section>

    `;

}


/**
 * Initialize the driver display.
 */
export function initializeDrivers():void {

    updateDrivers();


    subscribe(

    APP_EVENTS.RESULT_CHANGED,

    updateDrivers

);

}


/**
 * Display drivers from the latest stored result.
 */
function updateDrivers():void {

    const container = document.getElementById(

        "drivers-list"

    );


    if(!container){

        return;

    }


    const result = getLatestResult();


    if(!result){

        renderAwaitingAssessment(

            container

        );

        return;

    }


    if(

        !result.drivers ||

        result.drivers.length === 0

    ){

        renderNoDrivers(

            container

        );

        return;

    }


    const sortedDrivers = [

        ...result.drivers

    ].sort(

        (

            first,

            second

        ) => second.severity - first.severity

    );


    container.innerHTML = sortedDrivers

        .map(

            driver => createDriverCard(

                driver

            )

        )

        .join("");

}


/**
 * Build one driver card.
 */
function createDriverCard(

    driver:Driver

):string {

    const severity = getDriverSeverity(

        driver.severity

    );


    const difference =

        driver.currentValue -

        driver.expectedValue;


    return `

        <article
            class="driver-card ${severity.className}"
        >

            <div class="driver-card-header">

                <div class="driver-title-group">

                    <span
                        class="driver-icon"
                        aria-hidden="true"
                    >

                        ${severity.icon}

                    </span>


                    <div>

                        <h4 class="driver-title">

                            ${escapeHtml(driver.title)}

                        </h4>


                        <span class="driver-severity-label">

                            ${severity.label} contribution

                        </span>

                    </div>

                </div>


                <div class="driver-severity-score">

                    ${clampSeverity(driver.severity)}

                    <span>
                        /100
                    </span>

                </div>

            </div>


            <p class="driver-description">

                ${escapeHtml(driver.description)}

            </p>


            <div class="driver-metrics">

                <div class="driver-metric">

                    <span class="driver-metric-label">
                        Current
                    </span>

                    <strong>
                        ${formatNumber(driver.currentValue)}
                    </strong>

                </div>


                <div class="driver-metric">

                    <span class="driver-metric-label">
                        Expected
                    </span>

                    <strong>
                        ${formatNumber(driver.expectedValue)}
                    </strong>

                </div>


                <div class="driver-metric">

                    <span class="driver-metric-label">
                        Variance
                    </span>

                    <strong class="${getVarianceClass(difference)}">

                        ${formatDifference(difference)}

                    </strong>

                </div>

            </div>


            <div
                class="driver-progress"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${clampSeverity(driver.severity)}"
                aria-label="${escapeHtml(driver.title)} severity"
            >

                <div
                    class="driver-progress-fill"
                    style="width:${clampSeverity(driver.severity)}%;"
                >
                </div>

            </div>

        </article>

    `;

}


/**
 * Map driver severity to its display style.
 */
function getDriverSeverity(

    severity:number

):{

    label:string;

    icon:string;

    className:string;

} {

    if(severity >= 80){

        return {

            label:"Critical",

            icon:"●",

            className:"driver-critical"

        };

    }


    if(severity >= 60){

        return {

            label:"High",

            icon:"●",

            className:"driver-high"

        };

    }


    if(severity >= 40){

        return {

            label:"Moderate",

            icon:"●",

            className:"driver-moderate"

        };

    }


    return {

        label:"Low",

        icon:"●",

        className:"driver-low"

    };

}


/**
 * Keep severity within 0–100.
 */
function clampSeverity(

    severity:number

):number {

    if(!Number.isFinite(severity)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            Math.round(severity)

        )

    );

}


/**
 * Format a numeric driver value.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    return String(

        Math.round(value)

    );

}


/**
 * Format the current-versus-expected difference.
 */
function formatDifference(

    difference:number

):string {

    if(!Number.isFinite(difference)){

        return "--";

    }


    const roundedDifference = Math.round(

        difference

    );


    if(roundedDifference > 0){

        return `+${roundedDifference}`;

    }


    return String(

        roundedDifference

    );

}


/**
 * Style the variance value.
 */
function getVarianceClass(

    difference:number

):string {

    if(difference > 0){

        return "variance-above";

    }


    if(difference < 0){

        return "variance-below";

    }


    return "variance-neutral";

}


/**
 * Display the state before the first calculation.
 */
function renderAwaitingAssessment(

    container:HTMLElement

):void {

    container.innerHTML = `

        <div class="drivers-empty-state">

            <span class="empty-state-icon">
                …
            </span>

            <p>
                Complete and calculate an assessment to identify operational drivers.
            </p>

        </div>

    `;

}


/**
 * Display stable operations with no major drivers.
 */
function renderNoDrivers(

    container:HTMLElement

):void {

    container.innerHTML = `

        <div class="drivers-empty-state drivers-empty-success">

            <span class="empty-state-icon">
                ✓
            </span>

            <p>
                No significant operational drivers identified.
            </p>

        </div>

    `;

}


/**
 * Escape values inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll(

            "&",

            "&amp;"

        )

        .replaceAll(

            "<",

            "&lt;"

        )

        .replaceAll(

            ">",

            "&gt;"

        )

        .replaceAll(

            "\"",

            "&quot;"

        )

        .replaceAll(

            "'",

            "&#039;"

        );

}