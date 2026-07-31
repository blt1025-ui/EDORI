/**
 * HistoricalDataManager
 *
 * Allows authorized users to:
 *
 * - Select a historical-expectation CSV
 * - Validate the candidate dataset
 * - Import a valid 168-record dataset
 * - View the active data source
 * - Restore the built-in dataset
 *
 * Changing the active historical dataset invalidates
 * the current EDORI result and requires recalculation.
 */

import {

    parseHistoricalCsvFile

}

from "../services/HistoricalCsvService";


import {

    clearImportedHistoricalDataset,

    getHistoricalDataSource,

    getHistoricalRecordCount,

    hasImportedHistoricalDataset,

    saveHistoricalDataset

}

from "../services/HistoricalDataRepository";


import {

    invalidateLatestResult

}

from "../services/ResultService";


import {

    emit

}

from "../services/EventService";


import type {

    HistoricalCsvParseResult

}

from "../services/HistoricalCsvService";


import type {

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


/**
 * Candidate dataset that has passed validation
 * but has not yet been imported.
 */
let validatedDataset:

HistoricalExpectation[] | null = null;


/**
 * Render the Historical Data Management panel.
 */
export function HistoricalDataManager():string {

    return `

        <section class="historical-manager-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Historical Data Management
                    </h3>

                    <p class="panel-description">
                        Validate and import the weekly historical-expectation dataset.
                    </p>

                </div>

            </div>


            <div class="historical-source-summary">

                <div class="historical-source-item">

                    <span class="historical-source-label">
                        Active Source
                    </span>

                    <strong
                        id="historicalSourceValue"
                        class="historical-source-value"
                    >
                        --
                    </strong>

                </div>


                <div class="historical-source-item">

                    <span class="historical-source-label">
                        Active Records
                    </span>

                    <strong
                        id="historicalRecordCount"
                        class="historical-source-value"
                    >
                        --
                    </strong>

                </div>


                <div class="historical-source-item">

                    <span class="historical-source-label">
                        Required Records
                    </span>

                    <strong class="historical-source-value">
                        168
                    </strong>

                </div>

            </div>


            <div class="historical-upload-area">

                <label
                    class="historical-file-label"
                    for="historicalCsvFile"
                >
                    Historical Expectations CSV
                </label>


                <input
                    id="historicalCsvFile"
                    class="historical-file-input"
                    type="file"
                    accept=".csv,text/csv"
                />


                <p class="historical-file-help">

                    Required columns:

                    day, hour, expectedVolume,
                    expectedBoarders, expectedArrivals,
                    expectedDepartures.

                </p>

            </div>


            <div class="historical-manager-actions">

                <button
                    id="validateHistoricalCsvButton"
                    class="secondary-button"
                    type="button"
                >
                    Validate CSV
                </button>


                <button
                    id="importHistoricalCsvButton"
                    class="calculate-button"
                    type="button"
                    disabled
                >
                    Import Validated Dataset
                </button>


                <button
                    id="restoreBuiltInDataButton"
                    class="danger-secondary-button"
                    type="button"
                >
                    Restore Built-In Data
                </button>

            </div>


            <div
                id="historicalImportMessage"
                class="
                    historical-import-message
                    historical-import-message-default
                "
                aria-live="polite"
            >

                Select a completed CSV file and validate it before importing.

            </div>


            <div
                id="historicalValidationResults"
                class="historical-validation-results"
            >
            </div>

        </section>

    `;

}


/**
 * Initialize panel behavior.
 */
export function initializeHistoricalDataManager():void {

    updateActiveSourceDisplay();

    initializeFileInput();

    initializeValidateButton();

    initializeImportButton();

    initializeRestoreButton();

}


/**
 * Reset the candidate validation whenever
 * a different file is selected.
 */
function initializeFileInput():void {

    const input = document.getElementById(

        "historicalCsvFile"

    ) as HTMLInputElement | null;


    if(!input){

        console.warn(

            "HistoricalDataManager could not find historicalCsvFile."

        );

        return;

    }


    input.addEventListener(

        "change",

        () => {

            validatedDataset = null;


            setImportButtonEnabled(

                false

            );


            clearValidationResults();


            const file = input.files?.[0];


            if(!file){

                showImportMessage(

                    "Select a completed CSV file and validate it before importing.",

                    "default"

                );


                return;

            }


            showImportMessage(

                `Selected file: ${file.name}. Select Validate CSV to continue.`,

                "default"

            );

        }

    );

}


/**
 * Initialize CSV validation.
 */
function initializeValidateButton():void {

    const button = document.getElementById(

        "validateHistoricalCsvButton"

    ) as HTMLButtonElement | null;


    if(!button){

        console.warn(

            "HistoricalDataManager could not find validateHistoricalCsvButton."

        );

        return;

    }


    button.addEventListener(

        "click",

        validateSelectedCsv

    );

}


/**
 * Read and validate the selected CSV.
 */
async function validateSelectedCsv():Promise<void> {

    const input = document.getElementById(

        "historicalCsvFile"

    ) as HTMLInputElement | null;


    const file = input?.files?.[0];


    if(!file){

        showImportMessage(

            "Select a CSV file before validating.",

            "error"

        );


        return;

    }


    validatedDataset = null;


    setImportButtonEnabled(

        false

    );


    setValidationState(

        true

    );


    clearValidationResults();


    showImportMessage(

        "Validating historical dataset...",

        "default"

    );


    try {

        const result = await parseHistoricalCsvFile(

            file

        );


        displayValidationResult(

            result

        );


        if(!result.valid){

            showImportMessage(

                "The selected CSV is not valid and was not imported.",

                "error"

            );


            return;

        }


        validatedDataset = result.records.map(

            record => ({

                ...record

            })

        );


        setImportButtonEnabled(

            true

        );


        showImportMessage(

            `Validation passed. ${result.records.length} records are ready to import.`,

            "success"

        );

    }
    catch(error){

        console.error(

            "Historical CSV validation failed:",

            error

        );


        showImportMessage(

            "The selected CSV could not be validated.",

            "error"

        );

    }
    finally {

        setValidationState(

            false

        );

    }

}


/**
 * Initialize the import button.
 */
function initializeImportButton():void {

    const button = document.getElementById(

        "importHistoricalCsvButton"

    ) as HTMLButtonElement | null;


    if(!button){

        console.warn(

            "HistoricalDataManager could not find importHistoricalCsvButton."

        );

        return;

    }


    button.addEventListener(

        "click",

        importValidatedDataset

    );

}


/**
 * Save the validated dataset and invalidate
 * the current EDORI result.
 */
function importValidatedDataset():void {

    if(

        !validatedDataset

        ||

        validatedDataset.length !== 168

    ){

        showImportMessage(

            "Validate a complete 168-record CSV before importing.",

            "error"

        );


        return;

    }


    try {

        saveHistoricalDataset(

            validatedDataset

        );


        invalidateLatestResult(

            "Historical expectations changed after a new CSV dataset was imported."

        );


        validatedDataset = null;


        setImportButtonEnabled(

            false

        );


        updateActiveSourceDisplay();


        showImportMessage(

            "Historical expectations were imported successfully. Recalculate EDORI using the active dataset.",

            "success"

        );


        /*
         * Notify components that the historical
         * dataset changed.
         */

        emit(

            "historicalDataChanged"

        );


        /*
         * Notify result-driven components so they
         * immediately reset to recalculation state.
         */

        emit(

            "resultChanged"

        );

    }
    catch(error){

        console.error(

            "Unable to import historical data:",

            error

        );


        showImportMessage(

            "The validated dataset could not be imported.",

            "error"

        );

    }

}


/**
 * Initialize restoration of built-in data.
 */
function initializeRestoreButton():void {

    const button = document.getElementById(

        "restoreBuiltInDataButton"

    ) as HTMLButtonElement | null;


    if(!button){

        console.warn(

            "HistoricalDataManager could not find restoreBuiltInDataButton."

        );

        return;

    }


    button.addEventListener(

        "click",

        restoreBuiltInDataset

    );

}


/**
 * Clear imported data and return to the
 * built-in historical dataset.
 */
function restoreBuiltInDataset():void {

    if(!hasImportedHistoricalDataset()){

        showImportMessage(

            "The built-in historical dataset is already active.",

            "default"

        );


        return;

    }


    const confirmed = window.confirm(

        "Remove the imported historical dataset and restore the built-in data? The current EDORI result will require recalculation."

    );


    if(!confirmed){

        return;

    }


    try {

        clearImportedHistoricalDataset();


        invalidateLatestResult(

            "Historical expectations changed after the built-in dataset was restored."

        );


        validatedDataset = null;


        setImportButtonEnabled(

            false

        );


        resetFileInput();


        clearValidationResults();


        updateActiveSourceDisplay();


        showImportMessage(

            "Imported historical data were removed. The built-in dataset is active and EDORI must be recalculated.",

            "success"

        );


        emit(

            "historicalDataChanged"

        );


        emit(

            "resultChanged"

        );

    }
    catch(error){

        console.error(

            "Unable to restore built-in historical data:",

            error

        );


        showImportMessage(

            "The built-in historical dataset could not be restored.",

            "error"

        );

    }

}


/**
 * Update source and record-count indicators.
 */
function updateActiveSourceDisplay():void {

    const source = getHistoricalDataSource();


    const recordCount = getHistoricalRecordCount();


    setElementText(

        "historicalSourceValue",

        source === "imported"

            ? "Imported CSV"

            : "Built-In Dataset"

    );


    setElementText(

        "historicalRecordCount",

        String(

            recordCount

        )

    );


    const sourceElement = document.getElementById(

        "historicalSourceValue"

    );


    if(sourceElement){

        sourceElement.classList.toggle(

            "historical-source-imported",

            source === "imported"

        );


        sourceElement.classList.toggle(

            "historical-source-built-in",

            source === "built-in"

        );

    }


    const restoreButton = document.getElementById(

        "restoreBuiltInDataButton"

    ) as HTMLButtonElement | null;


    if(restoreButton){

        restoreButton.disabled =

            source === "built-in";

    }

}


/**
 * Display parser and dataset-validation results.
 */
function displayValidationResult(

    result:HistoricalCsvParseResult

):void {

    const container = document.getElementById(

        "historicalValidationResults"

    );


    if(!container){

        return;

    }


    const validation = result.validation;


    const summaryHtml = validation

        ? `

            <div class="historical-validation-summary">

                ${createValidationMetric(

                    "Records Found",

                    validation.actualRecordCount,

                    validation.actualRecordCount === 168

                )}


                ${createValidationMetric(

                    "Missing Records",

                    validation.missingRecords.length,

                    validation.missingRecords.length === 0

                )}


                ${createValidationMetric(

                    "Duplicate Records",

                    validation.duplicateRecords.length,

                    validation.duplicateRecords.length === 0

                )}


                ${createValidationMetric(

                    "Invalid Records",

                    validation.invalidRecords.length,

                    validation.invalidRecords.length === 0

                )}

            </div>

        `

        : "";


    const successHtml = result.valid

        ? `

            <div class="historical-validation-success">

                ✓ The dataset contains all 168 required weekday and hour records.

            </div>

        `

        : "";


    const errorsHtml = result.errors.length > 0

        ? createMessageList(

            "Validation Errors",

            result.errors,

            "historical-validation-errors"

        )

        : "";


    const warningsHtml = result.warnings.length > 0

        ? createMessageList(

            "Warnings",

            result.warnings,

            "historical-validation-warnings"

        )

        : "";


    container.innerHTML = `

        ${summaryHtml}

        ${successHtml}

        ${errorsHtml}

        ${warningsHtml}

    `;

}


/**
 * Create one validation summary metric.
 */
function createValidationMetric(

    label:string,

    value:number,

    valid:boolean

):string {

    return `

        <div class="historical-validation-metric">

            <span>

                ${escapeHtml(label)}

            </span>


            <strong
                class="${

                    valid

                        ? "validation-value-valid"

                        : "validation-value-invalid"

                }"
            >

                ${value}

            </strong>

        </div>

    `;

}


/**
 * Create a validation error or warning list.
 */
function createMessageList(

    heading:string,

    messages:string[],

    className:string

):string {

    return `

        <div class="${className}">

            <h4>

                ${escapeHtml(heading)}

            </h4>


            <ul>

                ${messages

                    .map(

                        message => `

                            <li>

                                ${escapeHtml(message)}

                            </li>

                        `

                    )

                    .join("")}

            </ul>

        </div>

    `;

}


/**
 * Set validation processing state.
 */
function setValidationState(

    validating:boolean

):void {

    const button = document.getElementById(

        "validateHistoricalCsvButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = validating;


    button.textContent = validating

        ? "Validating..."

        : "Validate CSV";

}


/**
 * Enable or disable dataset import.
 */
function setImportButtonEnabled(

    enabled:boolean

):void {

    const button = document.getElementById(

        "importHistoricalCsvButton"

    ) as HTMLButtonElement | null;


    if(!button){

        return;

    }


    button.disabled = !enabled;

}


/**
 * Reset the file input.
 */
function resetFileInput():void {

    const input = document.getElementById(

        "historicalCsvFile"

    ) as HTMLInputElement | null;


    if(input){

        input.value = "";

    }

}


/**
 * Clear previous validation output.
 */
function clearValidationResults():void {

    const container = document.getElementById(

        "historicalValidationResults"

    );


    if(container){

        container.innerHTML = "";

    }

}


/**
 * Update the import-status message.
 */
function showImportMessage(

    message:string,

    type:

        | "default"

        | "success"

        | "error"

):void {

    const element = document.getElementById(

        "historicalImportMessage"

    );


    if(!element){

        return;

    }


    element.textContent = message;


    element.classList.remove(

        "historical-import-message-default",

        "historical-import-message-success",

        "historical-import-message-error"

    );


    element.classList.add(

        `historical-import-message-${type}`

    );

}


/**
 * Safely update an element.
 */
function setElementText(

    elementId:string,

    value:string

):void {

    const element = document.getElementById(

        elementId

    );


    if(element){

        element.textContent = value;

    }

}


/**
 * Escape values inserted into HTML.
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