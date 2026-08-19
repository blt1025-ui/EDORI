/**
 * main
 *
 * Application entry point for EDORI.
 *
 * Responsibilities:
 *
 * - Load global styles
 * - Initialize authentication
 * - Restore authoritative PostgreSQL-backed application state
 * - Prevent authenticated pages from rendering before hydration completes
 * - Render the login experience when signed out
 * - Render and initialize EDORI once authenticated
 * - Keep login/application visibility synchronized
 * - Expose development-only testing tools
 */

import "./style.css";

import { APP_EVENTS } from "./config/appEvents";
import { App } from "./components/App";
import { initializeServerCurrentState } from "./services/StateService";
import { initializeDashboard } from "./components/Dashboard";
import { initializeLoginPage, LoginPage } from "./components/LoginPage";
import { initializePasswordChangePage, PasswordChangePage } from "./components/PasswordChangePage";
import { initializeAuthentication, isAuthenticated, isPasswordChangeRequired } from "./services/AuthenticationService";
import { subscribe } from "./services/EventService";
import { initializeSessionSecurity } from "./services/SessionSecurityService";
import { initializeServerTriggerConfiguration } from "./services/TriggerConfigurationService";
import { initializeServerSurgePlan } from "./services/SurgePlanService";
import { initializeServerResultState } from "./services/ResultService";
import { initializeServerSecurityAuditLog } from "./services/SecurityAuditService";
import { initializeSynchronizationService } from "./services/SynchronizationService";
import { initializeServerConfiguration } from "./services/ConfigurationService";
import { initializeServerHistoricalDataset } from "./services/HistoricalDataRepository";
import { copyEdoriScenarioResults, printEdoriCalibrationTable, printEdoriScenarioReport } from "./scenarios/runEdoriScenarios";
import { printOperationalTriggerReport } from "./scenarios/runOperationalTriggers";
import { printOperationalAssessmentReport } from "./scenarios/runOperationalAssessment";
import { runEdoriValidationSuite } from "./scenarios/runEdoriValidationSuite";

const appElement = document.querySelector<HTMLDivElement>("#app");

if(!appElement){
    throw new Error("EDORI could not find the #app root element.");
}

let authenticatedApplicationInitialized = false;
let applicationStartupComplete = false;
let authenticatedHydrationPromise:Promise<void> | null = null;

appElement.innerHTML = `
    <div id="edoriAuthenticationHost" class="edori-authentication-host"></div>
    <div id="edoriPasswordChangeHost" class="edori-password-change-host" hidden></div>
    <div id="edoriAuthenticatedApplicationHost" class="edori-authenticated-application-host" hidden></div>
`;

subscribe(
    APP_EVENTS.USERS_CHANGED,
    () => {
        if(isAuthenticated()){
            applicationStartupComplete = false;
            void hydrateAuthenticatedApplication().then(() => {
                synchronizeAuthenticationDisplay();
            });
            return;
        }

        applicationStartupComplete = false;
        synchronizeAuthenticationDisplay();
    }
);

window.addEventListener(
    "edori-authentication-state-changed",
    synchronizeAuthenticationDisplay
);

void initializeApplication();

async function initializeApplication():Promise<void> {
    try {
        await initializeAuthentication();

        if(isAuthenticated()){
            await hydrateAuthenticatedApplication();
        }

        initializeSessionSecurity();
        initializeSynchronizationService();
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

function hydrateAuthenticatedApplication():Promise<void> {
    if(!isAuthenticated()){
        applicationStartupComplete = false;
        return Promise.resolve();
    }

    if(applicationStartupComplete){
        return Promise.resolve();
    }

    if(authenticatedHydrationPromise){
        return authenticatedHydrationPromise;
    }

    authenticatedHydrationPromise = (async () => {
        try {
            await initializeServerCurrentState();
            await initializeServerConfiguration();
            await initializeServerHistoricalDataset();
            await initializeServerTriggerConfiguration();
            await initializeServerSurgePlan();
            await initializeServerResultState();
            await initializeServerSecurityAuditLog();

            applicationStartupComplete = true;
        }
        catch(error){
            applicationStartupComplete = false;
            console.error(
                "EDORI authenticated state hydration failed:",
                error
            );
            throw error;
        }
        finally {
            authenticatedHydrationPromise = null;
        }
    })();

    return authenticatedHydrationPromise;
}

function synchronizeAuthenticationDisplay():void {
    const authenticationHost = document.getElementById("edoriAuthenticationHost");
    const passwordChangeHost = document.getElementById("edoriPasswordChangeHost");
    const applicationHost = document.getElementById("edoriAuthenticatedApplicationHost");

    if(!authenticationHost || !passwordChangeHost || !applicationHost){
        return;
    }

    if(!isAuthenticated()){
        applicationHost.hidden = true;
        passwordChangeHost.hidden = true;
        passwordChangeHost.innerHTML = "";
        authenticationHost.hidden = false;
        authenticationHost.innerHTML = LoginPage();
        initializeLoginPage();
        return;
    }

    if(!applicationStartupComplete){
        authenticationHost.hidden = true;
        passwordChangeHost.hidden = true;
        applicationHost.hidden = false;

        if(!authenticatedApplicationInitialized){
            applicationHost.innerHTML = `
                <main class="edori-startup-loading">
                    <section class="edori-startup-loading-card">
                        <h1>Loading Hospital Readiness</h1>
                        <p>Restoring the current assessment and operational state...</p>
                    </section>
                </main>
            `;
        }

        return;
    }

    if(isPasswordChangeRequired()){
        authenticationHost.hidden = true;
        authenticationHost.innerHTML = "";
        applicationHost.hidden = true;
        passwordChangeHost.hidden = false;
        passwordChangeHost.innerHTML = PasswordChangePage();
        initializePasswordChangePage(synchronizeAuthenticationDisplay);
        return;
    }

    passwordChangeHost.hidden = true;
    passwordChangeHost.innerHTML = "";
    authenticationHost.hidden = true;
    authenticationHost.innerHTML = "";
    applicationHost.hidden = false;

    if(!authenticatedApplicationInitialized){
        applicationHost.innerHTML = App();
        initializeDashboard();
        authenticatedApplicationInitialized = true;
    }
}

function renderAuthenticationInitializationError():void {
    const authenticationHost = document.getElementById("edoriAuthenticationHost");
    const passwordChangeHost = document.getElementById("edoriPasswordChangeHost");
    const applicationHost = document.getElementById("edoriAuthenticatedApplicationHost");

    if(passwordChangeHost){
        passwordChangeHost.hidden = true;
    }

    if(applicationHost){
        applicationHost.hidden = true;
    }

    if(!authenticationHost){
        return;
    }

    authenticationHost.hidden = false;
    authenticationHost.innerHTML = `
        <main class="edori-login-page">
            <section class="edori-login-card edori-login-fatal-error">
                <h1>EDORI could not start</h1>
                <p>
                    The authentication system or shared application state could not be initialized.
                    Review the browser console for details.
                </p>
            </section>
        </main>
    `;
}

if(import.meta.env.DEV){
    const developmentWindow = window as Window & {
        runEdoriScenarios?:() => void;
        showEdoriCalibration?:() => void;
        copyEdoriScenarioResults?:() => Promise<void>;
        runOperationalTriggers?:() => void;
        runOperationalAssessment?:() => void;
        runEdoriValidationSuite?:() => unknown;
    };

    developmentWindow.runEdoriScenarios = printEdoriScenarioReport;
    developmentWindow.showEdoriCalibration = printEdoriCalibrationTable;
    developmentWindow.copyEdoriScenarioResults = copyEdoriScenarioResults;
    developmentWindow.runOperationalTriggers = printOperationalTriggerReport;
    developmentWindow.runOperationalAssessment = printOperationalAssessmentReport;
    developmentWindow.runEdoriValidationSuite = runEdoriValidationSuite;

    console.info(
        [
            "EDORI development tools are available:",
            "runEdoriScenarios()",
            "showEdoriCalibration()",
            "copyEdoriScenarioResults()",
            "runOperationalTriggers()",
            "runOperationalAssessment()",
            "runEdoriValidationSuite()"
        ].join("\n")
    );
}