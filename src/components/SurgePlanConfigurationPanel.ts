/**
 * SurgePlanConfigurationPanel
 *
 * Administrative editor for the hospital-specific
 * operational response plan.
 *
 * The panel is intentionally separate from HRI model
 * configuration. Changing this plan changes only the
 * trigger-driven operational recommendations.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    getOperationalTriggers,

    getTriggerConfiguration,

    saveTriggerConfiguration

}

from "../services/TriggerConfigurationService";


import {

    subscribe

}

from "../services/EventService";


import {

    exportSurgePlan,

    getSurgePlan,

    getSurgePlanSavedAt,

    hasSurgePlanOverrides,

    importSurgePlan,

    restoreDefaultSurgePlan,

    saveSurgePlan

}

from "../services/SurgePlanService";


import type {

    OperationalIntervention,

    OperationalInterventionCategory

}

from "../types/OperationalIntervention";


import type {

    OperationalRecommendationPriority

}

from "../types/OperationalRecommendation";


import type {

    SurgePlanConfiguration

}

from "../types/SurgePlanConfiguration";


/**
 * Local editor state.
 */
let editing = false;


/**
 * In-memory draft used while editing. This prevents
 * expand/collapse actions from discarding unsaved changes.
 */
let editorDraftPlan:SurgePlanConfiguration | null = null;


/**
 * Prevent duplicate event subscriptions if the
 * parent System Configuration component re-renders.
 */
let subscribed = false;


/**
 * Collapsed category names.
 */
const collapsedCategories =

    new Set<string>();


/**
 * Read-only action IDs with expanded detail.
 */
const expandedReadOnlyActions =

    new Set<string>();


/**
 * Editor action IDs with expanded detail.
 */
const expandedEditorActions =

    new Set<string>();


/**
 * Render the surge-plan configuration panel.
 */
export function SurgePlanConfigurationPanel():string {

    return `

        <section
            id="surgePlanConfigurationPanel"
            class="surge-plan-configuration-panel surge-plan-ui-v2"
        >

            <div
                id="surgePlanConfigurationContent"
                class="surge-plan-configuration-content"
                aria-live="polite"
            >

                ${createMarkup()}

            </div>

        </section>

    `;

}


/**
 * Initialize panel behavior.
 */
export function initializeSurgePlanConfigurationPanel():void {

    bindControls();


    if(subscribed){

        return;

    }


    subscribed = true;


    subscribe(

        APP_EVENTS.SURGE_PLAN_CHANGED,

        () => {

            editing = false;

            editorDraftPlan = null;

            expandedEditorActions.clear();

            refresh();

        }

    );

}


/**
 * Refresh only the surge-plan panel.
 */
function refresh():void {

    const container =

        document.getElementById(

            "surgePlanConfigurationContent"

        );


    if(!container){

        return;

    }


    container.innerHTML =

        createMarkup();


    bindControls();

}


/**
 * Create complete panel markup.
 */
function createMarkup():string {

    const plan =

        editing && editorDraftPlan

            ? clonePlan(

                editorDraftPlan

            )

            : getSurgePlan();


    const savedAt =

        getSurgePlanSavedAt();


    const hasOverrides =

        hasSurgePlanOverrides();


    return `

        ${createHeader(
            plan,
            hasOverrides,
            savedAt
        )}


        <div
            id="surgePlanConfigurationMessage"
            class="surge-plan-configuration-message"
            hidden
        >
        </div>


        ${editing

            ? createEditor(
                plan
            )

            : createReadOnlyPlan(
                plan
            )

        }


        <div class="surge-plan-separation-note">

            <div
                class="surge-plan-separation-icon"
                aria-hidden="true"
            >
                i
            </div>


            <div>

                <strong>
                    Response-plan configuration does not change the HRI.
                </strong>

                <p>
                    These settings define what the hospital does after an operational trigger is recognized. HRI scoring, operational levels, and trigger thresholds remain unchanged.
                </p>

            </div>

        </div>

    `;

}


/**
 * Header and plan controls.
 */
function createHeader(

    plan:SurgePlanConfiguration,

    hasOverrides:boolean,

    savedAt:string | null

):string {

    const enabledCount =

        plan.interventions.filter(

            item => item.enabled

        ).length;


    return `

        <div class="surge-plan-configuration-header">

            <div class="surge-plan-header-copy">

                <span class="surge-plan-configuration-eyebrow">
                    Operational Response
                </span>


                <div class="surge-plan-heading-row">

                    <h3>
                        Hospital Surge Plan
                    </h3>


                    <span
                        class="
                            surge-plan-source
                            ${
                                hasOverrides
                                    ? "override"
                                    : "default"
                            }
                        "
                    >

                        ${
                            hasOverrides
                                ? "Hospital Customization"
                                : "Built-In Plan"
                        }

                    </span>

                </div>


                <p>
                    Customize the operational actions EDORI recommends when configured triggers become active.
                </p>

            </div>


            <div class="surge-plan-configuration-header-actions">

                ${!editing

                    ? `

                        <button
                            id="exportSurgePlanReadOnlyButton"
                            class="system-configuration-secondary-button"
                            type="button"
                        >
                            Export
                        </button>


                        <button
                            id="manageSurgePlanButton"
                            class="system-configuration-primary-button"
                            type="button"
                        >
                            Manage Surge Plan
                        </button>

                    `

                    : `

                        <span class="surge-plan-editing-badge">
                            Editing
                        </span>

                    `

                }

            </div>

        </div>


        <div class="surge-plan-status-strip">

            <div class="surge-plan-status-primary">

                <span>
                    Active Plan
                </span>

                <strong>
                    ${escapeHtml(
                        plan.name
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Response Actions
                </span>

                <strong>
                    ${plan.interventions.length}
                </strong>

            </div>


            <div>

                <span>
                    Enabled
                </span>

                <strong>
                    ${enabledCount}
                </strong>

            </div>


            <div>

                <span>
                    Disabled
                </span>

                <strong>
                    ${plan.interventions.length - enabledCount}
                </strong>

            </div>


            <div>

                <span>
                    Last Saved
                </span>

                <strong>
                    ${
                        savedAt
                            ? escapeHtml(
                                formatDateTime(
                                    savedAt
                                )
                            )
                            : "Built-In"
                    }
                </strong>

            </div>

        </div>

    `;

}


/**
 * Read-only surge-plan summary.
 */
function createReadOnlyPlan(

    plan:SurgePlanConfiguration

):string {

    const categories =

        getCategories(

            plan

        );


    return `

        <div class="surge-plan-readonly">

            <div class="surge-plan-description-card">

                <div>

                    <span>
                        Plan Description
                    </span>

                    <p>
                        ${escapeHtml(
                            plan.description
                            ||
                            "No plan description has been configured."
                        )}
                    </p>

                </div>

            </div>


            <div class="surge-plan-category-list">

                ${categories

                    .map(

                        category =>

                            createReadOnlyCategory(

                                plan,
                                category

                            )

                    )

                    .join("")}

            </div>

        </div>

    `;

}


/**
 * Read-only category.
 */
function createReadOnlyCategory(

    plan:SurgePlanConfiguration,

    category:string

):string {

    const items =

        plan.interventions.filter(

            intervention =>

                intervention.category

                ===

                category

        );


    const enabledCount =

        items.filter(

            intervention =>

                intervention.enabled

        ).length;


    const collapsed =

        collapsedCategories.has(

            category

        );


    return `

        <section class="surge-plan-category">

            <button
                class="surge-plan-category-heading"
                type="button"
                data-surge-category-toggle="${escapeAttribute(
                    category
                )}"
                aria-expanded="${
                    collapsed
                        ? "false"
                        : "true"
                }"
            >

                <div class="surge-plan-category-heading-copy">

                    <span
                        class="surge-plan-category-chevron"
                        aria-hidden="true"
                    >
                        ${collapsed ? "›" : "⌄"}
                    </span>


                    <div>

                        <strong>
                            ${escapeHtml(
                                category
                            )}
                        </strong>

                        <small>
                            ${enabledCount} enabled of ${items.length}
                        </small>

                    </div>

                </div>


                <span class="surge-plan-category-count">
                    ${items.length}
                </span>

            </button>


            <div
                class="surge-plan-action-list"
                ${
                    collapsed
                        ? "hidden"
                        : ""
                }
            >

                ${items

                    .map(

                        intervention =>

                            createReadOnlyActionCard(

                                intervention

                            )

                    )

                    .join("")}

            </div>

        </section>

    `;

}


/**
 * One compact read-only response action.
 */
function createReadOnlyActionCard(

    intervention:OperationalIntervention

):string {

    const triggerTitles =

        getTriggerTitlesForIntervention(

            intervention.id

        );


    const expanded =

        expandedReadOnlyActions.has(

            intervention.id

        );


    return `

        <article
            class="
                surge-plan-action-card
                ${
                    intervention.enabled
                        ? "enabled"
                        : "disabled"
                }
            "
        >

            <div class="surge-plan-action-summary">

                <div class="surge-plan-action-summary-main">

                    <div class="surge-plan-action-title-line">

                        <h4>
                            ${escapeHtml(
                                intervention.title
                            )}
                        </h4>


                        <span
                            class="
                                surge-plan-priority
                                priority-${intervention
                                    .defaultPriority
                                    .toLowerCase()}
                            "
                        >
                            ${escapeHtml(
                                intervention.defaultPriority
                            )}
                        </span>

                    </div>


                    <div class="surge-plan-action-summary-meta">

                        <span class="surge-plan-action-owner">

                            <small>
                                Responsible
                            </small>

                            <strong>
                                ${escapeHtml(
                                    intervention.responsibleGroup
                                )}
                            </strong>

                        </span>


                        <span class="surge-plan-action-trigger-count">

                            <small>
                                Used by
                            </small>

                            <strong>
                                ${triggerTitles.length} trigger${
                                    triggerTitles.length === 1
                                        ? ""
                                        : "s"
                                }
                            </strong>

                        </span>

                    </div>

                </div>


                <div class="surge-plan-action-summary-controls">

                    <span
                        class="
                            surge-plan-enabled-status
                            ${
                                intervention.enabled
                                    ? "enabled"
                                    : "disabled"
                            }
                        "
                    >
                        ${
                            intervention.enabled
                                ? "Enabled"
                                : "Disabled"
                        }
                    </span>


                    <button
                        class="surge-plan-detail-button"
                        type="button"
                        data-surge-action-toggle="${escapeAttribute(
                            intervention.id
                        )}"
                        aria-expanded="${
                            expanded
                                ? "true"
                                : "false"
                        }"
                    >
                        ${expanded ? "Hide details" : "View details"}
                    </button>

                </div>

            </div>


            <div
                class="surge-plan-action-details"
                ${
                    expanded
                        ? ""
                        : "hidden"
                }
            >

                <div class="surge-plan-action-detail-section">

                    <span>
                        What to do
                    </span>

                    <p>
                        ${escapeHtml(
                            intervention.description
                        )}
                    </p>

                </div>


                <div class="surge-plan-action-detail-grid">

                    <div>

                        <span>
                            Operational objective
                        </span>

                        <p>
                            ${escapeHtml(
                                intervention.objective
                            )}
                        </p>

                    </div>


                    <div>

                        <span>
                            Trigger associations
                        </span>

                        <p>
                            ${triggerTitles.length > 0

                                ? escapeHtml(
                                    triggerTitles.join(
                                        ", "
                                    )
                                )

                                : "This action is not currently assigned to an operational trigger."

                            }
                        </p>

                    </div>

                </div>

            </div>

        </article>

    `;

}


/**
 * Editable plan.
 */
function createEditor(

    plan:SurgePlanConfiguration

):string {

    const categories =

        getCategories(

            plan

        );


    return `

        <div class="surge-plan-editor">

            <div
                id="surgePlanValidation"
                class="system-configuration-validation"
                hidden
            >
            </div>


            <div class="surge-plan-editor-toolbar">

                <div>

                    <strong>
                        Manage Hospital Surge Plan
                    </strong>

                    <p>
                        Add and customize recommendations, including the operational triggers that activate each recommendation.
                    </p>

                </div>


                <div class="surge-plan-editor-toolbar-actions">

                    <button
                        id="addSurgePlanActionButton"
                        class="system-configuration-primary-button"
                        type="button"
                    >
                        + Add Recommendation
                    </button>


                    <button
                        id="importSurgePlanButton"
                        class="system-configuration-secondary-button"
                        type="button"
                    >
                        Import
                    </button>


                    <input
                        id="importSurgePlanFileInput"
                        type="file"
                        accept=".json,application/json"
                        hidden
                    >


                    <button
                        id="exportSurgePlanButton"
                        class="system-configuration-secondary-button"
                        type="button"
                    >
                        Export
                    </button>

                </div>

            </div>


            <div class="surge-plan-plan-fields">

                <label>

                    <span>
                        Plan Name
                    </span>

                    <input
                        id="surgePlanName"
                        type="text"
                        value="${escapeAttribute(
                            plan.name
                        )}"
                    >

                </label>


                <label class="surge-plan-plan-description-field">

                    <span>
                        Plan Description
                    </span>

                    <textarea
                        id="surgePlanDescription"
                        rows="3"
                    >${escapeHtml(
                        plan.description
                    )}</textarea>

                </label>

            </div>


            <div class="surge-plan-editor-category-list">

                ${categories

                    .map(

                        category =>

                            createEditorCategory(

                                plan,
                                category

                            )

                    )

                    .join("")}

            </div>


            <div class="surge-plan-editor-actions">

                <div class="surge-plan-editor-actions-left">

                    <button
                        id="restoreSurgePlanButton"
                        class="system-configuration-danger-button"
                        type="button"
                    >
                        Restore Built-In Plan
                    </button>

                </div>


                <div class="surge-plan-editor-actions-right">

                    <button
                        id="cancelSurgePlanButton"
                        class="system-configuration-secondary-button"
                        type="button"
                    >
                        Cancel
                    </button>


                    <button
                        id="saveSurgePlanButton"
                        class="system-configuration-primary-button"
                        type="button"
                    >
                        Save Surge Plan
                    </button>

                </div>

            </div>

        </div>

    `;

}


/**
 * Editor category.
 */
function createEditorCategory(

    plan:SurgePlanConfiguration,

    category:string

):string {

    const items =

        plan.interventions

            .map(

                (
                    intervention,
                    index
                ) => ({

                    intervention,
                    index

                })

            )

            .filter(

                item =>

                    item.intervention.category

                    ===

                    category

            );


    const collapsed =

        collapsedCategories.has(

            category

        );


    return `

        <section class="surge-plan-editor-category">

            <button
                class="surge-plan-category-heading"
                type="button"
                data-surge-category-toggle="${escapeAttribute(
                    category
                )}"
                aria-expanded="${
                    collapsed
                        ? "false"
                        : "true"
                }"
            >

                <div class="surge-plan-category-heading-copy">

                    <span
                        class="surge-plan-category-chevron"
                        aria-hidden="true"
                    >
                        ${collapsed ? "›" : "⌄"}
                    </span>


                    <div>

                        <strong>
                            ${escapeHtml(
                                category
                            )}
                        </strong>

                        <small>
                            ${items.length} response action${
                                items.length === 1
                                    ? ""
                                    : "s"
                            }
                        </small>

                    </div>

                </div>


                <span class="surge-plan-category-count">
                    ${items.length}
                </span>

            </button>


            <div
                class="surge-plan-editor-category-actions"
                ${
                    collapsed
                        ? "hidden"
                        : ""
                }
            >

                ${items

                    .map(

                        item =>

                            createActionEditor(

                                item.intervention,
                                item.index

                            )

                    )

                    .join("")}

            </div>

        </section>

    `;

}


/**
 * One compact action editor.
 *
 * Inputs remain rendered even while details are
 * collapsed so save behavior remains unchanged.
 */
function createActionEditor(

    intervention:OperationalIntervention,

    index:number

):string {

    


    const expanded =

        expandedEditorActions.has(

            intervention.id

        );


    return `

        <article
            class="surge-plan-action-editor"
            data-surge-action-index="${index}"
            data-surge-action-id="${escapeAttribute(
                intervention.id
            )}"
        >

            <div class="surge-plan-action-editor-summary">

                <div class="surge-plan-action-editor-summary-main">

                    <div class="surge-plan-action-title-line">

                        <strong>
                            ${escapeHtml(
                                intervention.title
                            )}
                        </strong>


                        <span
                            class="
                                surge-plan-priority
                                priority-${intervention
                                    .defaultPriority
                                    .toLowerCase()}
                            "
                        >
                            ${escapeHtml(
                                intervention.defaultPriority
                            )}
                        </span>

                    </div>


                    <span class="surge-plan-action-id">
                        ${escapeHtml(
                            intervention.id
                        )}
                    </span>

                </div>


                <div class="surge-plan-action-editor-summary-controls">

                    <label class="surge-plan-enabled-toggle">

                        <input
                            id="surgeActionEnabled${index}"
                            type="checkbox"
                            ${
                                intervention.enabled
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            Enabled
                        </span>

                    </label>


                    <button
                        class="surge-plan-detail-button"
                        type="button"
                        data-surge-editor-action-toggle="${escapeAttribute(
                            intervention.id
                        )}"
                        aria-expanded="${
                            expanded
                                ? "true"
                                : "false"
                        }"
                    >
                        ${expanded ? "Close editor" : "Edit action"}
                    </button>

                </div>

            </div>


            <div
                class="surge-plan-action-editor-details"
                ${
                    expanded
                        ? ""
                        : "hidden"
                }
            >

                <div class="surge-plan-action-editor-grid">

                    <label class="surge-plan-editor-field-wide">

                        <span>
                            Action Name
                        </span>

                        <input
                            id="surgeActionTitle${index}"
                            type="text"
                            value="${escapeAttribute(
                                intervention.title
                            )}"
                        >

                    </label>


                    <label>

                        <span>
                            Priority
                        </span>

                        <select
                            id="surgeActionPriority${index}"
                        >
                            ${createPriorityOptions(
                                intervention.defaultPriority
                            )}
                        </select>

                    </label>


                    <label>

                        <span>
                            Category
                        </span>

                        <select
                            id="surgeActionCategory${index}"
                        >
                            ${createCategoryOptions(
                                intervention.category
                            )}
                        </select>

                    </label>


                    <label>

                        <span>
                            Reassessment Interval (minutes)
                        </span>

                        <input
                            id="surgeActionReassessment${index}"
                            type="number"
                            min="1"
                            step="1"
                            value="${
                                intervention.reassessmentMinutes === null
                                    ? ""
                                    : escapeAttribute(
                                        String(
                                            intervention.reassessmentMinutes
                                        )
                                    )
                            }"
                            placeholder="Optional"
                        >

                    </label>


                    <label>

                        <span>
                            Responsible Group
                        </span>

                        <input
                            id="surgeActionResponsibleGroup${index}"
                            type="text"
                            value="${escapeAttribute(
                                intervention.responsibleGroup
                            )}"
                        >

                    </label>


                    <label class="surge-plan-editor-field-wide">

                        <span>
                            Action Description
                        </span>

                        <textarea
                            id="surgeActionDescription${index}"
                            rows="3"
                        >${escapeHtml(
                            intervention.description
                        )}</textarea>

                    </label>


                    <label class="surge-plan-editor-field-wide">

                        <span>
                            Objective
                        </span>

                        <textarea
                            id="surgeActionObjective${index}"
                            rows="2"
                        >${escapeHtml(
                            intervention.objective
                        )}</textarea>

                    </label>

                </div>


                <div class="surge-plan-action-editor-trigger-note">

                    <span>
                        Trigger Associations
                    </span>

                    <small>
                        Select every operational trigger that should recommend this action. Trigger thresholds and HRI scoring are not changed here.
                    </small>

                    <div class="surge-plan-trigger-association-grid">
                        ${createTriggerAssociationOptions(
                            intervention.id
                        )}
                    </div>

                </div>

            </div>

        </article>

    `;

}


/**
 * Return ordered categories for the current plan.
 */
function getCategories(

    plan:SurgePlanConfiguration

):string[] {

    return Array.from(

        new Set(

            plan.interventions.map(

                intervention =>

                    intervention.category

            )

        )

    );

}


/**
 * Supported response-action categories.
 */
function createCategoryOptions(

    current:OperationalInterventionCategory

):string {

    const categories:OperationalInterventionCategory[] = [

        "ED Capacity",
        "ED Flow",
        "Boarding",
        "Hospital Throughput",
        "Leadership Escalation",
        "Clinical Operations",
        "Monitoring"

    ];


    return categories

        .map(

            category => `

                <option
                    value="${escapeAttribute(category)}"
                    ${category === current ? "selected" : ""}
                >
                    ${escapeHtml(category)}
                </option>

            `

        )

        .join("");

}


/**
 * Trigger checkboxes for one recommendation.
 */
function createTriggerAssociationOptions(

    interventionId:string

):string {

    return getOperationalTriggers()

        .map(

            trigger => {

                const checked =
                    trigger.interventionIds.includes(
                        interventionId
                    );


                return `
                    <label class="surge-plan-trigger-association-option">
                        <input
                            type="checkbox"
                            data-surge-trigger-association="${escapeAttribute(interventionId)}"
                            data-surge-trigger-id="${escapeAttribute(trigger.id)}"
                            ${checked ? "checked" : ""}
                        >
                        <span>
                            <strong>${escapeHtml(trigger.title)}</strong>
                            <small>${escapeHtml(trigger.category)}</small>
                        </span>
                    </label>
                `;

            }

        )

        .join("");

}


/**
 * Priority-select options.
 */
function createPriorityOptions(

    current:OperationalRecommendationPriority

):string {

    const priorities:

    OperationalRecommendationPriority[] = [

        "Routine",

        "Moderate",

        "High",

        "Immediate"

    ];


    return priorities

        .map(

            priority => `

                <option
                    value="${priority}"
                    ${
                        priority === current
                            ? "selected"
                            : ""
                    }
                >
                    ${priority}
                </option>

            `

        )

        .join("");

}


/**
 * Bind visible controls.
 */
function bindControls():void {

    bindButton(

        "manageSurgePlanButton",

        () => {

            editing = true;

            editorDraftPlan = clonePlan(

                getSurgePlan()

            );

            expandedEditorActions.clear();

            refresh();

        }

    );


    bindButton(

        "cancelSurgePlanButton",

        () => {

            editing = false;

            expandedEditorActions.clear();

            refresh();

        }

    );


    bindButton(

        "addSurgePlanActionButton",

        addRecommendation

    );


    bindButton(

        "saveSurgePlanButton",

        saveEditor

    );


    bindButton(

        "restoreSurgePlanButton",

        restoreDefaults

    );


    bindButton(

        "exportSurgePlanButton",

        downloadPlan

    );


    bindButton(

        "exportSurgePlanReadOnlyButton",

        downloadPlan

    );


    bindButton(

        "importSurgePlanButton",

        () => {

            const input =

                document.getElementById(

                    "importSurgePlanFileInput"

                );


            if(

                input

                instanceof

                HTMLInputElement

            ){

                input.click();

            }

        }

    );


    document

        .querySelectorAll<

            HTMLButtonElement

        >(

            "[data-surge-category-toggle]"

        )

        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const category =

                            button.dataset
                                .surgeCategoryToggle;


                        if(!category){

                            return;

                        }


                        if(

                            collapsedCategories.has(

                                category

                            )

                        ){

                            collapsedCategories.delete(

                                category

                            );

                        }

                        else{

                            collapsedCategories.add(

                                category

                            );

                        }


                        captureEditorDraft();

                        refresh();

                    }

                );

            }

        );


    document

        .querySelectorAll<

            HTMLButtonElement

        >(

            "[data-surge-action-toggle]"

        )

        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const id =

                            button.dataset
                                .surgeActionToggle;


                        if(!id){

                            return;

                        }


                        toggleSetValue(

                            expandedReadOnlyActions,

                            id

                        );


                        refresh();

                    }

                );

            }

        );


    document

        .querySelectorAll<

            HTMLButtonElement

        >(

            "[data-surge-editor-action-toggle]"

        )

        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const id =

                            button.dataset
                                .surgeEditorActionToggle;


                        if(!id){

                            return;

                        }


                        toggleSetValue(

                            expandedEditorActions,

                            id

                        );


                        captureEditorDraft();

                        refresh();

                    }

                );

            }

        );


    const fileInput =

        document.getElementById(

            "importSurgePlanFileInput"

        );


    if(

        fileInput

        instanceof

        HTMLInputElement

    ){

        fileInput.addEventListener(

            "change",

            importPlanFile

        );

    }

}


/**
 * Toggle one string within a set.
 */
function toggleSetValue(

    target:Set<string>,

    value:string

):void {

    if(

        target.has(

            value

        )

    ){

        target.delete(

            value

        );

    }

    else{

        target.add(

            value

        );

    }

}


/**
 * Save edited values.
 */
function saveEditor():void {

    const previousPlan =
        getSurgePlan();

    const plan =
        readPlanFromEditor();


    if(!plan){

        showValidationErrors([
            "Unable to read the Hospital Surge Plan editor."
        ]);

        return;

    }


    const triggerConfiguration =
        readTriggerAssociationsFromEditor(
            plan
        );


    if(!triggerConfiguration){

        showValidationErrors([
            "Unable to read recommendation trigger associations."
        ]);

        return;

    }


    const surgeResult =
        saveSurgePlan(
            plan
        );


    if(!surgeResult.valid){

        showValidationErrors(
            surgeResult.errors
        );

        return;

    }


    const triggerResult =
        saveTriggerConfiguration(
            triggerConfiguration
        );


    if(!triggerResult.valid){

        // Restore the prior plan in memory/server if the
        // trigger mapping unexpectedly fails validation.
        saveSurgePlan(
            previousPlan
        );

        showValidationErrors(
            triggerResult.errors
        );

        return;

    }


    editing = false;
    editorDraftPlan = null;
    expandedEditorActions.clear();

}


/**
 * Read the complete current editor.
 */
function readPlanFromEditor():

SurgePlanConfiguration | null {

    const current =

        editorDraftPlan

            ? clonePlan(

                editorDraftPlan

            )

            : getSurgePlan();


    const name =

        readInputValue(

            "surgePlanName"

        );


    const description =

        readInputValue(

            "surgePlanDescription"

        );


    if(

        name === null

        ||

        description === null

    ){

        return null;

    }


    const interventions:

    OperationalIntervention[] = [];


    for(

        let index = 0;

        index < current.interventions.length;

        index += 1

    ){

        const existing =

            current.interventions[index];


        const title =

            readInputValue(

                `surgeActionTitle${index}`

            );


        const actionDescription =

            readInputValue(

                `surgeActionDescription${index}`

            );


        const categoryValue =

            readInputValue(

                `surgeActionCategory${index}`

            );


        const reassessmentMinutes =

            readOptionalPositiveNumber(

                `surgeActionReassessment${index}`

            );


        const responsibleGroup =

            readInputValue(

                `surgeActionResponsibleGroup${index}`

            );


        const objective =

            readInputValue(

                `surgeActionObjective${index}`

            );


        const priority =

            readPriority(

                `surgeActionPriority${index}`

            );


        const enabled =

            readCheckbox(

                `surgeActionEnabled${index}`

            );


        if(

            title === null

            ||

            actionDescription === null

            ||

            categoryValue === null

            ||

            reassessmentMinutes === undefined

            ||

            responsibleGroup === null

            ||

            objective === null

            ||

            priority === null

            ||

            enabled === null

        ){

            return null;

        }


        interventions.push({

            ...existing,

            title,

            description:
                actionDescription,

            defaultPriority:
                priority,

            category:
                categoryValue as OperationalInterventionCategory,

            reassessmentMinutes,

            responsibleGroup,

            objective,

            enabled

        });

    }


    return {

        ...current,

        name,

        description,

        interventions

    };

}


/**
 * Restore built-in plan after confirmation.
 */
function restoreDefaults():void {

    const confirmed =

        window.confirm(

            "Restore the built-in Hospital Surge Plan? All saved hospital-specific response customizations will be removed."

        );


    if(!confirmed){

        return;

    }


    editing = false;

    editorDraftPlan = null;

    expandedEditorActions.clear();

    restoreDefaultSurgePlan();

}


/**
 * Download the effective plan as JSON.
 */
function downloadPlan():void {

    try {

        const blob =

            new Blob(

                [

                    exportSurgePlan()

                ],

                {

                    type:
                        "application/json"

                }

            );


        const url =

            URL.createObjectURL(

                blob

            );


        const anchor =

            document.createElement(

                "a"

            );


        anchor.href = url;

        anchor.download =

            "Hospital_Readiness_Surge_Plan.json";


        document.body.appendChild(

            anchor

        );


        anchor.click();


        anchor.remove();


        URL.revokeObjectURL(

            url

        );

    }

    catch(error){

        console.error(

            "Unable to export Hospital Surge Plan:",

            error

        );


        showMessage(

            "The Hospital Surge Plan could not be exported.",

            "error"

        );

    }

}


/**
 * Import a JSON surge-plan file.
 */
async function importPlanFile(

    event:Event

):Promise<void> {

    const input =

        event.currentTarget;


    if(

        !(

            input

            instanceof

            HTMLInputElement

        )

    ){

        return;

    }


    const file =

        input.files?.[0];


    input.value = "";


    if(!file){

        return;

    }


    try {

        const result =

            importSurgePlan(

                await file.text()

            );


        if(!result.valid){

            showValidationErrors(

                result.errors

            );


            return;

        }


        editing = false;

        editorDraftPlan = null;

        expandedEditorActions.clear();

    }

    catch(error){

        console.error(

            "Unable to import Hospital Surge Plan:",

            error

        );


        showValidationErrors([

            "The selected Hospital Surge Plan file could not be read."

        ]);

    }

}


/**
 * Add a new editable recommendation to the draft plan.
 */
function addRecommendation():void {

    captureEditorDraft();

    const current =
        editorDraftPlan
            ? clonePlan(editorDraftPlan)
            : getSurgePlan();

    const id =
        createUniqueRecommendationId(
            current
        );

    current.interventions.push({
        id,
        title:
            "New Recommendation",
        description:
            "",
        category:
            "Clinical Operations",
        defaultPriority:
            "Moderate",
        responsibleGroup:
            "",
        objective:
            "",
        reassessmentMinutes:
            240,
        enabled:
            true
    });

    editorDraftPlan = current;
    expandedEditorActions.add(id);
    collapsedCategories.delete(
        "Clinical Operations"
    );

    refresh();

}


function createUniqueRecommendationId(

    plan:SurgePlanConfiguration

):string {

    const used =
        new Set(
            plan.interventions.map(
                intervention => intervention.id
            )
        );

    const base =
        `custom-recommendation-${Date.now()}`;

    let candidate = base;
    let suffix = 2;

    while(used.has(candidate)){
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }

    return candidate;

}


/**
 * Capture visible editor values before a UI-only refresh.
 */
function captureEditorDraft():void {

    if(!editing){
        return;
    }

    const draft =
        readPlanFromEditor();

    if(draft){
        editorDraftPlan = draft;
    }

}


/**
 * Build the trigger override configuration represented by
 * the recommendation association checkboxes.
 */
function readTriggerAssociationsFromEditor(

    plan:SurgePlanConfiguration

):ReturnType<typeof getTriggerConfiguration> | null {

    const configuration =
        getTriggerConfiguration();

    const validRecommendationIds =
        new Set(
            plan.interventions.map(
                intervention => intervention.id
            )
        );


    for(const override of configuration.overrides){

        const trigger =
            getOperationalTriggers().find(
                item => item.id === override.triggerId
            );

        if(!trigger){
            return null;
        }

        const selectedIds:string[] = [];

        for(const intervention of plan.interventions){

            const selector =
                `input[data-surge-trigger-association="${cssEscape(intervention.id)}"][data-surge-trigger-id="${cssEscape(trigger.id)}"]`;

            const input =
                document.querySelector<HTMLInputElement>(
                    selector
                );

            if(input?.checked){
                selectedIds.push(
                    intervention.id
                );
            }

        }

        // Preserve any legacy mapping IDs that are not part
        // of the current plan rather than silently deleting
        // them from an imported configuration.
        const legacyIds =
            override.interventionIds.filter(
                id => !validRecommendationIds.has(id)
            );

        override.interventionIds =
            Array.from(
                new Set([
                    ...selectedIds,
                    ...legacyIds
                ])
            );

    }

    return configuration;

}


function readOptionalPositiveNumber(

    id:string

):number | null | undefined {

    const element =
        document.getElementById(id);

    if(!(element instanceof HTMLInputElement)){
        return undefined;
    }

    const value =
        element.value.trim();

    if(value.length === 0){
        return null;
    }

    const parsed = Number(value);

    if(
        !Number.isFinite(parsed)
        ||
        parsed <= 0
    ){
        return undefined;
    }

    return parsed;

}


function clonePlan(

    plan:SurgePlanConfiguration

):SurgePlanConfiguration {

    return {
        ...plan,
        interventions:
            plan.interventions.map(
                intervention => ({
                    ...intervention
                })
            )
    };

}


function cssEscape(

    value:string

):string {

    if(
        typeof CSS !== "undefined"
        &&
        typeof CSS.escape === "function"
    ){
        return CSS.escape(value);
    }

    return value.replace(
        /(["\\])/g,
        "\\$1"
    );

}


/**
 * Return trigger titles that currently reference an
 * intervention identifier.
 */
function getTriggerTitlesForIntervention(

    interventionId:string

):string[] {

    return getOperationalTriggers()

        .filter(

            trigger =>

                trigger.interventionIds.includes(

                    interventionId

                )

        )

        .map(

            trigger =>

                trigger.title

        );

}


/**
 * Bind one optional button.
 */
function bindButton(

    id:string,

    callback:() => void

):void {

    const button =

        document.getElementById(

            id

        );


    if(

        button

        instanceof

        HTMLButtonElement

    ){

        button.addEventListener(

            "click",

            callback

        );

    }

}


/**
 * Read text input or textarea.
 */
function readInputValue(
    id:string
):string | null {

    const element =
        document.getElementById(
            id
        );

    if(
        element
        instanceof
        HTMLInputElement
        ||
        element
        instanceof
        HTMLTextAreaElement
        ||
        element
        instanceof
        HTMLSelectElement
    ){

        return element.value;

    }

    return null;

}


/**
 * Read enabled checkbox.
 */
function readCheckbox(

    id:string

):boolean | null {

    const element =

        document.getElementById(

            id

        );


    if(

        element

        instanceof

        HTMLInputElement

        &&

        element.type === "checkbox"

    ){

        return element.checked;

    }


    return null;

}


/**
 * Read priority select.
 */
function readPriority(

    id:string

):OperationalRecommendationPriority | null {

    const element =

        document.getElementById(

            id

        );


    if(

        !(

            element

            instanceof

            HTMLSelectElement

        )

    ){

        return null;

    }


    switch(element.value){

        case "Routine":

        case "Moderate":

        case "High":

        case "Immediate":

            return element.value;


        default:

            return null;

    }

}


/**
 * Show editor validation errors.
 */
function showValidationErrors(

    errors:string[]

):void {

    const container =

        document.getElementById(

            "surgePlanValidation"

        );


    if(!container){

        showMessage(

            errors.join(
                " "
            ),

            "error"

        );


        return;

    }


    container.hidden = false;


    container.innerHTML = `

        <strong>
            Hospital Surge Plan could not be saved
        </strong>


        <ul>

            ${errors

                .map(

                    error => `

                        <li>
                            ${escapeHtml(
                                error
                            )}
                        </li>

                    `

                )

                .join("")}

        </ul>

    `;


    container.scrollIntoView({

        behavior:
            "smooth",

        block:
            "nearest"

    });

}


/**
 * Show a lightweight panel message.
 */
function showMessage(

    message:string,

    type:"information" | "success" | "error"

):void {

    const container =

        document.getElementById(

            "surgePlanConfigurationMessage"

        );


    if(!container){

        return;

    }


    container.hidden = false;

    container.className =

        `surge-plan-configuration-message ${type}`;

    container.textContent =

        message;

}


/**
 * Format stored timestamp.
 */
function formatDateTime(

    value:string

):string {

    const date =

        new Date(

            value

        );


    if(

        Number.isNaN(

            date.getTime()

        )

    ){

        return value;

    }


    return date.toLocaleString();

}


/**
 * Escape HTML text.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/**
 * Escape attribute values.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}