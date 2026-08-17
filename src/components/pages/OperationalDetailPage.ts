/**
 * OperationalDetailPage
 *
 * Detailed interpretation of the current EDORI
 * assessment.
 *
 * The page is intentionally organized as an
 * operational decision sequence:
 *
 * 1. Current condition
 * 2. Primary drivers and recommended actions
 * 3. Near-term outlook
 * 4. Operational trends
 * 5. Supporting information
 *
 * The Dashboard remains the primary current-state
 * command-center view. This page provides deeper
 * interpretation without repeating the complete
 * Dashboard presentation.
 */

import {

    AssessmentDetails

}

from "../AssessmentDetails";


import {

    Drivers

}

from "../Drivers";


import {

    ExecutiveAssessmentReport

}

from "../ExecutiveAssessmentReport";


import {

    OperationalForecast

}

from "../OperationalForecast";


import {

    OperationalOverview

}

from "../OperationalOverview";


import {

    OperationalStatusStrip

}

from "../OperationalStatusStrip";


import {

    OperationalTimeline

}

from "../OperationalTimeline";


import {

    Recommendations

}

from "../Recommendations";


import {

    ShiftHandoffSummary

}

from "../ShiftHandoffSummary";


import {

    TrendChart

}

from "../TrendChart";


import {

    CollapsiblePanel

}

from "../dashboard/CollapsiblePanel";


/**
 * Render the Operational Detail page.
 */
export function OperationalDetailPage():string {

    return `

        <main
            id="operationalDetailPage"
            class="
                application-page
                operational-detail-page
            "
            data-application-page="operational-detail"
            hidden
        >

            <div class="application-page-heading">

                <div>

                    <span class="application-page-eyebrow">
                        Operational Analysis
                    </span>


                    <h2>
                        Operational Detail
                    </h2>


                    <p>
                        Current conditions, drivers, recommended actions, outlook, and trends
                    </p>

                </div>

            </div>


            ${OperationalStatusStrip()}


            <!-- =========================================
                 CURRENT CONDITION
            ========================================== -->

            <section
                class="
                    operational-detail-section
                    operational-detail-section-primary
                "
                aria-label="Current operational condition"
            >

                ${createSectionLabel(
                    "Current Condition"
                )}


                <div class="operational-detail-current-assessment">

                    ${CollapsiblePanel({

                        id:
                            "operational-overview-panel",

                        title:
                            "Operational Assessment",

                        description:
                            "Domain pressure and active operational conditions",

                        content:
                            OperationalOverview(),

                        initiallyOpen:
                            true

                    })}

                </div>

            </section>


            <!-- =========================================
                 DRIVERS AND RESPONSE
            ========================================== -->

            <section
                class="
                    operational-detail-section
                    operational-detail-section-response
                "
                aria-label="Operational drivers and recommended actions"
            >

                ${createSectionLabel(
                    "Drivers & Response"
                )}


                <div class="operational-detail-response-stack">

    <div class="operational-detail-actions">

        ${CollapsiblePanel({

            id:
                "recommendations-panel",

            title:
                "Recommended Actions",

            description:
                "Prioritized operational interventions and ownership",

            content:
                Recommendations(),

            initiallyOpen:
                true

        })}

    </div>


    <div class="operational-detail-drivers">

        ${CollapsiblePanel({

            id:
                "drivers-panel",

            title:
                "Primary Drivers",

            description:
                "Active conditions and strongest HRI contributors",

            content:
                Drivers(),

            initiallyOpen:
                false

        })}

    </div>

</div>


                    

            </section>


            <!-- =========================================
                 NEAR-TERM OUTLOOK
            ========================================== -->

            <section
                class="
                    operational-detail-section
                    operational-detail-section-outlook
                "
                aria-label="Near-term operational outlook"
            >

                ${createSectionLabel(
                    "Near-Term Outlook"
                )}


                ${CollapsiblePanel({

                    id:
                        "operational-forecast-panel",

                    title:
                        "Operational Outlook",

                    description:
                        "Near-term directional Hospital Readiness scenarios",

                    content:
                        OperationalForecast(),

                    initiallyOpen:
                        true

                })}

            </section>


            <!-- =========================================
                 TREND REVIEW
            ========================================== -->

            <section
                class="
                    operational-detail-section
                    operational-detail-section-trends
                "
                aria-label="Operational trends"
            >

                ${createSectionLabel(
                    "Trend Review"
                )}


                <div class="operational-detail-trend-grid">

                    ${CollapsiblePanel({

                        id:
                            "trend-chart-panel",

                        title:
                            "HRI Trend",

                        description:
                            "Hospital Readiness scores over time",

                        content:
                            TrendChart(),

                        initiallyOpen:
                            true

                    })}


                    ${CollapsiblePanel({

                        id:
                            "operational-timeline-panel",

                        title:
                            "Operational Timeline",

                        description:
                            "Chronological score and operational-level changes",

                        content:
                            OperationalTimeline(),

                        initiallyOpen:
                            false

                    })}

                </div>

            </section>


            <!-- =========================================
                 SUPPORTING INFORMATION
            ========================================== -->

            <section
                class="
                    operational-detail-section
                    operational-detail-section-support
                "
                aria-label="Supporting operational information"
            >

              ${createSectionLabel(
    "Reports & Supporting Information"
)}


                <div class="operational-detail-support-grid">

                    ${CollapsiblePanel({

    id:
        "assessment-details-panel",

    title:
        "Assessment Details",

    description:
        "Submitted values and historical comparisons",

    content:
        AssessmentDetails(),

    initiallyOpen:
        false

})}


                    ${CollapsiblePanel({

    id:
        "shift-handoff-panel",

    title:
        "Shift Handoff Summary",

    description:
        "Concise operational handoff summary",

    content:
        ShiftHandoffSummary(),

    initiallyOpen:
        false

})}

                    ${CollapsiblePanel({

    id:
        "executive-assessment-report-panel",

    title:
        "Executive Assessment Report",

    description:
        "Printable leadership summary",

    content:
        ExecutiveAssessmentReport(),

    initiallyOpen:
        false

})}

                </div>

            </section>

        </main>

    `;

}


/**
 * Render a compact Operational Detail section label.
 */
function createSectionLabel(

    title:string

):string {

    return `

        <div class="operational-detail-section-label">

            ${escapeHtml(
                title
            )}

        </div>

    `;

}


/**
 * Escape text inserted into HTML.
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