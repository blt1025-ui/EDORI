/**
 * DashboardController
 *
 * Coordinates dashboard-component initialization.
 *
 * This file does not render markup and does not
 * calculate EDORI.
 */

import {

    initializeDashboardCommandBar

}

from "./DashboardCommandBar";


import {

    initializeHistoryRestoreCenter

}

from "../HistoryRestoreCenter";


import {

    initializeDataExportCenter

}

from "../DataExportCenter";


import {

    initializeExecutiveAssessmentReport

}

from "../ExecutiveAssessmentReport";


import {

    initializeShiftHandoffSummary

}

from "../ShiftHandoffSummary";


import {

    initializeOperationalForecast

}

from "../OperationalForecast";


import {

    initializeAssessmentDetails

}

from "../AssessmentDetails";


import {

    initializeAssessmentHistory

}

from "../AssessmentHistory";


import {

    initializeDrivers

}

from "../Drivers";


import {

    initializeExecutiveSummary

}

from "../ExecutiveSummary";


import {

    initializeSystemConfiguration

}

from "../SystemConfiguration";


import {

    initializeSummaryCards

}

from "../SummaryCards";


import {

    initializeDomainAlerts

}

from "../DomainAlerts";


import {

    initializeGauge

}

from "../Gauge";


import {

    initializeHistoricalDataManager

}

from "../HistoricalDataManager";


import {

    initializeOperationalLevelReference

}

from "../OperationalLevelReference";


import {

    initializeOperationalOverview

}

from "../OperationalOverview";


import {

    initializeOperationalStatusStrip

}

from "../OperationalStatusStrip";


import {

    initializeOperationalTimeline

}

from "../OperationalTimeline";


import {

    initializeRecommendations

}

from "../Recommendations";


import {

    initializeTrendChart

}

from "../TrendChart";


import {

    initializeSituationAssessment

}

from "../assessment/SituationAssessment";


import {

    initializeDashboardToolbar

}

from "./DashboardToolbar";


/**
 * Initialize every component rendered by the
 * dashboard.
 */
export function initializeDashboardComponents():void {

    initializeDashboardCommandBar();

    initializeSituationAssessment();

    initializeExecutiveSummary();

    initializeSummaryCards();

    initializeDomainAlerts();

    initializeGauge();

    initializeOperationalStatusStrip();

    initializeOperationalOverview();

    initializeOperationalLevelReference();

    initializeAssessmentDetails();

    initializeDrivers();

    initializeRecommendations();

    initializeOperationalForecast();

    initializeShiftHandoffSummary();

    initializeExecutiveAssessmentReport();

    initializeDataExportCenter();

    initializeHistoryRestoreCenter();

    initializeTrendChart();

    initializeOperationalTimeline();

    initializeAssessmentHistory();

    initializeHistoricalDataManager();

    initializeSystemConfiguration();

    initializeDashboardToolbar();

}