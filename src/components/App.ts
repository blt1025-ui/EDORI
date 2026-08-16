/**
 * App
 *
 * Renders the main EDORI application shell.
 *
 * The application is divided into four persistent
 * top-level pages:
 *
 * - Dashboard
 * - Assessment
 * - Operational Detail
 * - Administration
 *
 * All page markup remains mounted in the DOM so
 * navigating between pages does not destroy EDORI
 * form state, results, history, or component event
 * subscriptions.
 *
 * Component initialization is handled by main.ts
 * after this markup has been inserted into the DOM.
 */

import {

    Header

}

from "./Header";


import {

    Sidebar

}

from "./Sidebar";


import {

    DashboardPage

}

from "./pages/DashboardPage";


import {

    AssessmentPage

}

from "./pages/AssessmentPage";


import {

    OperationalDetailPage

}

from "./pages/OperationalDetailPage";


import {

    AdministrationPage

}

from "./pages/AdministrationPage";


/**
 * Render the complete application.
 */
export function App():string {

    return `

        ${Header()}


        <div class="main-layout">

            ${Sidebar()}


            <div
                id="applicationPageContainer"
                class="application-page-container"
            >

                ${DashboardPage()}


                ${AssessmentPage()}


                ${OperationalDetailPage()}


                ${AdministrationPage()}

            </div>

        </div>

    `;

}