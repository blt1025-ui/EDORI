/**
 * Sidebar
 *
 * Primary EDORI application navigation.
 *
 * Version 2.1 page architecture:
 *
 * - Dashboard
 * - Assessment
 * - Operational Detail
 * - Administration
 *
 * The sidebar changes the visible application page.
 * It does not scroll between dashboard sections.
 *
 * Navigation does not modify EDORI assessment data,
 * results, history, or calculations.
 */

import {

    getCurrentPage,

    isApplicationPage,

    navigateToPage,

    subscribeToNavigation

}

from "../services/NavigationService";


import type {

    ApplicationPage

}

from "../services/NavigationService";


interface SidebarNavigationItem {

    id:ApplicationPage;

    label:string;

    description:string;

    icon:string;

}


/**
 * Professional line icons used by the sidebar.
 *
 * These are inline SVG fragments so EDORI does not
 * require an external icon library or network asset.
 */
const ICONS = {

    dashboard:
        `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M4 4h6v6H4V4Zm10 0h6v10h-6V4ZM4 14h6v6H4v-6Zm10 4h6v2h-6v-2Z"
                />
            </svg>
        `,

    assessment:
        `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M7 3h10v2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V3Zm2 2h6V4H9v1Zm-2 5h10V8H7v2Zm0 4h10v-2H7v2Zm0 4h7v-2H7v2Z"
                />
            </svg>
        `,

    operationalDetail:
        `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M4 19h16v2H4v-2Zm1-2V9h3v8H5Zm5 0V4h3v13h-3Zm5 0v-6h3v6h-3Z"
                />
            </svg>
        `,

    administration:
        `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8.4 5a8.5 8.5 0 0 0 0-2l2-1.5-2-3.5-2.4 1a8.3 8.3 0 0 0-1.7-1L16 3h-4l-.3 3a8.3 8.3 0 0 0-1.7 1L7.6 6 5.6 9.5l2 1.5a8.5 8.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8.3 8.3 0 0 0 1.7 1l.3 3h4l.3-3a8.3 8.3 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5ZM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
                />
            </svg>
        `

} as const;


/**
 * Primary EDORI application pages.
 */
const SIDEBAR_NAVIGATION_ITEMS:

SidebarNavigationItem[] = [

    {

        id:
            "dashboard",

        label:
            "Dashboard",

        description:
            "Current readiness",

        icon:
            ICONS.dashboard

    },


    {

        id:
            "assessment",

        label:
            "Assessment",

        description:
            "Data entry and history",

        icon:
            ICONS.assessment

    },


    {

        id:
            "operational-detail",

        label:
            "Operational Detail",

        description:
            "Drivers and outlook",

        icon:
            ICONS.operationalDetail

    },


    {

        id:
            "administration",

        label:
            "Administration",

        description:
            "Data and configuration",

        icon:
            ICONS.administration

    }

];


/**
 * Render the application sidebar.
 */
export function Sidebar():string {

    return `

        <aside
            id="applicationSidebar"
            class="sidebar"
            aria-label="EDORI application navigation"
        >

            <div class="sidebar-header">

                <div class="sidebar-product-mark">

                    <span
                        class="sidebar-product-badge"
                        aria-hidden="true"
                    >
                        HRI
                    </span>


                    <div class="sidebar-product-copy">

                        <span class="sidebar-eyebrow">
                            Hospital Operations
                        </span>


                        <h1 class="sidebar-application-title">
                            Hospital Readiness Index
                        </h1>

                    </div>

                </div>

            </div>


            <span class="sidebar-navigation-heading">
                Workspace
            </span>


            <nav
                class="sidebar-navigation"
                aria-label="Application pages"
            >

                <ul class="sidebar-navigation-list">

                    ${SIDEBAR_NAVIGATION_ITEMS

                        .map(

                            createNavigationItem

                        )

                        .join("")}

                </ul>

            </nav>


            <div class="sidebar-footer">

                <div class="sidebar-footer-status">

                    <span
                        class="sidebar-footer-status-dot"
                        aria-hidden="true"
                    >
                    </span>


                    <div>

                        <span class="sidebar-footer-label">
                            Operational Tool
                        </span>


                        <strong>
                            EDORI · Version 2.1
                        </strong>

                    </div>

                </div>

            </div>

        </aside>

    `;

}


/**
 * Initialize page-navigation behavior after the
 * application markup has been inserted into the DOM.
 */
export function initializeSidebar():void {

    const navigationButtons =

        getNavigationButtons();


    if(navigationButtons.length === 0){

        console.warn(

            "Sidebar initialization could not find any navigation buttons."

        );


        return;

    }


    /*
     * Handle page-selection clicks.
     */
    navigationButtons.forEach(

        button => {

            button.addEventListener(

                "click",

                handleNavigationClick

            );

        }

    );


    /*
     * Retain keyboard navigation from the previous
     * sidebar implementation.
     */
    initializeSidebarKeyboardSupport();


    /*
     * Keep visible page markup and active sidebar
     * state synchronized with NavigationService.
     */
    subscribeToNavigation(

        synchronizeNavigationDisplay

    );


    /*
     * Initial synchronization.
     *
     * Dashboard is the NavigationService default.
     */
    synchronizeNavigationDisplay(

        getCurrentPage()

    );

}


/**
 * Render one page-navigation item.
 */
function createNavigationItem(

    item:SidebarNavigationItem

):string {

    const isDefaultPage =

        item.id === "dashboard";


    return `

        <li class="sidebar-navigation-item">

            <button
                id="sidebarNavigation-${item.id}"
                class="
                    sidebar-navigation-button
                    ${isDefaultPage
                        ? "active"
                        : ""
                    }
                "
                type="button"
                data-application-page="${item.id}"
                aria-label="Go to ${escapeAttribute(
                    item.label
                )}"
                ${isDefaultPage
                    ? 'aria-current="page"'
                    : ""
                }
            >

                <span
                    class="sidebar-navigation-active-indicator"
                    aria-hidden="true"
                >
                </span>


                <span
                    class="sidebar-navigation-icon"
                    aria-hidden="true"
                >

                    ${item.icon}

                </span>


                <span class="sidebar-navigation-text">

                    <span class="sidebar-navigation-label">

                        ${escapeHtml(
                            item.label
                        )}

                    </span>


                    <span class="sidebar-navigation-description">

                        ${escapeHtml(
                            item.description
                        )}

                    </span>

                </span>


                <span
                    class="sidebar-navigation-chevron"
                    aria-hidden="true"
                >
                    ›
                </span>

            </button>

        </li>

    `;

}


/**
 * Handle one navigation-button click.
 */
function handleNavigationClick(

    event:Event

):void {

    const button =

        event.currentTarget;


    if(

        !(

            button

            instanceof

            HTMLButtonElement

        )

    ){

        return;

    }


    const requestedPage =

        button.dataset.applicationPage;


    if(

        !isApplicationPage(

            requestedPage

        )

    ){

        console.warn(

            "Sidebar received an invalid application page.",

            requestedPage

        );


        return;

    }


    navigateToPage(

        requestedPage

    );

}


/**
 * Synchronize page visibility and sidebar state.
 */
function synchronizeNavigationDisplay(

    page:ApplicationPage

):void {

    updateApplicationPages(

        page

    );


    updateNavigationButtons(

        page

    );


    /*
     * Each application page begins at its own top.
     *
     * Avoid smooth scrolling because page changes
     * should feel immediate rather than like the
     * previous section-navigation behavior.
     */
    window.scrollTo({

        top:
            0,

        behavior:
            "auto"

    });

}


/**
 * Show the selected application page and hide the
 * other three pages.
 */
function updateApplicationPages(

    activePage:ApplicationPage

):void {

    const pageElements =

        Array.from(

            document.querySelectorAll(

                "[data-application-page]"

            )

        )

        .filter(

            (

                element

            ):element is HTMLElement =>

                element

                instanceof

                HTMLElement

        );


    pageElements.forEach(

        element => {

            /*
             * Sidebar buttons also have a page data
             * attribute. Only application-page main
             * containers should be shown/hidden here.
             */
            if(

                !element.classList.contains(

                    "application-page"

                )

            ){

                return;

            }


            const pageValue =

                element.dataset.applicationPage;


            const isActive =

                pageValue === activePage;


            element.hidden =

                !isActive;


            element.classList.toggle(

                "application-page-active",

                isActive

            );


            if(isActive){

                element.setAttribute(

                    "aria-hidden",

                    "false"

                );

            }
            else {

                element.setAttribute(

                    "aria-hidden",

                    "true"

                );

            }

        }

    );

}


/**
 * Highlight the navigation button associated with the
 * selected page.
 */
function updateNavigationButtons(

    activePage:ApplicationPage

):void {

    getNavigationButtons().forEach(

        button => {

            const isActive =

                button.dataset.applicationPage

                ===

                activePage;


            button.classList.toggle(

                "active",

                isActive

            );


            if(isActive){

                button.setAttribute(

                    "aria-current",

                    "page"

                );

            }
            else {

                button.removeAttribute(

                    "aria-current"

                );

            }

        }

    );

}


/**
 * Support keyboard movement between page-navigation
 * buttons.
 *
 * Supported:
 *
 * Home
 * End
 * Arrow Up
 * Arrow Down
 * Arrow Left
 * Arrow Right
 */
function initializeSidebarKeyboardSupport():void {

    const navigationList =

        document.querySelector(

            ".sidebar-navigation-list"

        );


    navigationList?.addEventListener(

        "keydown",

        event => {

            if(

                !(

                    event

                    instanceof

                    KeyboardEvent

                )

            ){

                return;

            }


            const buttons =

                getNavigationButtons();


            if(buttons.length === 0){

                return;

            }


            const focusedElement =

                document.activeElement;


            const currentIndex =

                buttons.findIndex(

                    button =>

                        button === focusedElement

                );


            if(event.key === "Home"){

                event.preventDefault();


                buttons[0]?.focus();


                return;

            }


            if(event.key === "End"){

                event.preventDefault();


                buttons[

                    buttons.length - 1

                ]?.focus();


                return;

            }


            if(

                event.key === "ArrowDown"

                ||

                event.key === "ArrowRight"

            ){

                event.preventDefault();


                const nextIndex =

                    currentIndex < 0

                        ? 0

                        : (

                            currentIndex + 1

                        )

                        %

                        buttons.length;


                buttons[

                    nextIndex

                ]?.focus();


                return;

            }


            if(

                event.key === "ArrowUp"

                ||

                event.key === "ArrowLeft"

            ){

                event.preventDefault();


                const previousIndex =

                    currentIndex <= 0

                        ? buttons.length - 1

                        : currentIndex - 1;


                buttons[

                    previousIndex

                ]?.focus();

            }

        }

    );

}


/**
 * Return every sidebar page-navigation button.
 */
function getNavigationButtons():

HTMLButtonElement[] {

    return Array.from(

        document.querySelectorAll(

            ".sidebar-navigation-button"

        )

    )

        .filter(

            (

                element

            ):element is HTMLButtonElement =>

                element

                instanceof

                HTMLButtonElement

        );

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll("\"", "&quot;")

        .replaceAll("'", "&#039;");

}


/**
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}