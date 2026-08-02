/**
 * DashboardRightColumn
 *
 * Renders and organizes the detailed operational
 * panels shown in the dashboard's right column.
 *
 * Panels are grouped into:
 *
 * - Immediate Situation
 * - Operational Detail
 * - History and Administration
 *
 * This component only organizes presentation.
 * It does not calculate or modify EDORI data.
 */

import {

    AssessmentDetails

}

from "../AssessmentDetails";


import {

    AssessmentHistory

}

from "../AssessmentHistory";


import {

    DataExportCenter

}

from "../DataExportCenter";


import {

    Drivers

}

from "../Drivers";


import {

    ExecutiveAssessmentReport

}

from "../ExecutiveAssessmentReport";


import {

    Gauge

}

from "../Gauge";


import {

    HistoricalDataManager

}

from "../HistoricalDataManager";


import {

    HistoryRestoreCenter

}

from "../HistoryRestoreCenter";


import {

    OperationalForecast

}

from "../OperationalForecast";


import {

    OperationalLevelReference

}

from "../OperationalLevelReference";


import {

    OperationalOverview

}

from "../OperationalOverview";


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

from "./CollapsiblePanel";


import {

    DashboardToolbar

}

from "./DashboardToolbar";


/**
 * Render the complete dashboard right column.
 */
export function DashboardRightColumn():string {

    return `

        <div class="right-column">

            ${DashboardToolbar()}


            ${createPanelGroupHeading(

                "Immediate Situation",

                "Current score, drivers, actions, and near-term outlook"

            )}


            ${CollapsiblePanel({

                id:
                    "gauge-panel",

                title:
                    "EDORI Gauge",

                description:
                    "Current numerical score and final operational level",

                content:
                    Gauge(),

                initiallyOpen:
                    true

            })}


            ${CollapsiblePanel({

                id:
                    "operational-overview-panel",

                title:
                    "Operational Assessment",

                description:
                    "Trigger-adjusted readiness, pillars, and active conditions",

                content:
                    OperationalOverview(),

                initiallyOpen:
                    true

            })}


            ${CollapsiblePanel({

                id:
                    "drivers-panel",

                title:
                    "Primary Drivers",

                description:
                    "Conditions contributing to the current operational level",

                content:
                    Drivers(),

                initiallyOpen:
                    true

            })}


            ${CollapsiblePanel({

                id:
                    "recommendations-panel",

                title:
                    "Recommended Actions",

                description:
                    "Prioritized operational interventions",

                content:
                    Recommendations(),

                initiallyOpen:
                    true

            })}


            ${CollapsiblePanel({

                id:
                    "operational-forecast-panel",

                title:
                    "Operational Outlook",

                description:
                    "Directional 2-hour and 4-hour ED scenario estimates",

                content:
                    OperationalForecast(),

                initiallyOpen:
                    true

            })}


            ${createPanelGroupHeading(

                "Operational Detail",

                "Reference information, assessment details, and leadership summaries"

            )}


            ${CollapsiblePanel({

                id:
                    "operational-level-reference-panel",

                title:
                    "Operational Level Reference",

                description:
                    "Alpha through Echo definitions and score ranges",

                content:
                    OperationalLevelReference()

            })}


            ${CollapsiblePanel({

                id:
                    "assessment-details-panel",

                title:
                    "Current Assessment Details",

                description:
                    "Submitted values and historical comparisons",

                content:
                    AssessmentDetails()

            })}


            ${CollapsiblePanel({

                id:
                    "shift-handoff-panel",

                title:
                    "Shift Handoff Summary",

                description:
                    "Current status, active risks, actions, and near-term outlook",

                content:
                    ShiftHandoffSummary()

            })}


            ${CollapsiblePanel({

                id:
                    "executive-assessment-report-panel",

                title:
                    "Executive Assessment Report",

                description:
                    "Printable leadership summary and PDF-ready report",

                content:
                    ExecutiveAssessmentReport()

            })}


            ${createPanelGroupHeading(

                "History and Administration",

                "Trend review, saved records, backup, export, and historical baselines"

            )}


            ${CollapsiblePanel({

                id:
                    "data-export-center-panel",

                title:
                    "Data Export Center",

                description:
                    "Download current assessment and saved history files",

                content:
                    DataExportCenter()

            })}


            ${CollapsiblePanel({

                id:
                    "history-restore-center-panel",

                title:
                    "History Restore Center",

                description:
                    "Validate and restore a saved EDORI JSON backup",

                content:
                    HistoryRestoreCenter()

            })}


            ${CollapsiblePanel({

                id:
                    "trend-chart-panel",

                title:
                    "EDORI Trend",

                description:
                    "Saved operational-readiness scores over time",

                content:
                    TrendChart()

            })}


            ${CollapsiblePanel({

                id:
                    "operational-timeline-panel",

                title:
                    "Operational Timeline",

                description:
                    "Chronological score and level changes",

                content:
                    OperationalTimeline()

            })}


            ${CollapsiblePanel({

                id:
                    "assessment-history-panel",

                title:
                    "Assessment History",

                description:
                    "Saved EDORI assessment records",

                content:
                    AssessmentHistory()

            })}


            ${CollapsiblePanel({

                id:
                    "historical-data-panel",

                title:
                    "Historical Data Management",

                description:
                    "Import and manage historical baseline data",

                content:
                    HistoricalDataManager()

            })}

        </div>

    `;

}


/**
 * Render one dashboard panel-group heading.
 */
function createPanelGroupHeading(

    title:string,

    description:string

):string {

    return `

        <div class="dashboard-panel-group-heading">

            <div>

                <span>

                    ${escapeHtml(
                        title
                    )}

                </span>


                <p>

                    ${escapeHtml(
                        description
                    )}

                </p>

            </div>

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