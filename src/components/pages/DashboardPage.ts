/**
 * DashboardPage
 *
 * Compact Hospital Readiness home screen.
 *
 * Purpose:
 *
 * - Show the current Hospital Readiness condition at a glance
 * - Keep the page compact enough for normal desktop use
 * - Avoid detailed operational drill-down
 *
 * Detailed analysis belongs on Operational Detail.
 *
 * Internal EDORI naming is intentionally retained
 * throughout the application codebase.
 */

import {

    ExecutiveSummary

}

from "../ExecutiveSummary";


import {

    SummaryCards

}

from "../SummaryCards";


import {

    DomainAlerts

}

from "../DomainAlerts";


import {

    Gauge

}

from "../Gauge";


/**
 * Render the Hospital Readiness Dashboard page.
 */
export function DashboardPage():string {

    return `

        <main
            id="dashboardPage"
            class="
                application-page
                dashboard-page
            "
            data-application-page="dashboard"
        >

            <div class="application-page-heading">

                <div>

                    <span class="application-page-eyebrow">
                        Hospital Operations
                    </span>


                    <h2>
                        Hospital Readiness Command Center
                    </h2>


                    <p>
                        Current Hospital Readiness status and operational pressure
                    </p>

                </div>

            </div>


            <section
                class="dashboard-page-primary"
                aria-label="Current Hospital Readiness status"
            >

                <div class="dashboard-page-gauge">

                    ${Gauge()}

                </div>


                <div class="dashboard-page-summary">

                    ${ExecutiveSummary()}

                </div>

            </section>


            <section
                class="dashboard-page-alerts"
                aria-label="Domain alerts"
            >

                ${DomainAlerts()}

            </section>


            <section
                class="dashboard-page-domains"
                aria-label="Hospital Readiness domains"
            >

                ${SummaryCards()}

            </section>

        </main>

    `;

}