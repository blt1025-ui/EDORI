/**
 * Sidebar
 *
 * Functional navigation for the EDORI dashboard.
 *
 * Responsibilities:
 *
 * - Render sidebar navigation
 * - Scroll to exact dashboard panels
 * - Open collapsed panels before navigation
 * - Highlight the selected navigation item
 * - Track visible sections while scrolling
 * - Provide keyboard-accessible navigation
 *
 * This component does not calculate or modify
 * EDORI operational data.
 */

interface SidebarNavigationItem {

    id:string;

    label:string;

    icon:string;

    targetSelectors:string[];

}


/**
 * Navigation destinations.
 *
 * These selectors match the exact panel IDs rendered
 * by Dashboard.ts and DashboardRightColumn.ts.
 */
const SIDEBAR_NAVIGATION_ITEMS:SidebarNavigationItem[] = [

    {

        id:
            "dashboard",

        label:
            "Dashboard",

        icon:
            "🏠",

        targetSelectors:[

            "#dashboard"

        ]

    },


    {

        id:
            "current-status",

        label:
            "Current Status",

        icon:
            "📋",

        targetSelectors:[

            "#gauge-panel",

            "#operational-overview-panel"

        ]

    },


    {

        id:
            "trends",

        label:
            "Trends",

        icon:
            "📈",

        targetSelectors:[

            "#trend-chart-panel",

            "#operational-timeline-panel"

        ]

    },


    {

        id:
            "historical-data",

        label:
            "Historical Data",

        icon:
            "📅",

        targetSelectors:[

            "#assessment-history-panel",

            "#historical-data-panel"

        ]

    },


    {

        id:
            "settings",

        label:
            "Settings",

        icon:
            "⚙️",

        targetSelectors:[

            "#historical-data-panel",

            "#history-restore-center-panel"

        ]

    },


    {

        id:
            "reports",

        label:
            "Reports",

        icon:
            "📄",

        targetSelectors:[

            "#executive-assessment-report-panel",

            "#shift-handoff-panel",

            "#data-export-center-panel"

        ]

    },


    {

        id:
            "about",

        label:
            "About",

        icon:
            "ℹ️",

        targetSelectors:[

            "#operational-level-reference-panel"

        ]

    }

];


/**
 * Render the sidebar.
 */
export function Sidebar():string {

    return `

        <aside
            id="applicationSidebar"
            class="sidebar"
            aria-label="EDORI dashboard navigation"
        >

            <div class="sidebar-header">

                <span class="sidebar-eyebrow">
                    EDORI
                </span>


                <h3>
                    Navigation
                </h3>

            </div>


            <nav
                class="sidebar-navigation"
                aria-label="Dashboard sections"
            >

                <ul class="sidebar-navigation-list">

                    ${SIDEBAR_NAVIGATION_ITEMS.map(

                        item =>

                            createNavigationItem(

                                item

                            )

                    ).join("")}

                </ul>

            </nav>


            <div class="sidebar-footer">

                <span>
                    Emergency Department
                </span>


                <strong>
                    Operational Readiness Index
                </strong>

            </div>

        </aside>

    `;

}


/**
 * Initialize sidebar behavior after the application
 * markup has been inserted into the DOM.
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


    navigationButtons.forEach(

        button => {

            button.addEventListener(

                "click",

                handleNavigationClick

            );

        }

    );


    initializeSidebarKeyboardSupport();


    initializeActiveSectionObserver();


    setInitialActiveNavigationItem();

}


/**
 * Render one navigation item.
 */
function createNavigationItem(

    item:SidebarNavigationItem

):string {

    return `

        <li class="sidebar-navigation-item">

            <button
                id="sidebarNavigation-${item.id}"
                class="sidebar-navigation-button"
                type="button"
                data-navigation-id="${item.id}"
                data-target-selectors="${item.targetSelectors.join("|")}"
                aria-label="Go to ${item.label}"
            >

                <span
                    class="sidebar-navigation-icon"
                    aria-hidden="true"
                >
                    ${item.icon}
                </span>


                <span class="sidebar-navigation-label">
                    ${item.label}
                </span>

            </button>

        </li>

    `;

}


/**
 * Handle one sidebar navigation click.
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


    const target =

        findNavigationTarget(

            button

        );


    if(!target){

        showUnavailableNavigationItem(

            button

        );


        console.warn(

            "Sidebar could not find a target.",

            {

                navigationId:
                    button.dataset.navigationId,

                targetSelectors:
                    button.dataset.targetSelectors

            }

        );


        return;

    }


    expandPanelForTarget(

        target

    );


    setActiveNavigationButton(

        button

    );


    /*
     * Allow a collapsed panel to finish opening before
     * measuring and scrolling to its location.
     */
    window.requestAnimationFrame(

        () => {

            window.requestAnimationFrame(

                () => {

                    scrollToTarget(

                        target

                    );

                }

            );

        }

    );

}


/**
 * Find the first existing target associated with a
 * sidebar navigation button.
 */
function findNavigationTarget(

    button:HTMLButtonElement

):HTMLElement | null {

    const selectors =

        button.dataset.targetSelectors

            ?.split("|")

            .map(

                selector =>

                    selector.trim()

            )

            .filter(Boolean)

        ?? [];


    for(const selector of selectors){

        try {

            const target =

                document.querySelector(

                    selector

                );


            if(target instanceof HTMLElement){

                return target;

            }

        }
        catch(error){

            console.warn(

                `Invalid sidebar selector: ${selector}`,

                error

            );

        }

    }


    return null;

}


/**
 * Open the selected collapsible panel before
 * scrolling to it.
 */
function expandPanelForTarget(

    target:HTMLElement

):void {

    const panel =

        target.matches(

            ".collapsible-panel"

        )

            ? target

            : target.closest(

                ".collapsible-panel"

            ) as HTMLElement | null;


    if(!panel){

        return;

    }


    const toggleButton =

        findPanelToggleButton(

            panel

        );


    const content =

        findPanelContent(

            panel

        );


    const isCollapsed =

        panel.classList.contains(

            "collapsed"

        )

        ||

        panel.classList.contains(

            "is-collapsed"

        )

        ||

        panel.dataset.collapsed === "true"

        ||

        toggleButton?.getAttribute(

            "aria-expanded"

        ) === "false"

        ||

        content?.hidden === true;


    if(

        isCollapsed

        &&

        toggleButton

    ){

        toggleButton.click();

    }

}


/**
 * Find the toggle button inside a collapsible panel.
 */
function findPanelToggleButton(

    panel:HTMLElement

):HTMLButtonElement | null {

    const selectors = [

        ".collapsible-panel-toggle",

        ".collapsible-toggle",

        ".dashboard-collapsible-toggle",

        "[data-collapsible-toggle]",

        "button[aria-expanded]"

    ];


    for(const selector of selectors){

        const element =

            panel.querySelector(

                selector

            );


        if(element instanceof HTMLButtonElement){

            return element;

        }

    }


    return null;

}


/**
 * Find the content region inside a collapsible panel.
 */
function findPanelContent(

    panel:HTMLElement

):HTMLElement | null {

    const selectors = [

        ".collapsible-panel-content",

        ".collapsible-content",

        ".dashboard-collapsible-content",

        "[data-collapsible-content]"

    ];


    for(const selector of selectors){

        const element =

            panel.querySelector(

                selector

            );


        if(element instanceof HTMLElement){

            return element;

        }

    }


    return null;

}


/**
 * Scroll to a dashboard section.
 */
function scrollToTarget(

    target:HTMLElement

):void {

    const headerOffset =

        calculateHeaderOffset();


    const targetTop =

        target.getBoundingClientRect().top

        +

        window.scrollY

        -

        headerOffset;


    window.scrollTo({

        top:
            Math.max(

                0,

                targetTop

            ),

        behavior:
            "smooth"

    });


    focusTargetAfterScroll(

        target

    );

}


/**
 * Calculate the amount of space that should remain
 * above the selected section.
 */
function calculateHeaderOffset():number {

    const header =

        document.querySelector(

            ".header"

        );


    const headerHeight =

        header instanceof HTMLElement

            ? header.getBoundingClientRect().height

            : 0;


    return headerHeight + 20;

}


/**
 * Highlight the active navigation button.
 */
function setActiveNavigationButton(

    activeButton:HTMLButtonElement

):void {

    getNavigationButtons().forEach(

        button => {

            const isActive =

                button === activeButton;


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
 * Briefly indicate that the selected section is not
 * currently available.
 */
function showUnavailableNavigationItem(

    button:HTMLButtonElement

):void {

    button.classList.add(

        "sidebar-navigation-unavailable"

    );


    window.setTimeout(

        () => {

            button.classList.remove(

                "sidebar-navigation-unavailable"

            );

        },

        900

    );

}


/**
 * Track visible dashboard sections while the user
 * scrolls.
 */
function initializeActiveSectionObserver():void {

    if(

        !("IntersectionObserver" in window)

    ){

        return;

    }


    const targetPairs =

        getNavigationButtons()

            .map(

                button => ({

                    button,

                    target:
                        findNavigationTarget(

                            button

                        )

                })

            )

            .filter(

                pair =>

                    pair.target !== null

            ) as Array<{

                button:HTMLButtonElement;

                target:HTMLElement;

            }>;


    if(targetPairs.length === 0){

        return;

    }


    const observer =

        new IntersectionObserver(

            entries => {

                const visibleEntries =

                    entries

                        .filter(

                            entry =>

                                entry.isIntersecting

                        )

                        .sort(

                            (

                                first,

                                second

                            ) =>

                                second.intersectionRatio

                                -

                                first.intersectionRatio

                        );


                const visibleEntry =

                    visibleEntries[0];


                if(!visibleEntry){

                    return;

                }


                const matchingPair =

                    targetPairs.find(

                        pair =>

                            pair.target

                            ===

                            visibleEntry.target

                    );


                if(matchingPair){

                    setActiveNavigationButton(

                        matchingPair.button

                    );

                }

            },

            {

                root:
                    null,

                rootMargin:
                    "-20% 0px -65% 0px",

                threshold:[

                    0,

                    0.1,

                    0.3,

                    0.6

                ]

            }

        );


    targetPairs.forEach(

        pair => {

            observer.observe(

                pair.target

            );

        }

    );

}


/**
 * Support keyboard movement between sidebar buttons.
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


                buttons[nextIndex]?.focus();


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


                buttons[previousIndex]?.focus();

            }

        }

    );

}


/**
 * Mark the first available navigation destination
 * active when the sidebar initializes.
 */
function setInitialActiveNavigationItem():void {

    const firstAvailableButton =

        getNavigationButtons().find(

            button =>

                findNavigationTarget(

                    button

                )

                !==

                null

        );


    if(firstAvailableButton){

        setActiveNavigationButton(

            firstAvailableButton

        );

    }

}


/**
 * Focus the destination without causing another
 * scroll jump.
 */
function focusTargetAfterScroll(

    target:HTMLElement

):void {

    window.setTimeout(

        () => {

            const alreadyFocusable =

                target.hasAttribute(

                    "tabindex"

                );


            if(!alreadyFocusable){

                target.setAttribute(

                    "tabindex",

                    "-1"

                );

            }


            target.focus({

                preventScroll:
                    true

            });


            if(!alreadyFocusable){

                target.addEventListener(

                    "blur",

                    () => {

                        target.removeAttribute(

                            "tabindex"

                        );

                    },

                    {

                        once:
                            true

                    }

                );

            }

        },

        450

    );

}


/**
 * Return every sidebar navigation button.
 */
function getNavigationButtons():

HTMLButtonElement[] {

    return Array.from(

        document.querySelectorAll(

            ".sidebar-navigation-button"

        )

    ).filter(

        (

            element

        ):element is HTMLButtonElement =>

            element

            instanceof

            HTMLButtonElement

    );

}