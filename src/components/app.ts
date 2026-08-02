/**
 * App
 *
 * Renders the main EDORI application structure.
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

    Dashboard

}

from "./Dashboard";


/**
 * Render the complete application.
 */
export function App():string {

    return `

        ${Header()}


        <div class="main-layout">

            ${Sidebar()}

            ${Dashboard()}

        </div>

    `;

}