/**
 * SystemConfiguration
 *
 * Administrative editor for Hospital Readiness
 * configuration overrides.
 *
 * Editable in this phase:
 *
 * - Hospital/model settings
 * - HRI domain weights
 * - ED Operational Pressure component weights
 * - Alpha through Echo score ranges
 *
 * Operational triggers and hospital surge-plan
 * response actions are managed independently from
 * HRI model settings.
 *
 * IMPORTANT:
 *
 * Saved overrides are persisted, validated, and applied
 * to supported Hospital Readiness calculations.
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

    getConfiguration,

    getConfigurationSavedAt,

    hasConfigurationOverrides,

    restoreDefaultConfiguration,

    saveConfiguration,

    validateConfiguration

}

from "../services/ConfigurationService";


import {

    getOperationalTriggers,

    hasTriggerConfigurationOverrides

}

from "../services/TriggerConfigurationService";


import {

    getSurgePlan,

    hasSurgePlanOverrides

}

from "../services/SurgePlanService";


import type {

    ConfigurationOverrides,

    OperationalLevelConfiguration

}

from "../types/ConfigurationOverrides";


import {

    initializeSurgePlanConfigurationPanel,

    SurgePlanConfigurationPanel

}

from "./SurgePlanConfigurationPanel";


import {

    initializeTriggerConfigurationPanel,

    TriggerConfigurationPanel

}

from "./TriggerConfigurationPanel";


/**
 * Local editor state.
 */
let editing = false;

let draftConfiguration:ConfigurationOverrides | null = null;


/**
 * Prevent duplicate parent-level subscriptions.
 */
let subscribed = false;


/**
 * Render System Configuration.
 */
export function SystemConfiguration():string {

    return `

        <section class="system-configuration-container">

            <div
                id="systemConfigurationContent"
                class="system-configuration-content"
                aria-live="polite"
            >

                ${createConfigurationMarkup()}

            </div>

        </section>

    `;

}


/**
 * Initialize System Configuration behavior.
 */
export function initializeSystemConfiguration():void {

    bindConfigurationControls();

    initializeTriggerConfigurationPanel();

    initializeSurgePlanConfigurationPanel();


    if(subscribed){

        return;

    }


    subscribed = true;


    subscribe(

        APP_EVENTS.CONFIGURATION_CHANGED,

        () => {

            editing = false;

            draftConfiguration = null;

            refreshConfiguration();

        }

    );


    subscribe(

        APP_EVENTS.TRIGGER_CONFIGURATION_CHANGED,

        () => {

            refreshConfiguration();

        }

    );


    subscribe(

        APP_EVENTS.SURGE_PLAN_CHANGED,

        () => {

            refreshConfiguration();

        }

    );

}


/**
 * Re-render the component.
 */

function refreshConfiguration():void {

    const container =

        document.getElementById(

            "systemConfigurationContent"

        );


    if(!container){

        return;

    }


    container.innerHTML =

        createConfigurationMarkup();


    bindConfigurationControls();

    initializeTriggerConfigurationPanel();

    initializeSurgePlanConfigurationPanel();

}


/**
 * Build the complete configuration display.
 */
function createConfigurationMarkup():string {

    const configuration =

        editing

            ? (

                draftConfiguration

                ??

                getConfiguration()

            )

            : getConfiguration();


    const savedAt =

        getConfigurationSavedAt();


    const hasOverrides =

        hasConfigurationOverrides();


    const triggers =

        getOperationalTriggers();


    const surgePlan =

        getSurgePlan();


    return `

        ${createConfigurationHeader(

            hasOverrides,

            savedAt

        )}


        ${createConfigurationArchitectureSummary({

            modelCustomized:
                hasOverrides,

            triggerCustomized:
                hasTriggerConfigurationOverrides(),

            surgePlanCustomized:
                hasSurgePlanOverrides(),

            enabledTriggers:
                triggers.filter(
                    trigger => trigger.enabled
                ).length,

            totalTriggers:
                triggers.length,

            enabledActions:
                surgePlan.interventions.filter(
                    intervention => intervention.enabled
                ).length,

            totalActions:
                surgePlan.interventions.length

        })}


        <section
            class="
                system-configuration-module
                system-configuration-module-model
            "
        >

            ${createConfigurationModuleHeading({

                number:
                    "01",

                eyebrow:
                    "Calculation Model",

                title:
                    "Hospital Readiness Model",

                description:
                    "Hospital capacity, HRI weighting, ED pressure weighting, and Alpha through Echo score ranges.",

                status:
                    hasOverrides
                        ? "Customized"
                        : "Built-In Defaults",

                statusClass:
                    hasOverrides
                        ? "customized"
                        : "default"

            })}


            <div class="system-configuration-module-body">

                <div class="system-configuration-model-toolbar">

                    <div>

                        <strong>
                            Calculation Model Settings
                        </strong>

                        <p>
                            Customize hospital capacity, HRI domain weights, ED pressure weights, and Alpha through Echo score ranges.
                        </p>

                    </div>


                    <div class="system-configuration-model-toolbar-actions">

                        ${!editing

                            ? `

                                <button
                                    id="editSystemConfigurationButton"
                                    class="system-configuration-primary-button"
                                    type="button"
                                >
                                    Customize Calculation Model
                                </button>

                            `

                            : `

                                <span class="system-configuration-model-editing-badge">
                                    Editing Calculation Model
                                </span>

                            `

                        }

                    </div>

                </div>


                ${editing

                    ? createEditor(

                        configuration

                    )

                    : createReadOnlyConfiguration(

                        configuration

                    )

                }


                ${createEngineIntegrationNotice()}

            </div>

        </section>


        <section
            class="
                system-configuration-module
                system-configuration-module-triggers
            "
        >

            ${createConfigurationModuleHeading({

                number:
                    "02",

                eyebrow:
                    "Operational Detection",

                title:
                    "Operational Trigger Configuration",

                description:
                    "Controls which operational conditions are enabled and which response actions are attached to each trigger.",

                status:
                    hasTriggerConfigurationOverrides()
                        ? "Hospital Customization"
                        : "Built-In Mapping",

                statusClass:
                    hasTriggerConfigurationOverrides()
                        ? "customized"
                        : "default"

            })}


            <div class="system-configuration-module-body">

                ${TriggerConfigurationPanel()}

            </div>

        </section>


        <section
            class="
                system-configuration-module
                system-configuration-module-surge
            "
        >

            ${createConfigurationModuleHeading({

                number:
                    "03",

                eyebrow:
                    "Operational Response",

                title:
                    "Hospital Surge Plan",

                description:
                    "Defines the hospital-specific actions EDORI recommends when configured operational triggers become active.",

                status:
                    hasSurgePlanOverrides()
                        ? "Hospital Customization"
                        : "Built-In Plan",

                statusClass:
                    hasSurgePlanOverrides()
                        ? "customized"
                        : "default"

            })}


            <div class="system-configuration-module-body">

                ${SurgePlanConfigurationPanel()}

            </div>

        </section>

    `;

}


/**
 * Create a compact overview of the three independent
 * configuration layers.
 */
function createConfigurationArchitectureSummary(

    options:{

        modelCustomized:boolean;

        triggerCustomized:boolean;

        surgePlanCustomized:boolean;

        enabledTriggers:number;

        totalTriggers:number;

        enabledActions:number;

        totalActions:number;

    }

):string {

    return `

        <section class="system-configuration-architecture">

            <div class="system-configuration-architecture-heading">

                <div>

                    <span>
                        Configuration Architecture
                    </span>


                    <strong>
                        Three independent administrative layers
                    </strong>

                </div>


                <p>
                    Calculation settings determine the HRI. Triggers detect operational conditions. The surge plan defines the hospital response.
                </p>

            </div>


            <div class="system-configuration-architecture-grid">

                ${createArchitectureCard({

                    number:
                        "01",

                    title:
                        "HRI Model",

                    description:
                        "How Hospital Readiness is calculated and classified.",

                    detail:
                        options.modelCustomized
                            ? "Saved model overrides active"
                            : "Built-in model settings",

                    customized:
                        options.modelCustomized

                })}


                ${createArchitectureCard({

                    number:
                        "02",

                    title:
                        "Operational Triggers",

                    description:
                        "When specific operational conditions are recognized.",

                    detail:
                        `${options.enabledTriggers} of ${options.totalTriggers} enabled`,

                    customized:
                        options.triggerCustomized

                })}


                ${createArchitectureCard({

                    number:
                        "03",

                    title:
                        "Hospital Surge Plan",

                    description:
                        "What the hospital does in response to those conditions.",

                    detail:
                        `${options.enabledActions} of ${options.totalActions} actions enabled`,

                    customized:
                        options.surgePlanCustomized

                })}

            </div>

        </section>

    `;

}


/**
 * Create one architecture-summary card.
 */
function createArchitectureCard(

    options:{

        number:string;

        title:string;

        description:string;

        detail:string;

        customized:boolean;

    }

):string {

    return `

        <article class="system-configuration-architecture-card">

            <div class="system-configuration-architecture-card-top">

                <span class="system-configuration-architecture-number">
                    ${escapeHtml(
                        options.number
                    )}
                </span>


                <span
                    class="
                        system-configuration-architecture-status
                        ${
                            options.customized
                                ? "customized"
                                : "default"
                        }
                    "
                >
                    ${
                        options.customized
                            ? "Customized"
                            : "Default"
                    }
                </span>

            </div>


            <strong>
                ${escapeHtml(
                    options.title
                )}
            </strong>


            <p>
                ${escapeHtml(
                    options.description
                )}
            </p>


            <small>
                ${escapeHtml(
                    options.detail
                )}
            </small>

        </article>

    `;

}


/**
 * Create one major configuration-module heading.
 */
function createConfigurationModuleHeading(

    options:{

        number:string;

        eyebrow:string;

        title:string;

        description:string;

        status:string;

        statusClass:
            "default"
            |
            "customized";

    }

):string {

    return `

        <div class="system-configuration-module-heading">

            <div class="system-configuration-module-number">
                ${escapeHtml(
                    options.number
                )}
            </div>


            <div class="system-configuration-module-copy">

                <span>
                    ${escapeHtml(
                        options.eyebrow
                    )}
                </span>


                <h3>
                    ${escapeHtml(
                        options.title
                    )}
                </h3>


                <p>
                    ${escapeHtml(
                        options.description
                    )}
                </p>

            </div>


            <span
                class="
                    system-configuration-module-status
                    ${options.statusClass}
                "
            >
                ${escapeHtml(
                    options.status
                )}
            </span>

        </div>

    `;

}


/**
 * Create the top configuration header.
 */

function createConfigurationHeader(

    hasOverrides:boolean,

    savedAt:string | null

):string {

    return `

        <div class="system-configuration-header">

            <div>

                <span class="system-configuration-eyebrow">
                    Administrative Configuration
                </span>


                <h3>
                    System Configuration
                </h3>


                <p>
                    Manage the Hospital Readiness model, operational trigger mapping, and hospital-specific surge response plan.
                </p>

            </div>


            <div class="system-configuration-header-actions">

                <span
                    class="
                        system-configuration-source
                        ${
                            hasOverrides
                                ? "override"
                                : "default"
                        }
                    "
                >

                    ${
                        hasOverrides
                            ? "Saved Overrides"
                            : "Built-In Defaults"
                    }

                </span>



            </div>

        </div>


        ${savedAt

            ? `

                <div class="system-configuration-saved-note">

                    Saved configuration:

                    <strong>
                        ${escapeHtml(
                            formatDateTime(
                                savedAt
                            )
                        )}
                    </strong>

                </div>

            `

            : ""

        }

    `;

}


/**
 * Create the editable configuration form.
 */
function createEditor(

    configuration:ConfigurationOverrides

):string {

    return `

        <div class="system-configuration-editor">

            <div
                id="systemConfigurationValidation"
                class="system-configuration-validation"
                hidden
            >
            </div>


            ${createEditableHospitalSection(
                configuration
            )}


            ${createEditableDomainWeights(
                configuration
            )}


            ${createEditableEdPressureWeights(
                configuration
            )}


            ${createEditableOperationalLevels(
                configuration
            )}


            <div class="system-configuration-editor-actions">

                <button
                    id="cancelSystemConfigurationButton"
                    class="system-configuration-secondary-button"
                    type="button"
                >
                    Cancel
                </button>


                <button
                    id="restoreSystemConfigurationButton"
                    class="system-configuration-danger-button"
                    type="button"
                >
                    Restore Built-In Defaults
                </button>


                <button
                    id="saveSystemConfigurationButton"
                    class="system-configuration-primary-button"
                    type="button"
                >
                    Save Changes
                </button>

            </div>

        </div>

    `;

}


/**
 * Editable hospital/model settings.
 */
function createEditableHospitalSection(

    configuration:ConfigurationOverrides

):string {

    const hospital =

        configuration.hospital;


    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "Hospital Configuration",

                "Physical Emergency Department treatment capacity"

            )}


            <div class="system-configuration-edit-grid">

                ${createNumberInput({

                    id:
                        "configEdCapacity",

                    label:
                        "ED Treatment Capacity",

                    value:
                        hospital.edCapacity,

                    minimum:
                        1,

                    step:
                        1

                })}
            </div>

        </section>

    `;

}


/**
 * Editable top-level HRI weights.
 */
function createEditableDomainWeights(

    configuration:ConfigurationOverrides

):string {

    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "HRI Domain Weights",

                "The three authoritative HRI domain weights must total exactly 100%. Acute-care capacity and hospital inflow remain operational context, not weighted HRI domains."

            )}


            <div class="system-configuration-edit-grid">

                ${createPercentageInput(
                    "configWeightEdPressure",
                    "ED Operational Pressure",
                    configuration.domainWeights.edPressure
                )}

                ${createPercentageInput(
                    "configWeightCritical",
                    "Critical-Care Capacity",
                    configuration.domainWeights.criticalCapacity
                )}

                ${createPercentageInput(
                    "configWeightProjected",
                    "Projected Hospital Capacity",
                    configuration.domainWeights.projectedCapacity
                )}

            </div>


            <div
                id="domainWeightTotal"
                class="system-configuration-total"
            >
                Total:
                ${formatPercentageTotal(
                    configuration.domainWeights.edPressure
                    +
                    configuration.domainWeights.projectedCapacity
                    +
                    configuration.domainWeights.criticalCapacity
                )}
            </div>

        </section>

    `;

}


/**
 * Editable ED Operational Pressure component weights.
 */
function createEditableEdPressureWeights(

    configuration:ConfigurationOverrides

):string {

    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "ED Operational Pressure Components",

                "Volume, boarding, and acuity weights must total exactly 100%."

            )}


            <div class="system-configuration-edit-grid">

                ${createPercentageInput(
                    "configEdWeightVolume",
                    "ED Volume",
                    configuration.edPressureWeights.volume
                )}

                ${createPercentageInput(
                    "configEdWeightBoarding",
                    "Boarding",
                    configuration.edPressureWeights.boarding
                )}

                ${createPercentageInput(
                    "configEdWeightAcuity",
                    "High Acuity",
                    configuration.edPressureWeights.acuity
                )}

            </div>


            <div
                id="edPressureWeightTotal"
                class="system-configuration-total"
            >
                Total:
                ${formatPercentageTotal(
                    configuration.edPressureWeights.volume
                    +
                    configuration.edPressureWeights.boarding
                    +
                    configuration.edPressureWeights.acuity
                )}
            </div>

        </section>

    `;

}


/**
 * Editable Alpha through Echo ranges.
 */
function createEditableOperationalLevels(

    configuration:ConfigurationOverrides

):string {

    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "Operational Level Ranges",

                "Ranges must remain contiguous, non-overlapping, and span scores 0 through 100."

            )}


            <div class="system-level-editor">

                ${configuration.operationalLevels

                    .map(

                        level =>

                            createOperationalLevelEditor(

                                level

                            )

                    )

                    .join("")}

            </div>

        </section>

    `;

}


/**
 * One editable operational level.
 */
function createOperationalLevelEditor(

    level:OperationalLevelConfiguration

):string {

    const prefix =

        `configLevel${level.title}`;


    return `

        <div class="system-level-editor-row">

            <strong>
                ${escapeHtml(
                    level.title
                )}
            </strong>


            <label>

                <span>
                    Minimum
                </span>

                <input
                    id="${prefix}Minimum"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value="${level.minimum}"
                >

            </label>


            <span class="system-level-separator">
                to
            </span>


            <label>

                <span>
                    Maximum
                </span>

                <input
                    id="${prefix}Maximum"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value="${level.maximum}"
                >

            </label>

        </div>

    `;

}


/**
 * Read-only configuration summary.
 */
function createReadOnlyConfiguration(

    configuration:ConfigurationOverrides

):string {

    return `

        ${createReadOnlyHospitalSection(
            configuration
        )}

        ${createReadOnlyWeights(
            configuration
        )}

        ${createReadOnlyOperationalLevels(
            configuration
        )}

    `;

}


/**
 * Read-only hospital settings.
 */
function createReadOnlyHospitalSection(

    configuration:ConfigurationOverrides

):string {

    const hospital =

        configuration.hospital;


    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "Hospital Configuration",

                "Current effective Emergency Department treatment capacity"

            )}


            <div class="system-configuration-value-grid">

                ${createValueCard(
                    "ED Treatment Capacity",
                    formatNumber(
                        hospital.edCapacity
                    )
                )}
            </div>

        </section>

    `;

}


/**
 * Read-only weight configuration.
 */
function createReadOnlyWeights(

    configuration:ConfigurationOverrides

):string {

    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "HRI Domain Weights",

                "Composite Hospital Readiness weighting"

            )}


            <div class="system-weight-grid">

                ${createWeightCard(
                    "ED Operational Pressure",
                    configuration.domainWeights.edPressure
                )}

                ${createWeightCard(
                    "Critical-Care Capacity",
                    configuration.domainWeights.criticalCapacity
                )}

                ${createWeightCard(
                    "Projected Hospital Capacity",
                    configuration.domainWeights.projectedCapacity
                )}

            </div>

        </section>


        <section class="system-configuration-section">

            ${createSectionHeading(

                "ED Operational Pressure Components",

                "Internal weighting of ED pressure"

            )}


            <div class="system-weight-grid system-weight-grid-three">

                ${createWeightCard(
                    "ED Volume",
                    configuration.edPressureWeights.volume
                )}

                ${createWeightCard(
                    "Boarding",
                    configuration.edPressureWeights.boarding
                )}

                ${createWeightCard(
                    "High Acuity",
                    configuration.edPressureWeights.acuity
                )}

            </div>

        </section>

    `;

}


/**
 * Read-only operational-level ranges.
 */
function createReadOnlyOperationalLevels(

    configuration:ConfigurationOverrides

):string {

    return `

        <section class="system-configuration-section">

            ${createSectionHeading(

                "Operational Level Ranges",

                "Current Alpha through Echo score boundaries"

            )}


            <div class="system-level-readonly-grid">

                ${configuration.operationalLevels

                    .map(

                        level => `

                            <div class="system-level-readonly-card">

                                <span>
                                    ${escapeHtml(
                                        level.title
                                    )}
                                </span>

                                <strong>
                                    ${level.minimum}
                                    –
                                    ${level.maximum}
                                </strong>

                            </div>

                        `

                    )

                    .join("")}

            </div>

        </section>

    `;

}


/**
 * Critical phase notice.
 */
function createEngineIntegrationNotice():string {

    return `

        <div class="system-configuration-integration-warning">

            <strong>
                HRI model changes require recalculation.
            </strong>


            <p>
                Changes to hospital capacity, HRI weights, ED pressure weights, or operational-level ranges invalidate the current HRI result until the assessment is recalculated. Trigger mappings and Hospital Surge Plan response actions refresh operational guidance without changing the HRI score.
            </p>

        </div>

    `;

}


/**
 * Bind controls after rendering.
 */
function bindConfigurationControls():void {

    bindButton(

        "editSystemConfigurationButton",

        enterEditMode

    );


    bindButton(

        "cancelSystemConfigurationButton",

        cancelEditMode

    );


    bindButton(

        "saveSystemConfigurationButton",

        saveEditorConfiguration

    );


    bindButton(

        "restoreSystemConfigurationButton",

        restoreConfigurationDefaults

    );


    document

        .querySelectorAll<HTMLInputElement>(

            ".system-configuration-editor input"

        )

        .forEach(

            input => {

                input.addEventListener(

                    "input",

                    updateLiveTotals

                );

            }

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
 * Enter editing mode.
 */
function enterEditMode():void {

    draftConfiguration =

        getConfiguration();


    editing = true;


    refreshConfiguration();

}


/**
 * Cancel unsaved edits.
 */
function cancelEditMode():void {

    editing = false;

    draftConfiguration = null;


    refreshConfiguration();

}


/**
 * Save editor values.
 */
function saveEditorConfiguration():void {

    const configuration =

        readConfigurationFromEditor();


    if(!configuration){

        showValidationErrors([

            "Unable to read all configuration values from the editor."

        ]);


        return;

    }


    const validation =

        validateConfiguration(

            configuration

        );


    if(!validation.valid){

        showValidationErrors(

            validation.errors

        );


        return;

    }


    const saveResult =

        saveConfiguration(

            configuration

        );


    if(!saveResult.valid){

        showValidationErrors(

            saveResult.errors

        );


        return;

    }


    /*
     * ConfigurationService emits CONFIGURATION_CHANGED.
     * The subscription refreshes this component.
     */

}


/**
 * Restore built-in defaults.
 */
function restoreConfigurationDefaults():void {

    const confirmed = window.confirm(

        "Restore all saved System Configuration overrides to the built-in defaults?"

    );


    if(!confirmed){

        return;

    }


    restoreDefaultConfiguration();

}


/**
 * Read current editor controls.
 */
function readConfigurationFromEditor():

ConfigurationOverrides | null {

    const current =

        getConfiguration();


    const hospital = {

        edCapacity:
            readNumber(
                "configEdCapacity"
            )

    };


    const domainWeights = {

        edPressure:
            readPercentage(
                "configWeightEdPressure"
            ),

        acuteCapacity:
            0,

        criticalCapacity:
            readPercentage(
                "configWeightCritical"
            ),

        inflow:
            0,

        projectedCapacity:
            readPercentage(
                "configWeightProjected"
            )

    };


    const edPressureWeights = {

        volume:
            readPercentage(
                "configEdWeightVolume"
            ),

        boarding:
            readPercentage(
                "configEdWeightBoarding"
            ),

        acuity:
            readPercentage(
                "configEdWeightAcuity"
            )

    };


    const operationalLevels =

        current.operationalLevels.map(

            level => ({

                title:
                    level.title,

                minimum:
                    readNumber(
                        `configLevel${level.title}Minimum`
                    ),

                maximum:
                    readNumber(
                        `configLevel${level.title}Maximum`
                    )

            })

        );


    const valuesToCheck = [

        ...Object.values(
            hospital
        ),

        ...Object.values(
            domainWeights
        ),

        ...Object.values(
            edPressureWeights
        ),

        ...operationalLevels.flatMap(

            level => [

                level.minimum,

                level.maximum

            ]

        )

    ];


    if(

        valuesToCheck.some(

            value =>

                !Number.isFinite(
                    value
                )

        )

    ){

        return null;

    }


    return {

        hospital,

        domainWeights,

        edPressureWeights,

        operationalLevels

    };

}


/**
 * Read one numeric input.
 */
function readNumber(

    id:string

):number {

    const input =

        document.getElementById(

            id

        );


    if(

        !(

            input

            instanceof

            HTMLInputElement

        )

    ){

        return Number.NaN;

    }


    return Number(

        input.value

    );

}


/**
 * Read percentage input as decimal.
 */
function readPercentage(

    id:string

):number {

    return readNumber(

        id

    ) / 100;

}


/**
 * Update weight totals while editing.
 */
function updateLiveTotals():void {

    updateTotalElement(

        "domainWeightTotal",

        [
            "configWeightEdPressure",
            "configWeightProjected",
            "configWeightCritical"
        ]

    );


    updateTotalElement(

        "edPressureWeightTotal",

        [

            "configEdWeightVolume",

            "configEdWeightBoarding",

            "configEdWeightAcuity"

        ]

    );

}


/**
 * Update one percentage-total display.
 */
function updateTotalElement(

    elementId:string,

    inputIds:string[]

):void {

    const element =

        document.getElementById(

            elementId

        );


    if(!element){

        return;

    }


    const total =

        inputIds.reduce(

            (sum,id) =>

                sum

                +

                readNumber(
                    id
                ),

            0

        );


    const valid =

        Math.abs(

            total - 100

        ) < 0.000001;


    element.textContent =

        `Total: ${formatNumber(
            total
        )}% ${valid ? "✓" : "— must equal 100%"}`;


    element.classList.toggle(

        "valid",

        valid

    );


    element.classList.toggle(

        "invalid",

        !valid

    );

}


/**
 * Show validation errors.
 */
function showValidationErrors(

    errors:string[]

):void {

    const container =

        document.getElementById(

            "systemConfigurationValidation"

        );


    if(!container){

        return;

    }


    container.hidden = false;


    container.innerHTML = `

        <strong>
            Configuration could not be saved
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
 * Create section heading.
 */
function createSectionHeading(

    title:string,

    description:string

):string {

    return `

        <div class="system-configuration-section-heading">

            <h4>
                ${escapeHtml(
                    title
                )}
            </h4>


            <p>
                ${escapeHtml(
                    description
                )}
            </p>

        </div>

    `;

}


/**
 * Create numeric input.
 */
function createNumberInput(

    options:{

        id:string;

        label:string;

        value:number;

        minimum:number;

        step:number;

    }

):string {

    return `

        <label class="system-configuration-input">

            <span>
                ${escapeHtml(
                    options.label
                )}
            </span>


            <input
                id="${escapeAttribute(
                    options.id
                )}"
                type="number"
                min="${options.minimum}"
                step="${options.step}"
                value="${options.value}"
            >

        </label>

    `;

}


/**
 * Create percentage input.
 */
function createPercentageInput(

    id:string,

    label:string,

    decimalValue:number

):string {

    return `

        <label class="system-configuration-input">

            <span>
                ${escapeHtml(
                    label
                )}
            </span>


            <div class="system-configuration-percentage-input">

                <input
                    id="${escapeAttribute(
                        id
                    )}"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value="${Math.round(
                        decimalValue * 100
                    )}"
                >

                <span>
                    %
                </span>

            </div>

        </label>

    `;

}


/**
 * Create read-only value card.
 */
function createValueCard(

    label:string,

    value:string

):string {

    return `

        <div class="system-configuration-value-card">

            <span>
                ${escapeHtml(
                    label
                )}
            </span>


            <strong>
                ${escapeHtml(
                    value
                )}
            </strong>

        </div>

    `;

}


/**
 * Create read-only weight card.
 */
function createWeightCard(

    label:string,

    value:number

):string {

    const percentage =

        Math.round(

            value * 100

        );


    return `

        <div class="system-weight-card">

            <span>
                ${escapeHtml(
                    label
                )}
            </span>


            <strong>
                ${percentage}%
            </strong>


            <div class="system-weight-track">

                <div
                    class="system-weight-fill"
                    style="width:${percentage}%;"
                >
                </div>

            </div>

        </div>

    `;

}


/**
 * Format percentage total.
 */
function formatPercentageTotal(

    value:number

):string {

    return `${formatNumber(
        value * 100
    )}%`;

}


/**
 * Format number.
 */
function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return value.toLocaleString(

            "en-US"

        );

    }


    return value

        .toFixed(1)

        .replace(
            /\.0$/,
            ""
        );

}


/**
 * Format ISO date/time.
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
 * Escape HTML.
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


/**
 * Escape HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}