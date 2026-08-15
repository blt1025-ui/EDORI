/**
 * Dashboard
 *
 * Main EDORI dashboard layout.
 *
 * Responsibilities:
 *
 * - Render the command-center structure
 * - Render the left assessment column
 * - Render the collapsible right-column panels
 * - Initialize all dashboard components
 * - Initialize sidebar navigation
 *
 * Operational calculations, event subscriptions,
 * status updates, and component-specific behavior
 * are delegated to focused services and dashboard
 * controllers.
 */

import {

    ExecutiveSummary

}

from "./ExecutiveSummary";


import {

    SummaryCards

}

from "./SummaryCards";


import {

    DomainAlerts

}

from "./DomainAlerts";


import {

    SituationAssessment

}

from "./assessment/SituationAssessment";


import {

    DashboardCommandBar

}

from "./dashboard/DashboardCommandBar";


import {

    DashboardRightColumn

}

from "./dashboard/DashboardRightColumn";


import {

    initializeDashboardComponents

}

from "./dashboard/DashboardController";


import {

    initializeSidebar

}

from "./Sidebar";


/**
 * Render the complete EDORI dashboard.
 */
export function Dashboard():string {

    return `

        <main
            id="dashboard"
            class="dashboard"
        >

            <section
                id="currentStatusSection"
                class="dashboard-current-status-section"
            >

                ${DashboardCommandBar()}

            </section>


            <div class="dashboard-title-row">

                <div>

                    <span class="dashboard-title-eyebrow">
                        Emergency Department Operations
                    </span>


                    <h2>
                        EDORI Command Center
                    </h2>


                    <p>
                        Emergency Department Operational Readiness Index
                    </p>

                </div>

            </div>


            <section
                id="executiveSummarySection"
                class="dashboard-executive-summary-section"
            >

                ${ExecutiveSummary()}

            </section>


            <section
                id="summaryCardsSection"
                class="dashboard-summary-cards-section"
            >

                ${SummaryCards()}

            </section>


            <section
                id="domainAlertsSection"
                class="dashboard-domain-alerts-section"
            >

                ${DomainAlerts()}

            </section>


            <div class="dashboard-grid">

                <div
                    id="situationAssessmentSection"
                    class="left-column"
                >

                    ${SituationAssessment()}

                </div>


                ${DashboardRightColumn()}

            </div>

        </main>

    `;

}


/**
 * Initialize all dashboard components after the
 * dashboard markup has been inserted into the DOM.
 */
export function initializeDashboard():void {

    /*
     * Initialize the dashboard components first so
     * collapsible panels and section markup are ready.
     */
    initializeDashboardComponents();


    /*
     * Initialize sidebar navigation after all
     * dashboard sections exist in the DOM.
     */
    initializeSidebar();

}