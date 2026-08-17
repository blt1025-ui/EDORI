/**
 * Permission
 *
 * Granular EDORI authorization capabilities.
 *
 * Components and services should check permissions,
 * not hard-coded role names.
 */

export type Permission =

    /*
     * Viewing
     */
    | "dashboard.view"
    | "operationalDetail.view"
    | "assessment.view"
    | "assessmentHistory.view"
    | "reports.view"
    | "administration.view"

    /*
     * Assessment workflow
     */
    | "assessment.create"
    | "assessment.save"

    /*
     * Reporting / export
     */
    | "handoff.copy"
    | "reports.export"

    /*
     * Administration
     */
    | "historicalData.manage"
    | "history.restore"
    | "configurationBackup.manage"
    | "modelConfiguration.manage"
    | "triggerConfiguration.manage"
    | "surgePlan.manage"

    /*
     * Users and access
     */
    | "users.manage"
    | "roles.manage";