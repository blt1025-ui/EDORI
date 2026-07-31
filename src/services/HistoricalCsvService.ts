/**
 * HistoricalCsvService
 *
 * Parses EDORI historical-expectation CSV files.
 *
 * Required CSV headers:
 *
 * day
 * hour
 * expectedVolume
 * expectedBoarders
 * expectedArrivals
 * expectedDepartures
 *
 * This service parses and validates candidate data.
 * It does not save data to localStorage.
 */

import {

    validateHistoricalDataset

}

from "./HistoricalDataValidationService";


import type {

    HistoricalDataValidationResult

}

from "./HistoricalDataValidationService";


import type {

    DayOfWeek,

    HistoricalExpectation

}

from "../types/HistoricalExpectation";


/**
 * Required column names.
 */
const REQUIRED_HEADERS = [

    "day",

    "hour",

    "expectedVolume",

    "expectedBoarders",

    "expectedArrivals",

    "expectedDepartures"

] as const;


/**
 * Valid weekday values.
 */
const DAYS:DayOfWeek[] = [

    "Sunday",

    "Monday",

    "Tuesday",

    "Wednesday",

    "Thursday",

    "Friday",

    "Saturday"

];


/**
 * One parsed CSV row before conversion.
 */
type CsvRow = Record<

    string,

    string

>;


/**
 * Result returned by CSV parsing.
 */
export interface HistoricalCsvParseResult {

    /**
     * True only when:
     *
     * - CSV syntax is valid
     * - required headers exist
     * - every row can be converted
     * - the complete weekly dataset validates
     */
    valid:boolean;


    /**
     * Parsed historical records.
     *
     * Empty when parsing fails.
     */
    records:HistoricalExpectation[];


    /**
     * CSV syntax, header, and row errors.
     */
    errors:string[];


    /**
     * Warnings that do not necessarily make
     * the CSV unusable.
     */
    warnings:string[];


    /**
     * Full weekly-dataset validation result.
     *
     * Null when parsing fails before records
     * can be validated.
     */
    validation:

        HistoricalDataValidationResult

        | null;

}


/**
 * Parse a CSV string into EDORI historical records.
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

        return {

            valid:false,

            records:[],

            errors:[

                "The CSV file is empty."

            ],

            warnings,

            validation:null

        };

    }


    const rawRows = parseCsvRows(

        normalizedText,

        errors

    );


    if(errors.length > 0){

        return {

            valid:false,

            records:[],

            errors,

            warnings,

            validation:null

        };

    }


    if(rawRows.length === 0){

        return {

            valid:false,

            records:[],

            errors:[

                "The CSV file does not contain any rows."

            ],

            warnings,

            validation:null

        };

    }


    const headerRow = rawRows[0];


    const headers = headerRow.map(

        header => normalizeHeader(

            header

        )

    );


    validateHeaders(

        headers,

        errors,

        warnings

    );


    if(errors.length > 0){

        return {

            valid:false,

            records:[],

            errors,

            warnings,

            validation:null

        };

    }


    const dataRows = rawRows.slice(

        1

    );


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

            const csvRowNumber =

                index + 2;


            /*
             * Ignore completely blank rows.
             */

            if(isBlankRow(row)){

                return;

            }


            const record = parseHistoricalRow(

                row,

                csvRowNumber,

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

        return {

            valid:false,

            records:[],

            errors,

            warnings,

            validation:null

        };

    }


    if(records.length === 0){

        return {

            valid:false,

            records:[],

            errors:[

                "The CSV file does not contain any historical expectation records."

            ],

            warnings,

            validation:null

        };

    }


    const validation =

        validateHistoricalDataset(

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

                ? sortRecords(

                    records

                )

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

        return {

            valid:false,

            records:[],

            errors:[

                "Select a CSV file with a .csv extension."

            ],

            warnings:[],

            validation:null

        };

    }


    try {

        const csvText = await file.text();


        return parseHistoricalCsv(

            csvText

        );

    }
    catch(error){

        console.error(

            "Unable to read historical CSV file:",

            error

        );


        return {

            valid:false,

            records:[],

            errors:[

                "The selected CSV file could not be read."

            ],

            warnings:[],

            validation:null

        };

    }

}


/**
 * Parse CSV into a two-dimensional string array.
 *
 * Supports:
 *
 * - quoted fields
 * - commas inside quoted values
 * - escaped double quotes
 * - CRLF and LF line endings
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

        const character =

            csvText[index];


        const nextCharacter =

            csvText[index + 1];


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

                insideQuotes =

                    !insideQuotes;

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


        currentValue +=

            character;

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


/**
 * Validate required and additional headers.
 */
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

            if(

                !headers.includes(

                    requiredHeader

                )

            ){

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


/**
 * Convert each row into a header/value object.
 */
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
 * Convert one CSV row into a historical record.
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


    const expectedVolume = parseNumber(

        row.expectedVolume,

        "expectedVolume",

        rowNumber,

        errors,

        {

            minimum:0

        }

    );


    const expectedBoarders = parseNumber(

        row.expectedBoarders,

        "expectedBoarders",

        rowNumber,

        errors,

        {

            minimum:0

        }

    );


    const expectedArrivals = parseNumber(

        row.expectedArrivals,

        "expectedArrivals",

        rowNumber,

        errors,

        {

            minimum:0

        }

    );


    const expectedDepartures = parseNumber(

        row.expectedDepartures,

        "expectedDepartures",

        rowNumber,

        errors,

        {

            minimum:0

        }

    );


    if(

        day === null

        ||

        hour === null

        ||

        expectedVolume === null

        ||

        expectedBoarders === null

        ||

        expectedArrivals === null

        ||

        expectedDepartures === null

    ){

        return null;

    }


    return {

        day,

        hour,

        expectedVolume,

        expectedBoarders,

        expectedArrivals,

        expectedDepartures

    };

}


/**
 * Parse and normalize a weekday.
 */
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


/**
 * Parse one numeric CSV field.
 */
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


/**
 * Add complete-dataset validation problems
 * to the parser error list.
 */
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


/**
 * Normalize line endings and remove a UTF-8 BOM.
 */
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


/**
 * Normalize a header while preserving required
 * camel-case names.
 */
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


/**
 * Determine whether every CSV field is blank.
 */
function isBlankRow(

    row:CsvRow

):boolean {

    return Object.values(

        row

    ).every(

        value => value.trim().length === 0

    );

}


/**
 * Determine whether the browser File looks
 * like a CSV.
 */
function isCsvFile(

    file:File

):boolean {

    return file.name

        .toLowerCase()

        .endsWith(

            ".csv"

        );

}


/**
 * Sort records in weekday/hour order.
 */
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

                DAYS.indexOf(

                    first.day

                )

                -

                DAYS.indexOf(

                    second.day

                );


            if(dayDifference !== 0){

                return dayDifference;

            }


            return first.hour -

                second.hour;

        }

    );

}


/**
 * Find duplicate strings.
 */
function findDuplicates(

    values:string[]

):string[] {

    const counts = new Map<

        string,

        number

    >();


    values.forEach(

        value => {

            counts.set(

                value,

                (

                    counts.get(

                        value

                    )

                    ?? 0

                )

                + 1

            );

        }

    );


    return Array.from(

        counts.entries()

    )

        .filter(

            (

                [,

                count]

            ) => count > 1

        )

        .map(

            (

                [value]

            ) => value

        );

}


/**
 * Limit lengthy validation messages.
 */
function formatLimitedList(

    values:string[],

    maximumItems:number = 10

):string {

    const visibleValues = values.slice(

        0,

        maximumItems

    );


    const remainingCount =

        values.length -

        visibleValues.length;


    if(remainingCount <= 0){

        return visibleValues.join(

            ", "

        );

    }


    return `${visibleValues.join(", ")} and ${remainingCount} more`;

}