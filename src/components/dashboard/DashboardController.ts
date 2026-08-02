/**
 * DashboardController
 *
 * Coordinates dashboard-component initialization.
 *
 * This file does not render markup and does not
 * calculate EDORI.
 */

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

    initializeOperationalTimeline

}

from "../OperationalTimeline";


import {

    initializeRecommendations

}

from "../Recommendations";


import {

    initializeSummaryCards

}

from "../SummaryCards";


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

    initializeSituationAssessment();

    initializeExecutiveSummary();

    initializeSummaryCards();

    initializeGauge();

    initializeOperationalOverview();

    initializeOperationalLevelReference();

    initializeAssessmentDetails();

    initializeDrivers();

    initializeRecommendations();

    initializeOperationalForecast();

    initializeTrendChart();

    initializeOperationalTimeline();

    initializeAssessmentHistory();

    initializeHistoricalDataManager();

    initializeDashboardToolbar();

}