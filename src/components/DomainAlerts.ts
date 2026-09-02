/**
 * DomainAlerts
 *
 * Version 2.2 Hospital Readiness Model
 *
 * Displays a compact strip when one or more major
 * Hospital Readiness domains reach Elevated, High, or
 * Severe pressure.
 *
 * Domain Alerts do not modify the overall HRI or
 * operational state. Their purpose is to prevent a
 * significant individual weighted domain from being
 * obscured by a lower composite score.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getDomainSeverity,

    isDomainAlert

}

from "../config/domainSeverity";


import {

    subscribe

}

from "../services/EventService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../services/ResultService";


import {

    hasCommittedAssessment

}

from "../services/StateService";


interface DomainAlertItem {

    title:string;

    score:number;

}


/**
 * Render the Domain Alerts region.
 */
export function DomainAlerts():string {

    return `

        <section

            id="domainAlerts"

            class="domain-alerts"

            aria-live="polite"

            hidden

        >

        </section>

    `;

}


/**
 * Initialize Domain Alerts.
 */
export function initializeDomainAlerts():void {

    updateDomainAlerts();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateDomainAlerts

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateDomainAlerts

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateDomainAlerts

    );

}


/**
 * Refresh the Domain Alerts strip from the
 * authoritative result.
 */
function updateDomainAlerts():void {

    const container =

        document.getElementById(

            "domainAlerts"

        );


    if(!container){

        return;

    }


    if(

        getResultInvalidationReason()

        ||

        !hasCommittedAssessment()

    ){

        hideDomainAlerts(

            container

        );


        return;

    }


    const result =

        getLatestResult();


    if(!result){

        hideDomainAlerts(

            container

        );


        return;

    }


    /*
     * Version 2.2 authoritative HRI domains only.
     *
     * Acute-care occupancy remains important operational
     * context and can activate advisory triggers, but it
     * is not an independently weighted HRI domain.
     *
     * Hospital inflow is likewise retained for backward
     * compatibility and analytics, but does not independently
     * contribute to the Version 2.2 HRI.
     */
    const alerts:DomainAlertItem[] = [

        {

            title:

                "ED Operational Pressure",

            score:

                result.edPressureScore

        },

        {

            title:

                "Projected Hospital Capacity",

            score:

                result.projectedCapacityScore

        },

        {

            title:

                "Critical-Care Capacity",

            score:

                result.criticalCapacityScore

        }

    ]

        .filter(

            alert =>

                isDomainAlert(

                    alert.score

                )

        )

        .sort(

            (

                first,

                second

            ) =>

                second.score

                -

                first.score

        );


    if(alerts.length === 0){

        hideDomainAlerts(

            container

        );


        return;

    }


    container.hidden = false;


    container.innerHTML = `

        <div class="domain-alerts-header">

            <div>

                <span class="domain-alerts-kicker">

                    Domain Alerts

                </span>

                <strong>

                    ${alerts.length === 1

                        ? "1 elevated HRI domain"

                        : `${alerts.length} elevated HRI domains`

                    }

                </strong>

            </div>

            <span class="domain-alerts-explanation">

                Significant pressure in an individual weighted HRI domain may be present even when the overall HRI is lower.

            </span>

        </div>


        <div class="domain-alerts-list">

            ${alerts

                .map(

                    createDomainAlertItem

                )

                .join("")}

        </div>

    `;

}


/**
 * Render one domain alert.
 */
function createDomainAlertItem(

    alert:DomainAlertItem

):string {

    const severity =

        getDomainSeverity(

            alert.score

        );


    return `

        <div

            class="

                domain-alert-item

                domain-alert-item-${escapeAttribute(

                    severity.level

                )}

            "

        >

            <span

                class="domain-alert-indicator"

                aria-hidden="true"

            >

                ⚠

            </span>


            <span class="domain-alert-name">

                ${escapeHtml(

                    alert.title

                )}

            </span>


            <strong class="domain-alert-score">

                ${formatScore(

                    alert.score

                )}

            </strong>


            <span class="domain-alert-level">

                ${escapeHtml(

                    severity.label

                )}

            </span>

        </div>

    `;

}


/**
 * Hide and clear Domain Alerts.
 */
function hideDomainAlerts(

    container:HTMLElement

):void {

    container.hidden = true;

    container.innerHTML = "";

}


/**
 * Format one domain score.
 */
function formatScore(

    score:number

):string {

    if(!Number.isFinite(score)){

        return "--";

    }


    return Number.isInteger(score)

        ? String(score)

        : score

            .toFixed(

                1

            )

            .replace(

                /\.0$/,

                ""

            );

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll("\"", "&quot;")

        .replaceAll("'", "&#039;");

}


/**
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}
