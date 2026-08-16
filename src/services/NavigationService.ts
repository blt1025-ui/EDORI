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
 */

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
 * Navigate to another application page.
 */
export function navigateToPage(

    page:ApplicationPage

):void {

    if(

        page === currentPage

    ){

        /*
         * Still notify listeners so the DOM can be
         * synchronized during initial setup.
         */

        notifyListeners();

        return;

    }


    currentPage = page;


    notifyListeners();

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
 * Reset navigation to the default page.
 *
 * Primarily useful for development/testing.
 */
export function resetNavigation():void {

    currentPage =

        DEFAULT_PAGE;


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