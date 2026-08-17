/**
 * AdministrationPage
 *
 * Administrative workspace for EDORI.
 *
 * Responsibilities:
 *
 * - Manage historical baseline data
 * - Export operational and assessment data
 * - Restore saved EDORI history
 * - Manage configuration backups
 * - Provide operational-level reference material
 * - Provide Hospital Readiness system configuration
 * - Manage EDORI application users
 * - Review authentication and account-security audit events
 *
 * Routine assessment and operational decision-support
 * functions intentionally live on the other pages.
 */

import {

    DataExportCenter

}

from "../DataExportCenter";


import {

    SystemConfiguration

}

from "../SystemConfiguration";


import {

    HistoricalDataManager

}

from "../HistoricalDataManager";


import {

    ConfigurationBackupCenter

}

from "../ConfigurationBackupCenter";


import {

    HistoryRestoreCenter

}

from "../HistoryRestoreCenter";


import {

    OperationalLevelReference

}

from "../OperationalLevelReference";


import {

    UserManagement

}

from "../UserManagement";


import {

    SecurityAuditLog

}

from "../SecurityAuditLog";


import {

    CollapsiblePanel

}

from "../dashboard/CollapsiblePanel";


/**
 * Render the Administration page.
 */
export function AdministrationPage():string {

    return `

        <main
            id="administrationPage"
            class="
                application-page
                administration-page
            "
            data-application-page="administration"
            hidden
        >

            <div class="application-page-heading">

                <div>

                    <span class="application-page-eyebrow">
                        System Management
                    </span>


                    <h2>
                        Administration
                    </h2>


                    <p>
                        Manage historical baselines, data exports, backups,
                        reference information, system configuration, and
                        application access.
                    </p>

                </div>

            </div>


            <!-- =========================================
                 HISTORICAL DATA
            ========================================== -->

            <section
                class="
                    administration-section
                    administration-section-historical
                "
                aria-label="Historical data management"
            >

                ${createAdministrationSectionLabel(
                    "Historical Data"
                )}


                ${CollapsiblePanel({

                    id:
                        "historical-data-panel",

                    title:
                        "Historical Data Management",

                    description:
                        "Import and manage historical operational baseline data",

                    content:
                        HistoricalDataManager(),

                    initiallyOpen:
                        true

                })}

            </section>


            <!-- =========================================
                 DATA + BACKUP
            ========================================== -->

            <section
                class="
                    administration-section
                    administration-section-data
                "
                aria-label="Data export and backup"
            >

                ${createAdministrationSectionLabel(
                    "Data & Backup"
                )}


                <div class="administration-data-workflow">

                    <!-- =================================
                         DATA EXPORT
                    ================================== -->

                    <div class="administration-data-workflow-primary">

                        ${CollapsiblePanel({

                            id:
                                "data-export-center-panel",

                            title:
                                "Data Export Center",

                            description:
                                "Download the current assessment, assessment history, or a restorable history backup",

                            content:
                                DataExportCenter(),

                            initiallyOpen:
                                true

                        })}

                    </div>


                    <!-- =================================
                         HISTORY RESTORE
                    ================================== -->

                    <div class="administration-data-workflow-secondary">

                        ${CollapsiblePanel({

                            id:
                                "history-restore-center-panel",

                            title:
                                "Restore Assessment History",

                            description:
                                "Validate and restore a previously exported Hospital Readiness history backup",

                            content:
                                HistoryRestoreCenter(),

                            initiallyOpen:
                                false

                        })}

                    </div>


                    <!-- =================================
                         CONFIGURATION BACKUP
                    ================================== -->

                    <div class="administration-data-workflow-tertiary">

                        ${CollapsiblePanel({

                            id:
                                "configuration-backup-center-panel",

                            title:
                                "Configuration Backup & Restore",

                            description:
                                "Export or restore the Hospital Readiness model, operational triggers, and Hospital Surge Plan configuration",

                            content:
                                ConfigurationBackupCenter(),

                            initiallyOpen:
                                false

                        })}

                    </div>

                </div>

            </section>


            <!-- =========================================
                 REFERENCE + CONFIGURATION
            ========================================== -->

            <section
                class="
                    administration-section
                    administration-section-configuration
                "
                aria-label="Reference and system configuration"
            >

                ${createAdministrationSectionLabel(
                    "Reference & Configuration"
                )}


                <div class="administration-configuration-grid">

                    ${CollapsiblePanel({

                        id:
                            "operational-level-reference-panel",

                        title:
                            "Operational Level Reference",

                        description:
                            "Alpha through Echo definitions and score ranges",

                        content:
                            OperationalLevelReference()

                    })}


                    ${CollapsiblePanel({

                        id:
                            "system-configuration-panel",

                        title:
                            "System Configuration",

                        description:
                            "Review and manage current Hospital Readiness model settings",

                        content:
                            SystemConfiguration()

                    })}

                </div>

            </section>


            <!-- =========================================
                 USERS + ACCESS
            ========================================== -->

            <section
                class="
                    administration-section
                    administration-section-access
                "
                aria-label="Users and access"
            >

                ${createAdministrationSectionLabel(
                    "Users & Access"
                )}


                <div class="administration-access-workspace">

                    ${CollapsiblePanel({

                        id:
                            "user-management-panel",

                        title:
                            "User Management",

                        description:
                            "Create, edit, deactivate, and manage EDORI application users",

                        content:
                            UserManagement(),

                        initiallyOpen:
                            false

                    })}


                    ${CollapsiblePanel({

                        id:
                            "security-audit-log-panel",

                        title:
                            "Security Audit Log",

                        description:
                            "Review authentication, password, role, and account-management activity",

                        content:
                            SecurityAuditLog(),

                        initiallyOpen:
                            false

                    })}

                </div>

            </section>

        </main>

    `;

}


/**
 * Render one compact Administration category label.
 */
function createAdministrationSectionLabel(

    title:string

):string {

    return `

        <div class="administration-section-label">

            ${escapeHtml(
                title
            )}

        </div>

    `;

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            "\"",
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}