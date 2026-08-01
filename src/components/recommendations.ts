/**
 * Recommendations
 *
 * Displays prioritized operational actions from the
 * authoritative EDORI OperationalAssessment.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate triggers
 * - Generate independent recommendations
 * - Modify application state
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

    createOperationalAssessment

}

from "../services/OperationalAssessmentService";


import {

    getLatestResult,

    getResultInvalidationReason

}

from "../services/ResultService";


import {

    getSnapshots

}

from "../services/SnapshotService";


import {

    getState,

    hasCommittedAssessment

}

from "../services/StateService";


import type {

    OperationalRecommendation

}

from "../types/OperationalRecommendation";


/**
 * Render the recommendations panel.
 */
export function Recommendations():string {

    return `

        <section class="recommendations-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Recommended Actions
                    </h3>

                    <p class="panel-description">
                        Prioritized actions based on current operational triggers
                    </p>

                </div>


                <span
                    id="recommendationCount"
                    class="recommendation-count"
                >
                    0 actions
                </span>

            </div>


            <div
                id="recommendations-list"
                class="recommendations-list"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize the recommendations panel.
 */
export function initializeRecommendations():void {

    updateRecommendations();


    subscribe(

        APP_EVENTS.RESULT_CHANGED,

        updateRecommendations

    );


    subscribe(

        APP_EVENTS.HISTORICAL_DATA_CHANGED,

        updateRecommendations

    );


    subscribe(

        APP_EVENTS.HISTORY_CHANGED,

        updateRecommendations

    );

}


/**
 * Refresh recommendations from the current
 * authoritative operational assessment.
 */
function updateRecommendations():void {

    const container = document.getElementById(

        "recommendations-list"

    );


    if(!container){

        return;

    }


    const invalidationReason =

        getResultInvalidationReason();


    if(invalidationReason){

        updateRecommendationCount(

            0

        );


        container.innerHTML =

            createRecalculationRequiredState();


        return;

    }


    if(!hasCommittedAssessment()){

        updateRecommendationCount(

            0

        );


        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    const result = getLatestResult();


    if(!result){

        updateRecommendationCount(

            0

        );


        container.innerHTML =

            createAwaitingAssessmentState();


        return;

    }


    try {

        const operationalAssessment =

            createOperationalAssessment({

                assessment:
                    getState(),

                result,

                snapshots:
                    getSnapshots(),

                evaluatedAt:
                    new Date()

            });


        const recommendations =

            operationalAssessment.recommendations;


        updateRecommendationCount(

            recommendations.length

        );


        if(recommendations.length === 0){

            container.innerHTML =

                createRoutineOperationsState();


            return;

        }


        container.innerHTML = recommendations

            .slice()

            .sort(

                compareRecommendations

            )

            .map(

                recommendation =>

                    createRecommendationCard(

                        recommendation

                    )

            )

            .join("");

    }
    catch(error){

        console.error(

            "Unable to update operational recommendations:",

            error

        );


        updateRecommendationCount(

            0

        );


        container.innerHTML = `

            <div class="recommendations-empty-state error">

                <strong>
                    Recommendations unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create one recommendation card.
 */
function createRecommendationCard(

    recommendation:OperationalRecommendation

):string {

    const priorityClass =

        createPriorityClassName(

            recommendation.priority

        );


    const responsibleGroupMarkup =

        recommendation.responsibleGroup

            ? `

                <div class="recommendation-metadata-item">

                    <span>
                        Responsible Group
                    </span>

                    <strong>

                        ${escapeHtml(
                            recommendation.responsibleGroup
                        )}

                    </strong>

                </div>

            `

            : "";


    const reassessmentMarkup =

        recommendation.reassessmentMinutes

            ? `

                <div class="recommendation-metadata-item">

                    <span>
                        Reassess
                    </span>

                    <strong>

                        ${recommendation.reassessmentMinutes}
                        minutes

                    </strong>

                </div>

            `

            : "";


    const sourceMarkup =

        recommendation.sourceIds.length > 0

            ? `

                <div class="recommendation-source">

                    Trigger source:

                    ${recommendation.sourceIds

                        .map(

                            sourceId =>

                                escapeHtml(

                                    formatIdentifier(

                                        sourceId

                                    )

                                )

                        )

                        .join(", ")}

                </div>

            `

            : "";


    return `

        <article
            class="
                recommendation-card
                ${priorityClass}
            "
        >

            <div class="recommendation-card-header">

                <div>

                    <span class="recommendation-priority">

                        ${escapeHtml(
                            recommendation.priority
                        )}

                    </span>


                    <h4>

                        ${escapeHtml(
                            recommendation.title
                        )}

                    </h4>

                </div>


                <span
                    class="
                        recommendation-priority-badge
                        ${priorityClass}
                    "
                >

                    ${escapeHtml(
                        recommendation.priority
                    )}

                </span>

            </div>


            <p class="recommendation-description">

                ${escapeHtml(
                    recommendation.description
                )}

            </p>


            <div class="recommendation-rationale">

                <strong>
                    Why this action is suggested
                </strong>

                <p>

                    ${escapeHtml(
                        recommendation.rationale
                    )}

                </p>

            </div>


            ${responsibleGroupMarkup

                ||

                reassessmentMarkup

                    ? `

                        <div class="recommendation-metadata">

                            ${responsibleGroupMarkup}

                            ${reassessmentMarkup}

                        </div>

                    `

                    : ""

            }


            ${sourceMarkup}

        </article>

    `;

}


/**
 * Order recommendations from highest to lowest
 * operational priority.
 */
function compareRecommendations(

    first:OperationalRecommendation,

    second:OperationalRecommendation

):number {

    const priorityDifference =

        getPriorityRank(

            second.priority

        )

        -

        getPriorityRank(

            first.priority

        );


    if(priorityDifference !== 0){

        return priorityDifference;

    }


    const firstReassessment =

        first.reassessmentMinutes

        ?? Number.MAX_SAFE_INTEGER;


    const secondReassessment =

        second.reassessmentMinutes

        ?? Number.MAX_SAFE_INTEGER;


    return firstReassessment

        -

        secondReassessment;

}


/**
 * Rank recommendation priorities.
 */
function getPriorityRank(

    priority:OperationalRecommendation["priority"]

):number {

    const ranks:Record<

        OperationalRecommendation["priority"],

        number

    > = {

        Routine:
            1,

        Moderate:
            2,

        High:
            3,

        Immediate:
            4

    };


    return ranks[priority];

}


/**
 * Update the action count.
 */
function updateRecommendationCount(

    count:number

):void {

    const element = document.getElementById(

        "recommendationCount"

    );


    if(!element){

        return;

    }


    element.textContent =

        count === 1

            ? "1 action"

            : `${count} actions`;

}


/**
 * Create the initial state.
 */
function createAwaitingAssessmentState():string {

    return `

        <div class="recommendations-empty-state">

            <strong>
                Awaiting assessment
            </strong>

            <p>
                Calculate EDORI to generate operational recommendations.
            </p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState():string {

    return `

        <div class="recommendations-empty-state warning">

            <strong>
                Recalculation required
            </strong>

            <p>
                Submit the current operational assessment to update recommendations.
            </p>

        </div>

    `;

}


/**
 * Create the state shown when no triggers require
 * additional operational action.
 */
function createRoutineOperationsState():string {

    return `

        <div class="recommendations-empty-state routine">

            <strong>
                Continue routine operations
            </strong>

            <p>
                No trigger-based operational actions are currently required.
            </p>

        </div>

    `;

}


/**
 * Convert priority text into a CSS class.
 */
function createPriorityClassName(

    priority:OperationalRecommendation["priority"]

):string {

    return `priority-${priority

        .toLowerCase()

        .replace(

            /[^a-z0-9]+/g,

            "-"

        )}`;

}


/**
 * Convert an identifier into readable text.
 */
function formatIdentifier(

    identifier:string

):string {

    return identifier

        .split("-")

        .filter(

            word => word.length > 0

        )

        .map(

            word =>

                word.charAt(0).toUpperCase()

                +

                word.slice(1)

        )

        .join(" ");

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