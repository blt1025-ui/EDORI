/**
 * DashboardController
 *
 * Coordinates application-component initialization.
 *
 * This file does not render markup and does not
 * calculate EDORI.
 *
 * It initializes components rendered across the
 * persistent EDORI application pages after App()
 * inserts all markup into the DOM.
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

    initializeConfigurationBackupCenter

}

from "../ConfigurationBackupCenter";


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

    initializeUserManagement

}

from "../UserManagement";


import {

    initializeSecurityAuditLog

}

from "../SecurityAuditLog";


import {

    initializeSituationAssessment

}

from "../assessment/SituationAssessment";


import {

    initializeAssessmentAccessController

}

from "../assessment/AssessmentAccessController";


import {

    initializeDashboardToolbar

}

from "./DashboardToolbar";


/**
 * Initialize every interactive component rendered by
 * the persistent EDORI application.
 */
export function initializeDashboardComponents():void {

    /*
     * Dashboard command/status controls.
     */
    initializeDashboardCommandBar();


    /*
     * Assessment workflow.
     *
     * SituationAssessment initializes its normal input,
     * validation, calculation, historical-data, and
     * workflow state first.
     *
     * AssessmentAccessController is initialized
     * immediately afterward so authorization is layered
     * on top of that normal assessment state.
     */
    initializeSituationAssessment();

    initializeAssessmentAccessController();


    /*
     * Dashboard summary and operational state.
     */
    initializeExecutiveSummary();

    initializeSummaryCards();

    initializeDomainAlerts();

    initializeGauge();

    initializeOperationalStatusStrip();

    initializeOperationalOverview();

    initializeOperationalLevelReference();


    /*
     * Assessment and operational details.
     */
    initializeAssessmentDetails();

    initializeDrivers();

    initializeRecommendations();

    initializeOperationalForecast();

    initializeShiftHandoffSummary();

    initializeExecutiveAssessmentReport();


    /*
     * Administration data-management tools.
     */
    initializeDataExportCenter();

    initializeHistoryRestoreCenter();

    initializeConfigurationBackupCenter();


    /*
     * Trends and historical information.
     */
    initializeTrendChart();

    initializeOperationalTimeline();

    initializeAssessmentHistory();

    initializeHistoricalDataManager();


    /*
     * Administrative configuration and user access.
     */
    initializeSystemConfiguration();

    initializeUserManagement();

    initializeSecurityAuditLog();


    /*
     * Shared dashboard/application toolbar behavior.
     */
    initializeDashboardToolbar();

}