/**
 * main
 *
 * Application entry point for EDORI.
 *
 * Responsibilities:
 *
 * - Load global styles
 * - Initialize authentication
 * - Render the login experience when signed out
 * - Render and initialize EDORI once authenticated
 * - Keep login/application visibility synchronized
 * - Expose development-only testing tools
 */

import "./style.css";


import {

    APP_EVENTS

}

from "./config/appEvents";


import {

    App

}

from "./components/App";


import {

    initializeDashboard

}

from "./components/Dashboard";


import {

    initializeLoginPage,
    LoginPage

}

from "./components/LoginPage";


import {

    initializePasswordChangePage,
    PasswordChangePage

}

from "./components/PasswordChangePage";


import {

    initializeAuthentication,
    isAuthenticated,
    isPasswordChangeRequired

}

from "./services/AuthenticationService";


import {

    subscribe

}

from "./services/EventService";


import {

    initializeSessionSecurity

}

from "./services/SessionSecurityService";

import {

    initializeServerTriggerConfiguration

}

from "./services/TriggerConfigurationService";

import {

    initializeServerSurgePlan

}

from "./services/SurgePlanService";

import {

    initializeServerResultState

}

from "./services/ResultService";

import {

    initializeServerSecurityAuditLog

}

from "./services/SecurityAuditService";

import {

    initializeServerConfiguration

}

from "./services/ConfigurationService";

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
 * Track whether the authenticated application has
 * already been rendered and initialized.
 *
 * The application remains mounted while signed out so
 * repeated login/logout cycles do not create duplicate
 * component event subscriptions.
 */
let authenticatedApplicationInitialized = false;


/**
 * Create persistent authentication/application hosts.
 */
appElement.innerHTML = `

    <div
        id="edoriAuthenticationHost"
        class="edori-authentication-host"
    >
    </div>


    <div
        id="edoriPasswordChangeHost"
        class="edori-password-change-host"
        hidden
    >
    </div>


    <div
        id="edoriAuthenticatedApplicationHost"
        class="edori-authenticated-application-host"
        hidden
    >
    </div>

`;


/**
 * Keep the visible experience synchronized whenever
 * UserService reports an identity/session change.
 */
subscribe(

    APP_EVENTS.USERS_CHANGED,

    synchronizeAuthenticationDisplay

);


window.addEventListener(

    "edori-authentication-state-changed",

    synchronizeAuthenticationDisplay

);


/**
 * Initialize the authentication layer and then display
 * the correct experience.
 */
void initializeApplication();


async function initializeApplication():Promise<void> {

    try {

        await initializeAuthentication();


        /*
         * Load the shared PostgreSQL-backed EDORI model
         * configuration before rendering the authenticated
         * application.
         *
         * If no saved override exists, ConfigurationService
         * continues using the built-in TypeScript defaults.
         */
       if(isAuthenticated()){

    await initializeServerConfiguration();

    await initializeServerTriggerConfiguration();

    await initializeServerSurgePlan();

    await initializeServerResultState();

    await initializeServerSecurityAuditLog();

}


        initializeSessionSecurity();


        synchronizeAuthenticationDisplay();

    }
    catch(error){

        console.error(

            "EDORI authentication initialization failed:",

            error

        );


        renderAuthenticationInitializationError();

    }

}


/**
 * Show either LoginPage or the authenticated EDORI app.
 */
function synchronizeAuthenticationDisplay():void {

    const authenticationHost =

        document.getElementById(

            "edoriAuthenticationHost"

        );


    const passwordChangeHost =

        document.getElementById(

            "edoriPasswordChangeHost"

        );


    const applicationHost =

        document.getElementById(

            "edoriAuthenticatedApplicationHost"

        );


    if(

        !authenticationHost

        ||

        !passwordChangeHost

        ||

        !applicationHost

    ){

        return;

    }


    if(

        isAuthenticated()

        &&

        isPasswordChangeRequired()

    ){

        authenticationHost.hidden =
            true;


        authenticationHost.innerHTML =
            "";


        applicationHost.hidden =
            true;


        passwordChangeHost.hidden =
            false;


        passwordChangeHost.innerHTML =

            PasswordChangePage();


        initializePasswordChangePage(

            synchronizeAuthenticationDisplay

        );


        return;

    }


    passwordChangeHost.hidden =
        true;


    passwordChangeHost.innerHTML =
        "";


    if(isAuthenticated()){

        authenticationHost.hidden =
            true;


        authenticationHost.innerHTML =
            "";


        applicationHost.hidden =
            false;


        if(!authenticatedApplicationInitialized){

            applicationHost.innerHTML =

                App();


            initializeDashboard();


            authenticatedApplicationInitialized =
                true;

        }


        return;

    }


    applicationHost.hidden =
        true;


    authenticationHost.hidden =
        false;


    authenticationHost.innerHTML =

        LoginPage();


    initializeLoginPage();

}


/**
 * Render an unrecoverable authentication-startup error.
 */
function renderAuthenticationInitializationError():void {

    const authenticationHost =

        document.getElementById(

            "edoriAuthenticationHost"

        );


    const passwordChangeHost =

        document.getElementById(

            "edoriPasswordChangeHost"

        );


    const applicationHost =

        document.getElementById(

            "edoriAuthenticatedApplicationHost"

        );


    if(passwordChangeHost){

        passwordChangeHost.hidden =
            true;

    }


    if(applicationHost){

        applicationHost.hidden =
            true;

    }


    if(!authenticationHost){

        return;

    }


    authenticationHost.hidden =
        false;


    authenticationHost.innerHTML = `

        <main class="edori-login-page">

            <section class="edori-login-card edori-login-fatal-error">

                <h1>
                    EDORI could not start
                </h1>

                <p>
                    The authentication system could not be initialized.
                    Review the browser console for details.
                </p>

            </section>

        </main>

    `;

}


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