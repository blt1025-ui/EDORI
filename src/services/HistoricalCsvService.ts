/**
 * HistoricalCsvService
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Parses Hospital Readiness historical-expectation
 * CSV files.
 *
 * Required CSV headers:
 *
 * day
 * hour
 * expectedEDVolume
 * expectedEDBoarders
 * expectedStaffedAcuteCareBeds
 * expectedOccupiedAcuteCareBeds
 * expectedEDAdmissions
 * expectedDirectAdmissions
 * expectedSurgicalAdmissions
 * expectedInpatientDepartures
 *
 * IMPORTANT:
 *
 * expectedEDAdmissions means NEW ED-origin inpatient
 * admissions during that hourly interval. It does not
 * mean ED arrivals and does not include patients who
 * were already boarding at the start of the interval.
 */

import {

    validateHistoricalDataset

}

from "./HistoricalDataValidator";


import type {

    HistoricalDataValidationResult

}

from "./HistoricalDataValidator";


import type {

    DayOfWeek,
    HistoricalExpectation

}

from "../types/HistoricalExpectation";


const REQUIRED_HEADERS = [

    "day",
    "hour",
    "expectedEDVolume",
    "expectedEDBoarders",
    "expectedStaffedAcuteCareBeds",
    "expectedOccupiedAcuteCareBeds",
    "expectedEDAdmissions",
    "expectedDirectAdmissions",
    "expectedSurgicalAdmissions",
    "expectedInpatientDepartures"

] as const;


const DAYS:DayOfWeek[] = [

    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"

];


type CsvRow = Record<string, string>;


export interface HistoricalCsvParseResult {

    valid:boolean;

    records:HistoricalExpectation[];

    errors:string[];

    warnings:string[];

    validation:
        HistoricalDataValidationResult
        | null;

}


/**
 * Parse a CSV string into Version 2.1 records.
 */
export function parseHistoricalCsv(

    csvText:string

):HistoricalCsvParseResult {

    const errors:string[] = [];

    const warnings:string[] = [];


    const normalizedText = normalizeCsvText(
        csvText
    );


    if(normalizedText.trim().length === 0){

        return failure(
            ["The CSV file is empty."],
            warnings
        );

    }


    const rawRows = parseCsvRows(
        normalizedText,
        errors
    );


    if(errors.length > 0){

        return failure(
            errors,
            warnings
        );

    }


    if(rawRows.length === 0){

        return failure(
            ["The CSV file does not contain any rows."],
            warnings
        );

    }


    const headers = rawRows[0].map(
        normalizeHeader
    );


    validateHeaders(
        headers,
        errors,
        warnings
    );


    if(errors.length > 0){

        return failure(
            errors,
            warnings
        );

    }


    const dataRows = rawRows.slice(1);


    const mappedRows = mapRowsToObjects(
        headers,
        dataRows
    );


    const records:HistoricalExpectation[] = [];


    mappedRows.forEach(

        (
            row,
            index
        ) => {

            if(isBlankRow(row)){

                return;

            }


            const record = parseHistoricalRow(

                row,
                index + 2,
                errors

            );


            if(record){

                records.push(
                    record
                );

            }

        }

    );


    if(errors.length > 0){

        return failure(
            errors,
            warnings
        );

    }


    if(records.length === 0){

        return failure(
            ["The CSV file does not contain any historical expectation records."],
            warnings
        );

    }


    const validation = validateHistoricalDataset(
        records
    );


    if(!validation.valid){

        addValidationErrors(
            validation,
            errors
        );

    }


    return {

        valid:
            errors.length === 0
            &&
            validation.valid,

        records:
            errors.length === 0
                ? sortRecords(records)
                : [],

        errors,

        warnings,

        validation

    };

}


/**
 * Read and parse a browser File.
 */
export async function parseHistoricalCsvFile(

    file:File

):Promise<HistoricalCsvParseResult> {

    if(!isCsvFile(file)){

        return failure(

            ["Select a CSV file with a .csv extension."],
            []

        );

    }


    try {

        return parseHistoricalCsv(

            await file.text()

        );

    }
    catch(error){

        console.error(

            "Unable to read historical CSV file:",

            error

        );


        return failure(

            ["The selected CSV file could not be read."],
            []

        );

    }

}


function failure(

    errors:string[],

    warnings:string[]

):HistoricalCsvParseResult {

    return {

        valid:false,

        records:[],

        errors,

        warnings,

        validation:null

    };

}


/**
 * Parse CSV with quoted-field support.
 */
function parseCsvRows(

    csvText:string,

    errors:string[]

):string[][] {

    const rows:string[][] = [];

    let currentRow:string[] = [];

    let currentValue = "";

    let insideQuotes = false;


    for(
        let index = 0;
        index < csvText.length;
        index += 1
    ){

        const character = csvText[index];

        const nextCharacter = csvText[index + 1];


        if(character === "\""){

            if(
                insideQuotes
                &&
                nextCharacter === "\""
            ){

                currentValue += "\"";

                index += 1;

            }
            else{

                insideQuotes = !insideQuotes;

            }


            continue;

        }


        if(
            character === ","
            &&
            !insideQuotes
        ){

            currentRow.push(
                currentValue
            );

            currentValue = "";

            continue;

        }


        if(
            character === "\n"
            &&
            !insideQuotes
        ){

            currentRow.push(
                currentValue
            );

            rows.push(
                currentRow
            );

            currentRow = [];

            currentValue = "";

            continue;

        }


        currentValue += character;

    }


    if(insideQuotes){

        errors.push(
            "The CSV contains an unclosed quoted field."
        );

        return [];

    }


    if(
        currentValue.length > 0
        ||
        currentRow.length > 0
    ){

        currentRow.push(
            currentValue
        );

        rows.push(
            currentRow
        );

    }


    return rows;

}


function validateHeaders(

    headers:string[],

    errors:string[],

    warnings:string[]

):void {

    const duplicateHeaders = findDuplicates(

        headers.filter(
            header => header.length > 0
        )

    );


    if(duplicateHeaders.length > 0){

        errors.push(

            `Duplicate CSV headers: ${duplicateHeaders.join(", ")}.`

        );

    }


    REQUIRED_HEADERS.forEach(

        requiredHeader => {

            if(!headers.includes(requiredHeader)){

                errors.push(

                    `Missing required CSV header: ${requiredHeader}.`

                );

            }

        }

    );


    const additionalHeaders = headers.filter(

        header =>
            header.length > 0
            &&
            !REQUIRED_HEADERS.includes(
                header as typeof REQUIRED_HEADERS[number]
            )

    );


    if(additionalHeaders.length > 0){

        warnings.push(

            `Additional CSV columns will be ignored: ${additionalHeaders.join(", ")}.`

        );

    }

}


function mapRowsToObjects(

    headers:string[],

    rows:string[][]

):CsvRow[] {

    return rows.map(

        row => {

            const result:CsvRow = {};


            headers.forEach(

                (
                    header,
                    index
                ) => {

                    if(header.length === 0){

                        return;

                    }


                    result[header] =
                        row[index]
                        ?? "";

                }

            );


            return result;

        }

    );

}


/**
 * Convert one CSV row into a Version 2.1 record.
 */
function parseHistoricalRow(

    row:CsvRow,

    rowNumber:number,

    errors:string[]

):HistoricalExpectation | null {

    const day = parseDay(
        row.day,
        rowNumber,
        errors
    );


    const hour = parseNumber(
        row.hour,
        "hour",
        rowNumber,
        errors,
        {
            integer:true,
            minimum:0,
            maximum:23
        }
    );


    const expectedEDVolume = parseRequiredHistoricalNumber(
        row,
        "expectedEDVolume",
        rowNumber,
        errors
    );


    const expectedEDBoarders = parseRequiredHistoricalNumber(
        row,
        "expectedEDBoarders",
        rowNumber,
        errors
    );


    const expectedStaffedAcuteCareBeds = parseNumber(
        row.expectedStaffedAcuteCareBeds,
        "expectedStaffedAcuteCareBeds",
        rowNumber,
        errors,
        {
            minimum:0.01
        }
    );


    const expectedOccupiedAcuteCareBeds = parseRequiredHistoricalNumber(
        row,
        "expectedOccupiedAcuteCareBeds",
        rowNumber,
        errors
    );


    const expectedEDAdmissions = parseRequiredHistoricalNumber(
        row,
        "expectedEDAdmissions",
        rowNumber,
        errors
    );


    const expectedDirectAdmissions = parseRequiredHistoricalNumber(
        row,
        "expectedDirectAdmissions",
        rowNumber,
        errors
    );


    const expectedSurgicalAdmissions = parseRequiredHistoricalNumber(
        row,
        "expectedSurgicalAdmissions",
        rowNumber,
        errors
    );


    const expectedInpatientDepartures = parseRequiredHistoricalNumber(
        row,
        "expectedInpatientDepartures",
        rowNumber,
        errors
    );


    if(
        day === null
        ||
        hour === null
        ||
        expectedEDVolume === null
        ||
        expectedEDBoarders === null
        ||
        expectedStaffedAcuteCareBeds === null
        ||
        expectedOccupiedAcuteCareBeds === null
        ||
        expectedEDAdmissions === null
        ||
        expectedDirectAdmissions === null
        ||
        expectedSurgicalAdmissions === null
        ||
        expectedInpatientDepartures === null
    ){

        return null;

    }


    if(
        expectedEDBoarders
        >
        expectedEDVolume
    ){

        errors.push(

            `Row ${rowNumber}: expectedEDBoarders cannot exceed expectedEDVolume.`

        );

        return null;

    }


    if(
        expectedOccupiedAcuteCareBeds
        >
        expectedStaffedAcuteCareBeds
    ){

        errors.push(

            `Row ${rowNumber}: expectedOccupiedAcuteCareBeds cannot exceed expectedStaffedAcuteCareBeds.`

        );

        return null;

    }


    return {

        day,

        hour,

        expectedEDVolume,

        expectedEDBoarders,

        expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds,

        expectedEDAdmissions,

        expectedDirectAdmissions,

        expectedSurgicalAdmissions,

        expectedInpatientDepartures

    };

}


function parseRequiredHistoricalNumber(

    row:CsvRow,

    fieldName:
        | "expectedEDVolume"
        | "expectedEDBoarders"
        | "expectedOccupiedAcuteCareBeds"
        | "expectedEDAdmissions"
        | "expectedDirectAdmissions"
        | "expectedSurgicalAdmissions"
        | "expectedInpatientDepartures",

    rowNumber:number,

    errors:string[]

):number | null {

    return parseNumber(
        row[fieldName],
        fieldName,
        rowNumber,
        errors,
        {
            minimum:0
        }
    );

}


function parseDay(

    value:string | undefined,

    rowNumber:number,

    errors:string[]

):DayOfWeek | null {

    const normalizedValue =
        value?.trim().toLowerCase()
        ?? "";


    const match = DAYS.find(

        day =>
            day.toLowerCase()
            ===
            normalizedValue

    );


    if(!match){

        errors.push(

            `Row ${rowNumber}: day must be Sunday through Saturday.`

        );

        return null;

    }


    return match;

}


function parseNumber(

    value:string | undefined,

    fieldName:string,

    rowNumber:number,

    errors:string[],

    options:{

        integer?:boolean;

        minimum?:number;

        maximum?:number;

    }

):number | null {

    const trimmedValue =
        value?.trim()
        ?? "";


    if(trimmedValue.length === 0){

        errors.push(

            `Row ${rowNumber}: ${fieldName} is required.`

        );

        return null;

    }


    const parsedValue = Number(
        trimmedValue
    );


    if(!Number.isFinite(parsedValue)){

        errors.push(

            `Row ${rowNumber}: ${fieldName} must be a number.`

        );

        return null;

    }


    if(
        options.integer
        &&
        !Number.isInteger(parsedValue)
    ){

        errors.push(

            `Row ${rowNumber}: ${fieldName} must be a whole number.`

        );

        return null;

    }


    if(
        options.minimum !== undefined
        &&
        parsedValue < options.minimum
    ){

        errors.push(

            `Row ${rowNumber}: ${fieldName} must be at least ${options.minimum}.`

        );

        return null;

    }


    if(
        options.maximum !== undefined
        &&
        parsedValue > options.maximum
    ){

        errors.push(

            `Row ${rowNumber}: ${fieldName} cannot exceed ${options.maximum}.`

        );

        return null;

    }


    return parsedValue;

}


function addValidationErrors(

    validation:HistoricalDataValidationResult,

    errors:string[]

):void {

    if(validation.actualRecordCount !== 168){

        errors.push(

            `The CSV contains ${validation.actualRecordCount} records; exactly 168 are required.`

        );

    }


    if(validation.missingRecords.length > 0){

        errors.push(

            `Missing weekday/hour records: ${formatLimitedList(validation.missingRecords)}.`

        );

    }


    if(validation.duplicateRecords.length > 0){

        errors.push(

            `Duplicate weekday/hour records: ${formatLimitedList(validation.duplicateRecords)}.`

        );

    }


    if(validation.invalidRecords.length > 0){

        errors.push(

            `Invalid historical records: ${formatLimitedList(validation.invalidRecords)}.`

        );

    }

}


function normalizeCsvText(

    value:string

):string {

    return value

        .replace(
            /^\uFEFF/,
            ""
        )

        .replaceAll(
            "\r\n",
            "\n"
        )

        .replaceAll(
            "\r",
            "\n"
        );

}


function normalizeHeader(

    value:string

):string {

    return value
        .trim()
        .replace(
            /^\uFEFF/,
            ""
        );

}


function isBlankRow(

    row:CsvRow

):boolean {

    return Object.values(row).every(

        value => value.trim().length === 0

    );

}


function isCsvFile(

    file:File

):boolean {

    return file.name
        .toLowerCase()
        .endsWith(
            ".csv"
        );

}


function sortRecords(

    records:HistoricalExpectation[]

):HistoricalExpectation[] {

    return [
        ...records
    ].sort(

        (
            first,
            second
        ) => {

            const dayDifference =
                DAYS.indexOf(first.day)
                -
                DAYS.indexOf(second.day);


            if(dayDifference !== 0){

                return dayDifference;

            }


            return first.hour - second.hour;

        }

    );

}


function findDuplicates(

    values:string[]

):string[] {

    const counts = new Map<string, number>();


    values.forEach(

        value => {

            counts.set(

                value,

                (
                    counts.get(value)
                    ?? 0
                )
                +
                1

            );

        }

    );


    return Array.from(
        counts.entries()
    )
        .filter(
            ([, count]) => count > 1
        )
        .map(
            ([value]) => value
        );

}


function formatLimitedList(

    values:string[],

    maximumItems:number = 10

):string {

    const visibleValues = values.slice(
        0,
        maximumItems
    );


    const remainingCount =
        values.length
        -
        visibleValues.length;


    if(remainingCount <= 0){

        return visibleValues.join(
            ", "
        );

    }


    return `${visibleValues.join(", ")} and ${remainingCount} more`;

}