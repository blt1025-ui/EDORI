/**
 * main
 *
 * Application entry point for EDORI.
 *
 * Responsibilities:
 *
 * - Load global styles
 * - Render the application once
 * - Initialize dashboard behavior once
 * - Expose development-only testing tools
 */

import "./style.css";


import {

    App

}

from "./components/App";


import {

    initializeDashboard

}

from "./components/Dashboard";


import {

    copyEdoriScenarioResults,

    printEdoriCalibrationTable,

    printEdoriScenarioReport

}

from "./scenarios/runEdoriScenarios";


import {

    printOperationalTriggerReport

}

from "./scenarios/runOperationalTriggers";


import {

    printOperationalAssessmentReport

}

from "./scenarios/runOperationalAssessment";


import {

    runEdoriValidationSuite

}

from "./scenarios/runEdoriValidationSuite";


/**
 * Locate the application root created by index.html.
 */
const appElement = document.querySelector<

    HTMLDivElement

>(

    "#app"

);


/**
 * Stop initialization if the root element cannot
 * be found.
 */
if(!appElement){

    throw new Error(

        "EDORI could not find the #app root element."

    );

}


/**
 * Render the complete application HTML once.
 */
appElement.innerHTML = App();


/**
 * Initialize all dashboard behavior after the HTML
 * has been inserted into the page.
 *
 * initializeDashboard() also initializes the
 * functional sidebar.
 */
initializeDashboard();


/**
 * Development-only browser-console tools.
 *
 * These functions are exposed while running:
 *
 * npm run dev
 *
 * They are not attached to window in a production
 * build.
 */
if(import.meta.env.DEV){

    const developmentWindow = window as Window

    &

    {

        /**
         * Print the complete scenario report.
         */
        runEdoriScenarios?:() => void;


        /**
         * Print the compact calibration table.
         */
        showEdoriCalibration?:() => void;


        /**
         * Copy scenario results as formatted JSON.
         */
        copyEdoriScenarioResults?:() => Promise<void>;


        /**
         * Evaluate all configured operational
         * triggers against the current assessment.
         */
        runOperationalTriggers?:() => void;


        /**
         * Build and print the complete EDORI
         * OperationalAssessment object.
         */
        runOperationalAssessment?:() => void;


        /**
         * Run the consolidated EDORI development
         * validation suite.
         */
        runEdoriValidationSuite?:() => unknown;

    };


    developmentWindow.runEdoriScenarios =

        printEdoriScenarioReport;


    developmentWindow.showEdoriCalibration =

        printEdoriCalibrationTable;


    developmentWindow.copyEdoriScenarioResults =

        copyEdoriScenarioResults;


    developmentWindow.runOperationalTriggers =

        printOperationalTriggerReport;


    developmentWindow.runOperationalAssessment =

        printOperationalAssessmentReport;


    developmentWindow.runEdoriValidationSuite =

        runEdoriValidationSuite;


    console.info(

        [

            "EDORI development tools are available:",

            "runEdoriScenarios()",

            "showEdoriCalibration()",

            "copyEdoriScenarioResults()",

            "runOperationalTriggers()",

            "runOperationalAssessment()",

            "runEdoriValidationSuite()"

        ].join(

            "\n"

        )

    );

}