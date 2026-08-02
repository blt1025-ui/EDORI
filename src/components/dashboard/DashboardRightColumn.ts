/**
 * DashboardRightColumn
 *
 * Renders the detailed operational panels shown
 * in the dashboard's right column.
 *
 * This component only organizes presentation.
 * It does not calculate or modify EDORI data.
 */

import {

    OperationalForecast

}

from "../OperationalForecast";

import {

    AssessmentDetails

}

from "../AssessmentDetails";


import {

    AssessmentHistory

}

from "../AssessmentHistory";


import {

    Drivers

}

from "../Drivers";


import {

    Gauge

}

from "../Gauge";


import {

    HistoricalDataManager

}

from "../HistoricalDataManager";


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


            ${CollapsiblePanel({

                id:
                    "gauge-panel",

                title:
                    "EDORI Gauge",

                description:
                    "Current numerical score and final operational level",

                content:
                    Gauge()

            })}


            ${CollapsiblePanel({

                id:
                    "operational-overview-panel",

                title:
                    "Operational Assessment",

                description:
                    "Trigger-adjusted readiness, pillars, and active conditions",

                content:
                    OperationalOverview()

            })}


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
                    "drivers-panel",

                title:
                    "Primary Drivers",

                description:
                    "Conditions contributing to the current operational level",

                content:
                    Drivers()

            })}


            ${CollapsiblePanel({

                id:
                    "recommendations-panel",

                title:
                    "Recommended Actions",

                description:
                    "Prioritized operational interventions",

                content:
                    Recommendations()

            })}

${CollapsiblePanel({

    id:
        "operational-forecast-panel",

    title:
        "Operational Outlook",

    description:
        "Directional 2-hour and 4-hour ED scenario estimates",

    content:
        OperationalForecast()

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