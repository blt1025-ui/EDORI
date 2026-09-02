/**
 * Recommendations
 *
 * Displays prioritized operational actions from the
 * authoritative OperationalAssessment in a concise
 * operational action-center format.
 *
 * This component does not:
 *
 * - Calculate EDORI
 * - Evaluate triggers
 * - Estimate intervention effectiveness
 * - Modify application state
 * - Save results or snapshots
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

    OperationalAssessment

}

from "../types/OperationalAssessment";


import type {

    OperationalRecommendation

}

from "../types/OperationalRecommendation";


/**
 * Maximum number of actions displayed in condensed
 * lower-priority sections.
 *
 * Immediate and High-priority actions are always
 * shown in full. Moderate and Routine sections remain
 * condensed to keep the page manageable.
 */
const MAXIMUM_CONDENSED_ACTIONS_PER_SECTION = 6;


/**
 * Action-center priority order.
 */
const PRIORITY_ORDER:

OperationalRecommendation["priority"][] = [

    "Immediate",

    "High",

    "Moderate",

    "Routine"

];


/**
 * Render the Recommended Actions panel.
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
                        Prioritized actions, ownership, and reassessment timing
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
                id="recommendationsContent"
                class="recommendations-content"
                aria-live="polite"
            >

                ${createAwaitingAssessmentState()}

            </div>

        </section>

    `;

}


/**
 * Initialize recommendation-panel behavior.
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
 * Refresh recommendations from authoritative
 * application services.
 */
function updateRecommendations():void {

    const container = document.getElementById(

        "recommendationsContent"

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

            createRecalculationRequiredState(

                invalidationReason

            );


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


        container.innerHTML =

            createActionCenterMarkup(

                operationalAssessment

            );

    }
    catch(error){

        console.error(

            "Unable to update recommended actions:",

            error

        );


        updateRecommendationCount(

            0

        );


        container.innerHTML = `

            <div class="recommendations-empty-state error">

                <strong>
                    Recommended actions unavailable
                </strong>

                <p>
                    Review the browser console for additional details.
                </p>

            </div>

        `;

    }

}


/**
 * Create the completed Action Center.
 *
 * The summary focuses on actionable information:
 * total actions, immediate actions, and the shortest
 * reassessment interval.
 */
function createActionCenterMarkup(

    operationalAssessment:OperationalAssessment

):string {

    const recommendations =

        operationalAssessment.recommendations

            .slice()

            .sort(

                compareRecommendations

            );


    updateRecommendationCount(

        recommendations.length

    );


    if(recommendations.length === 0){

        return createRoutineState();

    }


    const shortestReassessment =

        determineShortestReassessment(

            recommendations

        );


    const immediateCount = recommendations.filter(

        recommendation =>

            recommendation.priority === "Immediate"

    ).length;



    return `

        <div class="action-center-summary">

            <div class="action-center-summary-item">

                <span>
                    Total Actions
                </span>

                <strong>
                    ${recommendations.length}
                </strong>

            </div>


            <div class="action-center-summary-item">

                <span>
                    Immediate
                </span>

                <strong>
                    ${immediateCount}
                </strong>

            </div>


            <div class="action-center-summary-item">

                <span>
                    Next Reassessment
                </span>

                <strong>

                    ${shortestReassessment === null

                        ? "Routine"

                        : `${shortestReassessment} min`

                    }

                </strong>

            </div>




        </div>


        <div class="action-center-sections">

            ${PRIORITY_ORDER

                .map(

                    priority => {

                        const matchingRecommendations =

                            recommendations.filter(

                                recommendation =>

                                    recommendation.priority

                                    ===

                                    priority

                            );


                        if(

                            matchingRecommendations.length

                            ===

                            0

                        ){

                            return "";

                        }


                        return createPrioritySection(

                            priority,

                            matchingRecommendations

                        );

                    }

                )

                .join("")}

        </div>

    `;

}


/**
 * Create one recommendation-priority section.
 */
function createPrioritySection(

    priority:OperationalRecommendation["priority"],

    recommendations:OperationalRecommendation[]

):string {

    const showAllRecommendations =

        priority === "Immediate"

        ||

        priority === "High";


    const visibleRecommendations =

        showAllRecommendations

            ? recommendations

            : recommendations.slice(

                0,

                MAXIMUM_CONDENSED_ACTIONS_PER_SECTION

            );


    const hiddenCount =

        showAllRecommendations

            ? 0

            : Math.max(

                0,

                recommendations.length

                -

                visibleRecommendations.length

            );


    return `

        <section
            class="
                action-center-section
                action-center-section-${createPriorityClass(
                    priority
                )}
            "
        >

            <div class="action-center-section-header">

                <div>

                    <span class="action-center-section-kicker">

                        ${escapeHtml(
                            createPriorityKicker(
                                priority
                            )
                        )}

                    </span>


                    <h4>

                        ${escapeHtml(
                            createPriorityHeading(
                                priority
                            )
                        )}

                    </h4>

                </div>


                <span class="action-center-section-count">

                    ${recommendations.length}

                </span>

            </div>


            <div class="action-center-list">

                ${visibleRecommendations

                    .map(

                        (

                            recommendation,

                            index

                        ) =>

                            createActionCard(

                                recommendation,

                                index + 1

                            )

                    )

                    .join("")}

            </div>


            ${hiddenCount > 0

                ? `

                    <div class="action-center-additional">

                        ${hiddenCount}

                        additional

                        ${escapeHtml(
                            priority.toLowerCase()
                        )}

                        ${hiddenCount === 1

                            ? "action is"

                            : "actions are"

                        }

                        not shown in this condensed view.

                    </div>

                `

                : ""

            }

        </section>

    `;

}


/**
 * Create one action card.
 */
function createActionCard(

    recommendation:OperationalRecommendation,

    position:number

):string {

    const priorityClass = createPriorityClass(

        recommendation.priority

    );


    const responsibleGroup = normalizeOptionalText(

        recommendation.responsibleGroup

    );


    const rationale = normalizeOptionalText(

        recommendation.rationale

    );




    return `

        <article
            class="
                action-center-card
                action-center-card-${priorityClass}
            "
        >

            <div class="action-center-card-number">

                ${position}

            </div>


            <div class="action-center-card-body">

                <div class="action-center-card-header">

                    <div class="action-center-title-group">

                        <span
                            class="
                                action-center-priority-badge
                                action-center-priority-${priorityClass}
                            "
                        >

                            ${escapeHtml(
                                recommendation.priority
                            )}

                        </span>


                        <h5>

                            ${escapeHtml(
                                recommendation.title
                            )}

                        </h5>

                    </div>


                </div>


                <p class="action-center-description">

                    ${escapeHtml(
                        recommendation.description
                    )}

                </p>


                <div class="action-center-owner-row">

                    <span>
                        Owner
                    </span>


                    <strong>

                        ${escapeHtml(
                            responsibleGroup

                            ?? "Local operational leadership"
                        )}

                    </strong>

                </div>


                ${rationale

                    ? `

                        <div class="action-center-rationale">

                            <strong>
                                Why now
                            </strong>

                            <p>

                                ${escapeHtml(
                                    rationale
                                )}

                            </p>

                        </div>

                    `

                    : ""

                }


            </div>

        </article>

    `;

}


/**
 * Sort actions by priority and reassessment time.
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


    const firstInterval =

        normalizeReassessmentInterval(

            first.reassessmentMinutes

        );


    const secondInterval =

        normalizeReassessmentInterval(

            second.reassessmentMinutes

        );


    if(firstInterval !== secondInterval){

        return firstInterval

            -

            secondInterval;

    }


    return first.title.localeCompare(

        second.title

    );

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
 * Normalize reassessment time for sorting.
 */
function normalizeReassessmentInterval(

    value:number | null

):number {

    if(

        value === null

        ||

        !Number.isFinite(value)

        ||

        value <= 0

    ){

        return Number.MAX_SAFE_INTEGER;

    }


    return value;

}


/**
 * Determine the shortest recommendation interval.
 */
function determineShortestReassessment(

    recommendations:OperationalRecommendation[]

):number | null {

    const intervals = recommendations

        .map(

            recommendation =>

                recommendation.reassessmentMinutes

        )

        .filter(

            (

                value

            ):value is number =>

                value !== null

                &&

                Number.isFinite(value)

                &&

                value > 0

        );


    if(intervals.length === 0){

        return null;

    }


    return Math.round(

        Math.min(

            ...intervals

        )

    );

}


/**
 * Convert priority into a CSS-friendly class.
 */
function createPriorityClass(

    priority:OperationalRecommendation["priority"]

):"routine" | "moderate" | "high" | "immediate" {

    return priority.toLowerCase() as

        | "routine"

        | "moderate"

        | "high"

        | "immediate";

}


/**
 * Create the user-facing priority heading.
 */
function createPriorityHeading(

    priority:OperationalRecommendation["priority"]

):string {

    switch(priority){

        case "Immediate":

            return "Immediate Actions";


        case "High":

            return "High-Priority Actions";


        case "Moderate":

            return "Moderate-Priority Actions";


        case "Routine":

            return "Routine Actions";

    }

}


/**
 * Create the priority section kicker.
 */
function createPriorityKicker(

    priority:OperationalRecommendation["priority"]

):string {

    switch(priority){

        case "Immediate":

            return "Act Now";


        case "High":

            return "Escalated Response";


        case "Moderate":

            return "Operational Mitigation";


        case "Routine":

            return "Ongoing Management";

    }

}


/**
 * Normalize optional text values.
 */
function normalizeOptionalText(

    value:unknown

):string | null {

    if(typeof value !== "string"){

        return null;

    }


    const normalized = value.trim();


    return normalized.length > 0

        ? normalized

        : null;

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


    element.textContent = count === 1

        ? "1 action"

        : `${count} actions`;

}


/**
 * Create the routine state.
 */
function createRoutineState():string {

    return `

        <div class="recommendations-empty-state routine">

            <strong>
                Continue routine operations
            </strong>

            <p>
                No trigger-based operational intervention is currently recommended.
            </p>

        </div>

    `;

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
    Calculate HRI to generate prioritized operational actions.
</p>

        </div>

    `;

}


/**
 * Create the recalculation-required state.
 */
function createRecalculationRequiredState(

    reason:string

):string {

    return `

        <div class="recommendations-empty-state warning">

            <strong>
                Recalculation required
            </strong>

            <p>

                ${escapeHtml(
                    reason
                )}

            </p>

        </div>

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