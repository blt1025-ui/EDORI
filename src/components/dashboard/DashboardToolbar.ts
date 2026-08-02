/**
 * DashboardToolbar
 *
 * Renders and controls the Expand All and
 * Collapse All buttons for right-column panels.
 */

const PANEL_SELECTOR =

    ".dashboard-collapsible-panel";


const EXPAND_BUTTON_ID =

    "expandAllDashboardPanels";


const COLLAPSE_BUTTON_ID =

    "collapseAllDashboardPanels";


/**
 * Render the dashboard panel toolbar.
 */
export function DashboardToolbar():string {

    return `

        <div class="dashboard-panel-toolbar">

            <div>

                <strong>
                    Operational Panels
                </strong>

                <span>
                    Open the sections needed for the current operational review.
                </span>

            </div>


            <div class="dashboard-panel-toolbar-actions">

                <button
                    id="${EXPAND_BUTTON_ID}"
                    class="dashboard-panel-toolbar-button"
                    type="button"
                >
                    Expand All
                </button>


                <button
                    id="${COLLAPSE_BUTTON_ID}"
                    class="dashboard-panel-toolbar-button"
                    type="button"
                >
                    Collapse All
                </button>

            </div>

        </div>

    `;

}


/**
 * Initialize native collapsible-panel behavior and
 * the Expand All and Collapse All controls.
 */
export function initializeDashboardToolbar():void {

    const panels = getDashboardPanels();


    panels.forEach(

        panel => {

            synchronizePanelState(

                panel

            );


            panel.addEventListener(

                "toggle",

                () => {

                    synchronizePanelState(

                        panel

                    );


                    updateToolbarState();

                }

            );

        }

    );


    getExpandAllButton()?.addEventListener(

        "click",

        expandAllDashboardPanels

    );


    getCollapseAllButton()?.addEventListener(

        "click",

        collapseAllDashboardPanels

    );


    updateToolbarState();

}


/**
 * Return every collapsible dashboard panel.
 */
function getDashboardPanels():

HTMLDetailsElement[] {

    return Array.from(

        document.querySelectorAll<

            HTMLDetailsElement

        >(

            PANEL_SELECTOR

        )

    );

}


/**
 * Return the Expand All button.
 */
function getExpandAllButton():

HTMLButtonElement | null {

    return document.getElementById(

        EXPAND_BUTTON_ID

    ) as HTMLButtonElement | null;

}


/**
 * Return the Collapse All button.
 */
function getCollapseAllButton():

HTMLButtonElement | null {

    return document.getElementById(

        COLLAPSE_BUTTON_ID

    ) as HTMLButtonElement | null;

}


/**
 * Expand every dashboard panel.
 */
function expandAllDashboardPanels():void {

    getDashboardPanels().forEach(

        panel => {

            panel.open = true;


            synchronizePanelState(

                panel

            );

        }

    );


    updateToolbarState();

}


/**
 * Collapse every dashboard panel.
 */
function collapseAllDashboardPanels():void {

    getDashboardPanels().forEach(

        panel => {

            panel.open = false;


            synchronizePanelState(

                panel

            );

        }

    );


    updateToolbarState();

}


/**
 * Synchronize the supplemental CSS class with the
 * native details-element open state.
 */
function synchronizePanelState(

    panel:HTMLDetailsElement

):void {

    panel.classList.toggle(

        "is-open",

        panel.open

    );

}


/**
 * Disable toolbar actions that are not currently
 * applicable.
 */
function updateToolbarState():void {

    const panels = getDashboardPanels();


    const expandAllButton =

        getExpandAllButton();


    const collapseAllButton =

        getCollapseAllButton();


    if(panels.length === 0){

        if(expandAllButton){

            expandAllButton.disabled = true;

        }


        if(collapseAllButton){

            collapseAllButton.disabled = true;

        }


        return;

    }


    const allPanelsOpen = panels.every(

        panel => panel.open

    );


    const allPanelsClosed = panels.every(

        panel => !panel.open

    );


    if(expandAllButton){

        expandAllButton.disabled =

            allPanelsOpen;

    }


    if(collapseAllButton){

        collapseAllButton.disabled =

            allPanelsClosed;

    }

}