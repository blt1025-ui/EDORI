/**
 * Application Events
 *
 * Central source of truth for EDORI event names.
 *
 * Components and services should use these
 * constants instead of repeating string literals.
 */

export const APP_EVENTS = {

    /**
     * A new authoritative EDORI result has been
     * calculated or the current result has been
     * invalidated.
     */
    RESULT_CHANGED:
        "resultChanged",


    /**
     * The active historical-expectation dataset
     * was imported, cleared, or restored.
     */
    HISTORICAL_DATA_CHANGED:
        "historicalDataChanged",


    /**
     * Persistent assessment-history data changed.
     *
     * Reserved for future history controls such
     * as deletion, import, or external syncing.
     */
    HISTORY_CHANGED:
        "historyChanged",


    /**
     * Administrative configuration overrides
     * changed.
     */
    CONFIGURATION_CHANGED:
        "configurationChanged"

} as const;


/**
 * Union of all supported event-name values.
 */
export type AppEventName =

    typeof APP_EVENTS[

        keyof typeof APP_EVENTS

    ];