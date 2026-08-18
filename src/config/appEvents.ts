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
     * The authoritative committed Hospital Readiness
     * assessment changed locally or was synchronized
     * from PostgreSQL.
     */
    STATE_CHANGED:
        "stateChanged",


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
     * Administrative model configuration overrides
     * changed.
     */
    CONFIGURATION_CHANGED:
        "configurationChanged",


    /**
     * Hospital surge-plan response configuration
     * changed.
     *
     * This event does not mean the HRI score or
     * operational state changed. It means the
     * trigger-driven response plan changed.
     */
    SURGE_PLAN_CHANGED:
        "surgePlanChanged",


    /**
     * Hospital-specific operational trigger mapping
     * changed.
     *
     * This changes derived triggers/recommendations,
     * not the HRI calculation itself.
     */
    TRIGGER_CONFIGURATION_CHANGED:
        "triggerConfigurationChanged",


    /**
     * Application users, role assignments, or the
     * active user/session changed.
     *
     * Components that display user identity or enforce
     * authorization can refresh from this event.
     */
    USERS_CHANGED:
        "usersChanged"

} as const;


/**
 * Union of all supported event-name values.
 */
export type AppEventName =

    typeof APP_EVENTS[

        keyof typeof APP_EVENTS

    ];