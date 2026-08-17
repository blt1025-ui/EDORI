/**
 * TriggerConfigurationPanel
 *
 * Administrative editor for hospital-specific
 * operational trigger behavior.
 *
 * Phase A permits customization of:
 *
 * - Enabled / disabled status
 * - Associated Hospital Surge Plan response actions
 *
 * Trigger thresholds and escalation logic remain
 * protected and read-only.
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import {

    subscribe

}

from "../services/EventService";


import {

    exportTriggerConfiguration,

    getDefaultTriggerConfiguration,

    getOperationalTriggers,

    getTriggerConfigurationSavedAt,

    hasTriggerConfigurationOverrides,

    importTriggerConfiguration,

    restoreDefaultTriggerConfiguration,

    saveTriggerConfiguration

}

from "../services/TriggerConfigurationService";


import {

    getSurgePlan

}

from "../services/SurgePlanService";


import type {

    OperationalTrigger,

    OperationalTriggerCondition,

    OperationalTriggerOperator

}

from "../types/OperationalTrigger";


import type {

    TriggerConfiguration

}

from "../services/TriggerConfigurationService";


let editing = false;

let subscribed = false;

const collapsedCategories = new Set<string>();

const expandedTriggers = new Set<string>();


export function TriggerConfigurationPanel():string {

    return `

        <section
            id="triggerConfigurationPanel"
            class="trigger-configuration-panel"
        >

            <div
                id="triggerConfigurationContent"
                class="trigger-configuration-content"
                aria-live="polite"
            >
                ${createMarkup()}
            </div>

        </section>

    `;

}


export function initializeTriggerConfigurationPanel():void {

    bindControls();


    if(subscribed){

        return;

    }


    subscribed = true;


    subscribe(

        APP_EVENTS.TRIGGER_CONFIGURATION_CHANGED,

        () => {

            editing = false;

            expandedTriggers.clear();

            refresh();

        }

    );


    subscribe(

        APP_EVENTS.SURGE_PLAN_CHANGED,

        () => {

            refresh();

        }

    );

}


function refresh():void {

    const container =

        document.getElementById(

            "triggerConfigurationContent"

        );


    if(!container){

        return;

    }


    container.innerHTML = createMarkup();

    bindControls();

}


function createMarkup():string {

    const triggers = getOperationalTriggers();

    const savedAt = getTriggerConfigurationSavedAt();

    const hasOverrides = hasTriggerConfigurationOverrides();

    const enabledCount =

        triggers.filter(

            trigger => trigger.enabled

        ).length;


    return `

        <div class="trigger-configuration-header">

            <div>

                <span class="trigger-configuration-eyebrow">
                    Operational Response Logic
                </span>

                <div class="trigger-configuration-title-row">

                    <h3>
                        Trigger Configuration
                    </h3>

                    <span
                        class="
                            trigger-configuration-source
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
                                : "Built-In Mapping"
                        }
                    </span>

                </div>

                <p>
                    Control which operational triggers are active and which Hospital Surge Plan actions each trigger recommends.
                </p>

            </div>


            <div class="trigger-configuration-header-actions">

                ${!editing

                    ? `

                        <button
                            id="exportTriggerConfigurationReadOnlyButton"
                            class="system-configuration-secondary-button"
                            type="button"
                        >
                            Export
                        </button>

                        <button
                            id="manageTriggerConfigurationButton"
                            class="system-configuration-primary-button"
                            type="button"
                        >
                            Manage Triggers
                        </button>

                    `

                    : `

                        <span class="trigger-configuration-editing-badge">
                            Editing
                        </span>

                    `

                }

            </div>

        </div>


        <div class="trigger-configuration-status-strip">

            <div>
                <span>
                    Configured Triggers
                </span>
                <strong>
                    ${triggers.length}
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
                    ${triggers.length - enabledCount}
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
                                formatDateTime(savedAt)
                            )
                            : "Built-In"
                    }
                </strong>
            </div>

        </div>


        <div
            id="triggerConfigurationValidation"
            class="system-configuration-validation"
            hidden
        >
        </div>


        ${editing

            ? createEditor(triggers)

            : createReadOnlyView(triggers)

        }


        <div class="trigger-configuration-protection-note">

            <div
                class="trigger-configuration-protection-icon"
                aria-hidden="true"
            >
                🔒
            </div>

            <div>

                <strong>
                    Trigger definitions remain protected.
                </strong>

                <p>
                    This phase allows the hospital to enable or disable a trigger and select its response actions. Metrics, thresholds, operators, priority, minimum operational state, and multi-condition logic are not editable here.
                </p>

            </div>

        </div>

    `;

}


function createReadOnlyView(

    triggers:OperationalTrigger[]

):string {

    return `

        <div class="trigger-configuration-category-list">

            ${getCategories(triggers)

                .map(

                    category =>

                        createCategory(

                            category,

                            triggers,

                            false

                        )

                )

                .join("")}

        </div>

    `;

}


function createEditor(

    triggers:OperationalTrigger[]

):string {

    return `

        <div class="trigger-configuration-editor-toolbar">

            <div>

                <strong>
                    Manage Operational Triggers
                </strong>

                <p>
                    Enable or disable triggers and assign response actions from the Hospital Surge Plan.
                </p>

            </div>


            <div class="trigger-configuration-editor-toolbar-actions">

                <button
                    id="importTriggerConfigurationButton"
                    class="system-configuration-secondary-button"
                    type="button"
                >
                    Import
                </button>

                <input
                    id="importTriggerConfigurationFileInput"
                    type="file"
                    accept=".json,application/json"
                    hidden
                >

                <button
                    id="exportTriggerConfigurationButton"
                    class="system-configuration-secondary-button"
                    type="button"
                >
                    Export
                </button>

            </div>

        </div>


        <div class="trigger-configuration-category-list">

            ${getCategories(triggers)

                .map(

                    category =>

                        createCategory(

                            category,

                            triggers,

                            true

                        )

                )

                .join("")}

        </div>


        <div class="trigger-configuration-editor-actions">

            <button
                id="restoreTriggerConfigurationButton"
                class="system-configuration-danger-button"
                type="button"
            >
                Restore Built-In Trigger Mapping
            </button>


            <div>

                <button
                    id="cancelTriggerConfigurationButton"
                    class="system-configuration-secondary-button"
                    type="button"
                >
                    Cancel
                </button>

                <button
                    id="saveTriggerConfigurationButton"
                    class="system-configuration-primary-button"
                    type="button"
                >
                    Save Trigger Configuration
                </button>

            </div>

        </div>

    `;

}


function createCategory(

    category:string,

    triggers:OperationalTrigger[],

    editor:boolean

):string {

    const categoryTriggers =

        triggers.filter(

            trigger => trigger.category === category

        );


    const enabledCount =

        categoryTriggers.filter(

            trigger => trigger.enabled

        ).length;


    const collapsed =

        collapsedCategories.has(category);


    return `

        <section class="trigger-configuration-category">

            <button
                class="trigger-configuration-category-heading"
                type="button"
                data-trigger-category-toggle="${escapeAttribute(category)}"
                aria-expanded="${collapsed ? "false" : "true"}"
            >

                <div>

                    <span
                        class="trigger-configuration-category-chevron"
                        aria-hidden="true"
                    >
                        ${collapsed ? "›" : "⌄"}
                    </span>

                    <span>

                        <strong>
                            ${escapeHtml(category)}
                        </strong>

                        <small>
                            ${enabledCount} enabled of ${categoryTriggers.length}
                        </small>

                    </span>

                </div>

                <span class="trigger-configuration-category-count">
                    ${categoryTriggers.length}
                </span>

            </button>


            <div
                class="trigger-configuration-trigger-list"
                ${collapsed ? "hidden" : ""}
            >

                ${categoryTriggers

                    .map(

                        trigger =>

                            createTriggerCard(

                                trigger,

                                editor

                            )

                    )

                    .join("")}

            </div>

        </section>

    `;

}


function createTriggerCard(

    trigger:OperationalTrigger,

    editor:boolean

):string {

    const expanded =

        expandedTriggers.has(trigger.id);


    const customized =

        isTriggerCustomized(

            trigger

        );


    const interventionTitles =

        getInterventionTitles(

            trigger.interventionIds

        );


    return `

        <article
            class="
                trigger-configuration-card
                ${trigger.enabled ? "enabled" : "disabled"}
            "
            data-trigger-id="${escapeAttribute(trigger.id)}"
        >

            <div class="trigger-configuration-card-summary">

                <div class="trigger-configuration-card-main">

                    <div class="trigger-configuration-card-title-row">

                        <h4>
                            ${escapeHtml(trigger.title)}
                        </h4>

                        <span
                            class="
                                trigger-configuration-priority
                                priority-${trigger.priority.toLowerCase()}
                            "
                        >
                            ${escapeHtml(trigger.priority)}
                        </span>

                        <span
                            class="
                                trigger-configuration-origin
                                ${customized ? "customized" : "default"}
                            "
                        >
                            ${customized ? "Hospital Customized" : "Built-In"}
                        </span>

                    </div>

                    <p>
                        ${escapeHtml(trigger.description)}
                    </p>


                    <div class="trigger-configuration-condition-preview">

                        <span>
                            Condition
                        </span>

                        <strong>
                            ${escapeHtml(
                                createPlainLanguageConditionSummary(
                                    trigger
                                )
                            )}
                        </strong>

                    </div>

                    <div class="trigger-configuration-card-meta">

                        <span>
                            ${trigger.conditions.length} condition${
                                trigger.conditions.length === 1
                                    ? ""
                                    : "s"
                            }
                        </span>

                        <span aria-hidden="true">
                            •
                        </span>

                        <span>
                            ${trigger.interventionIds.length} response action${
                                trigger.interventionIds.length === 1
                                    ? ""
                                    : "s"
                            }
                        </span>

                        <span aria-hidden="true">
                            •
                        </span>

                        <span>
                            Minimum state:
                            ${
                                trigger.minimumOperationalState
                                    ? escapeHtml(
                                        trigger.minimumOperationalState
                                    )
                                    : "None"
                            }
                        </span>

                    </div>

                </div>


                <div class="trigger-configuration-card-controls">

                    ${editor

                        ? `

                            <label class="trigger-configuration-enabled-toggle">

                                <input
                                    type="checkbox"
                                    data-trigger-enabled="${escapeAttribute(trigger.id)}"
                                    ${trigger.enabled ? "checked" : ""}
                                >

                                <span>
                                    Enabled
                                </span>

                            </label>

                        `

                        : `

                            <span
                                class="
                                    trigger-configuration-enabled-status
                                    ${trigger.enabled ? "enabled" : "disabled"}
                                "
                            >
                                ${trigger.enabled ? "Enabled" : "Disabled"}
                            </span>

                        `

                    }


                    <button
                        class="trigger-configuration-detail-button"
                        type="button"
                        data-trigger-detail-toggle="${escapeAttribute(trigger.id)}"
                        aria-expanded="${expanded ? "true" : "false"}"
                    >
                        ${
                            expanded
                                ? "Hide details"
                                : editor
                                    ? "Configure"
                                    : "View details"
                        }
                    </button>

                </div>

            </div>


            <div
                class="trigger-configuration-card-details"
                ${expanded ? "" : "hidden"}
            >

                <div class="trigger-configuration-logic-panel">

                    <div class="trigger-configuration-detail-heading">

                        <div>

                            <span>
                                Activation Condition
                            </span>

                            <strong>
                                ${trigger.conditions.length > 1
                                    ? "All conditions below must be met"
                                    : "This condition activates the trigger"
                                }
                            </strong>

                        </div>

                        <span class="trigger-configuration-locked-badge">
                            Protected Logic
                        </span>

                    </div>


                    <div class="trigger-configuration-condition-list">

                        ${trigger.conditions

                            .map(

                                (
                                    condition,
                                    index
                                ) => `

                                    ${index > 0

                                        ? `

                                            <div class="trigger-configuration-and-divider">
                                                <span>
                                                    AND
                                                </span>
                                            </div>

                                        `

                                        : ""

                                    }

                                    ${createConditionRow(
                                        condition
                                    )}

                                `

                            )

                            .join("")}

                    </div>


                    <div class="trigger-configuration-logic-meta">

                        <div>
                            <span>
                                Priority
                            </span>
                            <strong>
                                ${escapeHtml(trigger.priority)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Minimum Operational State
                            </span>
                            <strong>
                                ${
                                    trigger.minimumOperationalState
                                        ? escapeHtml(
                                            trigger.minimumOperationalState
                                        )
                                        : "None"
                                }
                            </strong>
                        </div>

                    </div>

                </div>


                <div class="trigger-configuration-response-panel">

                    <div class="trigger-configuration-detail-heading">

                        <div>

                            <span>
                                Response Actions
                            </span>

                            <strong>
                                ${
                                    editor
                                        ? "Select actions for this trigger"
                                        : "Current hospital response"
                                }
                            </strong>

                        </div>

                    </div>


                    ${editor

                        ? createResponseActionEditor(

                            trigger

                        )

                        : createResponseActionSummary(

                            interventionTitles

                        )

                    }

                </div>


                <div class="trigger-configuration-rationale">

                    <span>
                        Trigger Rationale
                    </span>

                    <p>
                        ${escapeHtml(trigger.rationale)}
                    </p>

                </div>

            </div>

        </article>

    `;

}


function createConditionRow(

    condition:OperationalTriggerCondition

):string {

    return `

        <div class="trigger-configuration-condition-row">

            <div class="trigger-configuration-condition-language">

                <span>
                    Operational Rule
                </span>

                <strong>
                    ${escapeHtml(
                        createPlainLanguageCondition(
                            condition
                        )
                    )}
                </strong>

            </div>


            <div class="trigger-configuration-condition-technical">

                <span>
                    Technical Definition
                </span>

                <code>
                    ${escapeHtml(
                        formatMetric(
                            condition.metric
                        )
                    )}
                    ${escapeHtml(
                        formatOperator(
                            condition.operator
                        )
                    )}
                    ${escapeHtml(
                        formatConditionThreshold(
                            condition
                        )
                    )}
                </code>

            </div>


            ${condition.thresholdSource

                ? `

                    <div class="trigger-configuration-condition-source">

                        <span>
                            Runtime Threshold
                        </span>

                        <strong>
                            Uses the current configured ED treatment capacity rather than a fixed numeric value.
                        </strong>

                    </div>

                `

                : ""

            }

        </div>

    `;

}


/**
 * Create one plain-language trigger summary for the
 * compact card.
 */
function createPlainLanguageConditionSummary(

    trigger:OperationalTrigger

):string {

    return trigger.conditions

        .map(

            condition =>

                createPlainLanguageCondition(

                    condition

                )

        )

        .join(

            " AND "

        );

}


/**
 * Translate one technical condition into operational
 * language without changing the underlying rule.
 */
function createPlainLanguageCondition(

    condition:OperationalTriggerCondition

):string {

    const value =

        formatConditionThreshold(

            condition

        );


    switch(condition.metric){

        case "totalEDVolume":

            if(condition.thresholdSource === "configuredEdCapacity"){

                return `Total ED census is greater than the configured ED treatment capacity`;

            }

            return `Total ED census is ${formatOperatorWords(condition.operator)} ${value}`;


        case "edOccupancyPercent":

            return `ED census is ${formatOperatorWords(condition.operator)} ${value}% of configured treatment capacity`;


        case "volumeAboveExpected":

            return `ED census is ${formatOperatorWords(condition.operator)} ${value} patients above the historical expectation`;


        case "boardedPatients":

            return `ED boarding census is ${formatOperatorWords(condition.operator)} ${value} admitted patients`;


        case "boardingAboveExpected":

            return `ED boarding is ${formatOperatorWords(condition.operator)} ${value} patients above the historical expectation`;


        case "boardingPercentOfVolume":

            return `Boarding patients represent ${formatOperatorWords(condition.operator)} ${value}% of total ED census`;


        case "highAcuityCount":

            return `ESI 1–2 census is ${formatOperatorWords(condition.operator)} ${value} patients`;


        case "highAcuityPercent":

            return `ESI 1–2 patients represent ${formatOperatorWords(condition.operator)} ${value}% of total ED census`;


        case "edPressureScore":

            return `ED Operational Pressure score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "occupiedAcuteCareBeds":

            return `Occupied acute-care beds are ${formatOperatorWords(condition.operator)} ${value}`;


        case "availableAcuteCareBeds":

            return `Available staffed acute-care beds are ${formatOperatorWords(condition.operator)} ${value}`;


        case "acuteCareOccupancyPercent":

            return `Staffed acute-care occupancy is ${formatOperatorWords(condition.operator)} ${value}%`;


        case "acuteCapacityScore":

            return `Acute-Care Capacity pressure score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "occupiedCriticalCareBeds":

            return `Occupied critical-care beds are ${formatOperatorWords(condition.operator)} ${value}`;


        case "availableCriticalCareBeds":

            return `Available staffed critical-care beds are ${formatOperatorWords(condition.operator)} ${value}`;


        case "criticalCareOccupancyPercent":

            return `Staffed critical-care occupancy is ${formatOperatorWords(condition.operator)} ${value}%`;


        case "criticalCapacityScore":

            return `Critical-Care Capacity pressure score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "currentHospitalInflow":

            return `Known hospital inflow is ${formatOperatorWords(condition.operator)} ${value} patients`;


        case "expectedHospitalInflow":

            return `Expected hospital inflow is ${formatOperatorWords(condition.operator)} ${value} patients`;


        case "hospitalInflowAboveExpected":

            return `Known hospital inflow is ${formatOperatorWords(condition.operator)} ${value} patients above the historical expectation`;


        case "hospitalInflowPercentOfExpected":

            return `Known hospital inflow is ${formatOperatorWords(condition.operator)} ${value}% of the historical expectation`;


        case "inflowScore":

            return `Hospital Inflow pressure score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "expectedInpatientDepartures":

            return `Expected inpatient departures are ${formatOperatorWords(condition.operator)} ${value} patients`;


        case "projectedHospitalInflow":

            return `Projected four-hour hospital inflow is ${formatOperatorWords(condition.operator)} ${value} patients`;


        case "projectedAvailableAcuteCareBeds":

            return `Projected available staffed acute-care beds are ${formatOperatorWords(condition.operator)} ${value}`;


        case "projectedAcuteCareCapacityChange":

            return `Projected acute-care capacity change is ${formatOperatorWords(condition.operator)} ${value} beds`;


        case "projectedCapacityScore":

            return `Projected Capacity pressure score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "hospitalReadinessScore":

            return `Hospital Readiness score is ${formatOperatorWords(condition.operator)} ${value}`;


        case "consecutiveScoreIncreases":

            return `Hospital Readiness pressure has increased across ${formatOperatorWords(condition.operator)} ${value} consecutive assessment transitions`;


        case "scoreChange":

            return `Hospital Readiness score increased by ${formatOperatorWords(condition.operator)} ${value} points from the previous stored assessment`;

    }

}


/**
 * Format a condition threshold for display.
 */
function formatConditionThreshold(

    condition:OperationalTriggerCondition

):string {

    if(condition.thresholdSource === "configuredEdCapacity"){

        return "configured ED capacity";

    }


    return formatNumber(

        condition.threshold

    );

}


/**
 * Translate comparison operators into natural
 * language.
 */
function formatOperatorWords(

    operator:OperationalTriggerOperator

):string {

    switch(operator){

        case "greaterThan":
            return "greater than";

        case "greaterThanOrEqual":
            return "at least";

        case "lessThan":
            return "less than";

        case "lessThanOrEqual":
            return "no more than";

        case "equal":
            return "exactly";

    }

}


/**
 * Determine whether the hospital changed the
 * configurable portion of one trigger.
 */
function isTriggerCustomized(

    trigger:OperationalTrigger

):boolean {

    const defaultTrigger =

        getDefaultTriggerConfiguration()

            .find(

                item =>

                    item.id === trigger.id

            );


    if(!defaultTrigger){

        return true;

    }


    if(

        defaultTrigger.enabled

        !==

        trigger.enabled

    ){

        return true;

    }


    if(

        defaultTrigger.interventionIds.length

        !==

        trigger.interventionIds.length

    ){

        return true;

    }


    return defaultTrigger.interventionIds.some(

        (
            interventionId,
            index
        ) =>

            interventionId

            !==

            trigger.interventionIds[index]

    );

}


function createResponseActionSummary(

    titles:string[]

):string {

    if(titles.length === 0){

        return `

            <div class="trigger-configuration-empty-actions">
                No response actions are currently assigned.
            </div>

        `;

    }


    return `

        <div class="trigger-configuration-action-chip-list">

            ${titles

                .map(

                    title => `

                        <span class="trigger-configuration-action-chip">
                            ${escapeHtml(title)}
                        </span>

                    `

                )

                .join("")}

        </div>

    `;

}


function createResponseActionEditor(

    trigger:OperationalTrigger

):string {

    const interventions =

        getSurgePlan().interventions;


    return `

        <div class="trigger-configuration-action-selector">

            ${interventions

                .map(

                    intervention => {

                        const checked =

                            trigger.interventionIds.includes(
                                intervention.id
                            );


                        return `

                            <label
                                class="
                                    trigger-configuration-action-option
                                    ${intervention.enabled ? "" : "surge-disabled"}
                                "
                            >

                                <input
                                    type="checkbox"
                                    data-trigger-action-trigger="${escapeAttribute(trigger.id)}"
                                    data-trigger-action-id="${escapeAttribute(intervention.id)}"
                                    ${checked ? "checked" : ""}
                                >

                                <span>

                                    <strong>
                                        ${escapeHtml(intervention.title)}
                                    </strong>

                                    <small>
                                        ${escapeHtml(intervention.responsibleGroup)}
                                        •
                                        ${escapeHtml(intervention.defaultPriority)}
                                        ${
                                            intervention.enabled
                                                ? ""
                                                : " • Surge Plan action disabled"
                                        }
                                    </small>

                                </span>

                            </label>

                        `;

                    }

                )

                .join("")}

        </div>

    `;

}


function getCategories(

    triggers:OperationalTrigger[]

):string[] {

    return Array.from(

        new Set(

            triggers.map(

                trigger => trigger.category

            )

        )

    );

}


function getInterventionTitles(

    ids:string[]

):string[] {

    const plan = getSurgePlan();


    return ids.map(

        id => {

            const intervention =

                plan.interventions.find(

                    item => item.id === id

                );


            return intervention

                ? intervention.title

                : id;

        }

    );

}


function bindControls():void {

    bindButton(

        "manageTriggerConfigurationButton",

        () => {

            editing = true;

            expandedTriggers.clear();

            refresh();

        }

    );


    bindButton(

        "cancelTriggerConfigurationButton",

        () => {

            editing = false;

            expandedTriggers.clear();

            refresh();

        }

    );


    bindButton(

        "saveTriggerConfigurationButton",

        saveEditor

    );


    bindButton(

        "restoreTriggerConfigurationButton",

        restoreDefaults

    );


    bindButton(

        "exportTriggerConfigurationButton",

        downloadConfiguration

    );


    bindButton(

        "exportTriggerConfigurationReadOnlyButton",

        downloadConfiguration

    );


    bindButton(

        "importTriggerConfigurationButton",

        () => {

            const input =

                document.getElementById(

                    "importTriggerConfigurationFileInput"

                );


            if(input instanceof HTMLInputElement){

                input.click();

            }

        }

    );


    document

        .querySelectorAll<HTMLButtonElement>(

            "[data-trigger-category-toggle]"

        )

        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const category =

                            button.dataset.triggerCategoryToggle;


                        if(!category){

                            return;

                        }


                        toggleSet(

                            collapsedCategories,

                            category

                        );


                        refresh();

                    }

                );

            }

        );


    document

        .querySelectorAll<HTMLButtonElement>(

            "[data-trigger-detail-toggle]"

        )

        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        const triggerId =

                            button.dataset.triggerDetailToggle;


                        if(!triggerId){

                            return;

                        }


                        toggleSet(

                            expandedTriggers,

                            triggerId

                        );


                        refresh();

                    }

                );

            }

        );


    const fileInput =

        document.getElementById(

            "importTriggerConfigurationFileInput"

        );


    if(fileInput instanceof HTMLInputElement){

        fileInput.addEventListener(

            "change",

            importConfigurationFile

        );

    }

}


function saveEditor():void {

    const triggers = getOperationalTriggers();


    const configuration:TriggerConfiguration = {

        schemaVersion:
            1,

        overrides:
            triggers.map(

                trigger => {

                    const enabledInput =

                        document.querySelector<HTMLInputElement>(

                            `[data-trigger-enabled="${cssEscape(trigger.id)}"]`

                        );


                    const actionInputs =

                        Array.from(

                            document.querySelectorAll<HTMLInputElement>(

                                `[data-trigger-action-trigger="${cssEscape(trigger.id)}"]`

                            )

                        );


                    return {

                        triggerId:
                            trigger.id,

                        enabled:
                            enabledInput
                                ? enabledInput.checked
                                : trigger.enabled,

                        interventionIds:
                            actionInputs

                                .filter(

                                    input => input.checked

                                )

                                .map(

                                    input =>

                                        input.dataset.triggerActionId

                                )

                                .filter(

                                    (
                                        value
                                    ):value is string =>

                                        typeof value === "string"

                                        &&

                                        value.length > 0

                                )

                    };

                }

            )

    };


    const result =

        saveTriggerConfiguration(

            configuration

        );


    if(!result.valid){

        showValidationErrors(

            result.errors

        );


        return;

    }


    editing = false;

    expandedTriggers.clear();

}


function restoreDefaults():void {

    const confirmed =

        window.confirm(

            "Restore the built-in operational trigger mapping? Saved trigger enable/disable settings and response-action associations will be removed."

        );


    if(!confirmed){

        return;

    }


    editing = false;

    expandedTriggers.clear();

    restoreDefaultTriggerConfiguration();

}


function downloadConfiguration():void {

    try {

        const blob =

            new Blob(

                [
                    exportTriggerConfiguration()
                ],

                {
                    type:
                        "application/json"
                }

            );


        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;

        anchor.download =

            "EDORI_Trigger_Configuration.json";


        document.body.appendChild(anchor);

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(url);

    }

    catch(error){

        console.error(

            "Unable to export trigger configuration:",

            error

        );

    }

}


async function importConfigurationFile(

    event:Event

):Promise<void> {

    const input = event.currentTarget;


    if(!(input instanceof HTMLInputElement)){

        return;

    }


    const file = input.files?.[0];

    input.value = "";


    if(!file){

        return;

    }


    try {

        const result =

            importTriggerConfiguration(

                await file.text()

            );


        if(!result.valid){

            showValidationErrors(

                result.errors

            );


            return;

        }


        editing = false;

        expandedTriggers.clear();

    }

    catch(error){

        console.error(

            "Unable to import trigger configuration:",

            error

        );


        showValidationErrors([

            "The selected trigger-configuration file could not be read."

        ]);

    }

}


function showValidationErrors(

    errors:string[]

):void {

    const container =

        document.getElementById(

            "triggerConfigurationValidation"

        );


    if(!container){

        return;

    }


    container.hidden = false;


    container.innerHTML = `

        <strong>
            Trigger configuration could not be saved
        </strong>

        <ul>

            ${errors

                .map(

                    error => `

                        <li>
                            ${escapeHtml(error)}
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


function bindButton(

    id:string,

    callback:() => void

):void {

    const button = document.getElementById(id);


    if(button instanceof HTMLButtonElement){

        button.addEventListener(

            "click",

            callback

        );

    }

}


function toggleSet(

    target:Set<string>,

    value:string

):void {

    if(target.has(value)){

        target.delete(value);

    }

    else{

        target.add(value);

    }

}


function formatOperator(

    operator:OperationalTriggerOperator

):string {

    switch(operator){

        case "greaterThan":
            return ">";

        case "greaterThanOrEqual":
            return "≥";

        case "lessThan":
            return "<";

        case "lessThanOrEqual":
            return "≤";

        case "equal":
            return "=";

    }

}


function formatMetric(

    value:string

):string {

    if(value === "configuredEdCapacity"){

        return "Configured ED Treatment Capacity";

    }


    return value

        .replace(
            /([a-z0-9])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /([A-Z])([A-Z][a-z])/g,
            "$1 $2"
        )

        .replace(
            /^./,
            character => character.toUpperCase()
        );

}


function formatNumber(

    value:number

):string {

    if(Number.isInteger(value)){

        return value.toLocaleString("en-US");

    }


    return value

        .toFixed(1)

        .replace(
            /\.0$/,
            ""
        );

}


function formatDateTime(

    value:string

):string {

    const date = new Date(value);


    if(Number.isNaN(date.getTime())){

        return value;

    }


    return date.toLocaleString();

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

        /["\\]/g,

        "\\$&"

    );

}


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


function escapeAttribute(

    value:string

):string {

    return escapeHtml(value);

}