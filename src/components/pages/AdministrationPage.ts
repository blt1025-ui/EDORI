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
 * - Provide operational-level reference material
 * - Provide the future home for user management,
 *   permissions, and configurable system settings
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

    HistoryRestoreCenter

}

from "../HistoryRestoreCenter";


import {

    OperationalLevelReference

}

from "../OperationalLevelReference";


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
                        Manage historical baselines, data exports, backups, reference information, and system configuration.
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


                <div class="administration-data-grid">

                    ${CollapsiblePanel({

                        id:
                            "data-export-center-panel",

                        title:
                            "Data Export Center",

                        description:
                            "Download current assessment and saved history data",

                        content:
                            DataExportCenter(),

                        initiallyOpen:
                            true

                    })}


                    ${CollapsiblePanel({

                        id:
                            "history-restore-center-panel",

                        title:
                            "History Restore Center",

                        description:
                            "Validate and restore a saved assessment-history backup",

                        content:
                            HistoryRestoreCenter(),

                        initiallyOpen:
                            true

                    })}

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
        "Review current Hospital Readiness model settings",

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


                <div class="administration-access-grid">

                    ${createFutureAdministrationCard({

                        icon:
                            "👤",

                        title:
                            "User Management",

                        description:
                            "Create, edit, deactivate, and review application users.",

                        status:
                            "Planned"

                    })}


                    ${createFutureAdministrationCard({

                        icon:
                            "🔐",

                        title:
                            "Roles & Permissions",

                        description:
                            "Control access to assessment, reporting, historical-data, and administrative functions.",

                        status:
                            "Planned"

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
 * Create one placeholder card for planned
 * administrative functionality.
 */
function createFutureAdministrationCard(

    options:{

        icon:string;

        title:string;

        description:string;

        status:string;

    }

):string {

    return `

        <article class="administration-future-card">

            <div class="administration-future-card-header">

                <span
                    class="administration-future-card-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        options.icon
                    )}

                </span>


                <span class="administration-future-card-status">

                    ${escapeHtml(
                        options.status
                    )}

                </span>

            </div>


            <h4>

                ${escapeHtml(
                    options.title
                )}

            </h4>


            <p>

                ${escapeHtml(
                    options.description
                )}

            </p>

        </article>

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