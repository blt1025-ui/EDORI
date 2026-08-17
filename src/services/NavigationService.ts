/**
 * NavigationService
 *
 * Controls top-level EDORI application-page navigation.
 *
 * The application uses four primary pages:
 *
 * - Dashboard
 * - Assessment
 * - Operational Detail
 * - Administration
 *
 * Navigation is intentionally independent from
 * EDORI assessment and calculation state.
 *
 * Page access is permission-aware so unauthorized
 * pages cannot be reached through either the sidebar
 * or direct programmatic navigation.
 */

import type {

    Permission

}

from "../types/Permission";


import {

    hasPermission

}

from "./AuthorizationService";


export type ApplicationPage =

    | "dashboard"

    | "assessment"

    | "operational-detail"

    | "administration";


type NavigationListener = (

    page:ApplicationPage

) => void;


/**
 * Default application landing page.
 */
const DEFAULT_PAGE:ApplicationPage =

    "dashboard";


/**
 * Permission required to access each application page.
 */
const PAGE_PERMISSIONS:
Record<ApplicationPage,Permission> = {

    dashboard:
        "dashboard.view",

    assessment:
        "assessment.view",

    "operational-detail":
        "operationalDetail.view",

    administration:
        "administration.view"

};


/**
 * Current application page.
 */
let currentPage:ApplicationPage =

    DEFAULT_PAGE;


/**
 * Registered navigation listeners.
 */
const listeners = new Set<

    NavigationListener

>();


/**
 * Return the current application page.
 */
export function getCurrentPage():ApplicationPage {

    return currentPage;

}


/**
 * Return the permission required for one page.
 */
export function getPagePermission(

    page:ApplicationPage

):Permission {

    return PAGE_PERMISSIONS[
        page
    ];

}


/**
 * Determine whether the current EDORI user may
 * navigate to a page.
 */
export function canNavigateToPage(

    page:ApplicationPage

):boolean {

    return hasPermission(

        PAGE_PERMISSIONS[
            page
        ]

    );

}


/**
 * Navigate to another application page.
 *
 * Unauthorized navigation is rejected centrally.
 *
 * Returns true when navigation is permitted and false
 * when the requested page is not authorized.
 */
export function navigateToPage(

    page:ApplicationPage

):boolean {

    if(

        !canNavigateToPage(
            page
        )

    ){

        console.warn(

            `EDORI navigation denied for page "${page}".`

        );


        return false;

    }


    if(

        page === currentPage

    ){

        /*
         * Still notify listeners so the DOM can be
         * synchronized during initial setup.
         */

        notifyListeners();


        return true;

    }


    currentPage =

        page;


    notifyListeners();


    return true;

}


/**
 * Ensure the current page is still authorized.
 *
 * This is used after the current EDORI user changes.
 * For example, switching from Administrator to Viewer
 * while Administration is open should immediately
 * return the user to an authorized page.
 */
export function ensureAuthorizedPage():ApplicationPage {

    if(

        canNavigateToPage(
            currentPage
        )

    ){

        return currentPage;

    }


    const fallbackPage =

        getFirstAuthorizedPage();


    currentPage =

        fallbackPage;


    notifyListeners();


    return currentPage;

}


/**
 * Return the first page the current user is allowed
 * to access.
 *
 * Dashboard is normally available to all current EDORI
 * roles, but this function keeps navigation resilient
 * if permission definitions change later.
 */
export function getFirstAuthorizedPage():ApplicationPage {

    const orderedPages:ApplicationPage[] = [

        "dashboard",

        "assessment",

        "operational-detail",

        "administration"

    ];


    return (

        orderedPages.find(

            page =>
                canNavigateToPage(
                    page
                )

        )

        ?? DEFAULT_PAGE

    );

}


/**
 * Subscribe to page-navigation changes.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToNavigation(

    listener:NavigationListener

):() => void {

    listeners.add(

        listener

    );


    return () => {

        listeners.delete(

            listener

        );

    };

}


/**
 * Reset navigation to the default page when permitted.
 *
 * Primarily useful for development/testing.
 */
export function resetNavigation():void {

    currentPage =

        canNavigateToPage(
            DEFAULT_PAGE
        )

            ? DEFAULT_PAGE

            : getFirstAuthorizedPage();


    notifyListeners();

}


/**
 * Determine whether a string represents a valid
 * application page.
 */
export function isApplicationPage(

    value:string | undefined

):value is ApplicationPage {

    return (

        value === "dashboard"

        ||

        value === "assessment"

        ||

        value === "operational-detail"

        ||

        value === "administration"

    );

}


/**
 * Notify all registered navigation listeners.
 */
function notifyListeners():void {

    listeners.forEach(

        listener => {

            try {

                listener(

                    currentPage

                );

            }
            catch(error){

                console.error(

                    "EDORI navigation listener failed:",

                    error

                );

            }

        }

    );

}