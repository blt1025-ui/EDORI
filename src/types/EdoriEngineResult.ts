/**
 * EdoriEngineResult
 *
 * Represents the outcome of one attempt to
 * complete an EDORI assessment.
 */

import type { EdoriResult }
from "./EdoriResult";


import type { SituationAssessment }
from "./SituationAssessment";


export interface EdoriEngineSuccess {

    success:true;

    assessment:SituationAssessment;

    result:EdoriResult;

    snapshotSaved:boolean;

}


export interface EdoriEngineFailure {

    success:false;

    errors:string[];

}


export type EdoriEngineResult =

    | EdoriEngineSuccess

    | EdoriEngineFailure;