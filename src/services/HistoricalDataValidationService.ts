/**
 * HistoricalDataValidationService
 *
 * Validates the currently active historical
 * dataset from HistoricalDataRepository.
 *
 * Candidate-dataset validation is provided by
 * HistoricalDataValidator.
 */

import {

    getHistoricalDataset

}

from "./HistoricalDataRepository";


import {

    validateHistoricalDataset

}

from "./HistoricalDataValidator";


import type {

    HistoricalDataValidationResult

}

from "./HistoricalDataValidator";


export type {

    HistoricalDataValidationResult

}

from "./HistoricalDataValidator";


/**
 * Validate the active repository dataset.
 */
export function validateHistoricalData():

HistoricalDataValidationResult {

    return validateHistoricalDataset(

        getHistoricalDataset()

    );

}


/**
 * Re-export candidate validation for existing
 * imports such as HistoricalCsvService.
 */
export {

    validateHistoricalDataset

};