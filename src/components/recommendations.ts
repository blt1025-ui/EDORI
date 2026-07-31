/**
 * Recommendations
 *
 * Displays prioritized operational actions
 * from the latest submitted EDORI result.
 *
 * This component does not calculate EDORI.
 * It reads the authoritative result from
 * ResultService.
 */

import {

    subscribe

}

from "../services/EventService";


import {

    getLatestResult

}

from "../services/ResultService";


import {

    generateRecommendations

}

from "../services/RecommendationService";


interface RecommendationPriority {

    label:string;

    className:string;

    icon:string;

}


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
                        Operational actions based on the current assessment
                    </p>

                </div>

            </div>


            <div id="recommendations-list">

                <div class="recommendations-empty-state">

                    <span class="empty-state-icon">
                        …
                    </span>

                    <p>
                        Complete and calculate an assessment to generate recommendations.
                    </p>

                </div>

            </div>

        </section>

    `;

}


/**
 * Initialize recommendation display.
 */
export function initializeRecommendations():void {

    updateRecommendations();


    subscribe(

        "resultChanged",

        updateRecommendations

    );

}


/**
 * Display recommendations from the latest result.
 */
function updateRecommendations():void {

    const container = document.getElementById(

        "recommendations-list"

    );


    if(!container){

        return;

    }


    const result = getLatestResult();


    if(!result){

        renderAwaitingAssessment(

            container

        );

        return;

    }


    const recommendations = generateRecommendations(

        result.score,

        result.drivers

    );


    if(recommendations.length === 0){

        renderNoRecommendations(

            container

        );

        return;

    }


    container.innerHTML = recommendations

        .map(

            (

                recommendation,

                index

            ) => createRecommendationCard(

                recommendation,

                index,

                result.score

            )

        )

        .join("");

}


/**
 * Build one recommendation card.
 */
function createRecommendationCard(

    recommendation:string,

    index:number,

    score:number

):string {

    const priority = getRecommendationPriority(

        score,

        index

    );


    return `

        <article
            class="recommendation-card ${priority.className}"
        >

            <div class="recommendation-order">

                ${index + 1}

            </div>


            <div class="recommendation-content">

                <div class="recommendation-heading">

                    <span
                        class="recommendation-priority-icon"
                        aria-hidden="true"
                    >

                        ${priority.icon}

                    </span>


                    <span class="recommendation-priority-label">

                        ${priority.label}

                    </span>

                </div>


                <p class="recommendation-text">

                    ${escapeHtml(recommendation)}

                </p>

            </div>

        </article>

    `;

}


/**
 * Assign priority based on score and action order.
 */
function getRecommendationPriority(

    score:number,

    index:number

):RecommendationPriority {

    if(score >= 85){

        if(index === 0){

            return {

                label:"Immediate action",

                className:"recommendation-immediate",

                icon:"!"

            };

        }


        return {

            label:"High priority",

            className:"recommendation-high",

            icon:"●"

        };

    }


    if(score >= 70){

        if(index === 0){

            return {

                label:"High priority",

                className:"recommendation-high",

                icon:"!"

            };

        }


        return {

            label:"Priority action",

            className:"recommendation-priority",

            icon:"●"

        };

    }


    if(score >= 40){

        if(index === 0){

            return {

                label:"Priority action",

                className:"recommendation-priority",

                icon:"●"

            };

        }


        return {

            label:"Recommended action",

            className:"recommendation-routine",

            icon:"●"

        };

    }


    return {

        label:"Routine action",

        className:"recommendation-routine",

        icon:"✓"

    };

}


/**
 * Display the pre-calculation state.
 */
function renderAwaitingAssessment(

    container:HTMLElement

):void {

    container.innerHTML = `

        <div class="recommendations-empty-state">

            <span class="empty-state-icon">
                …
            </span>

            <p>
                Complete and calculate an assessment to generate recommendations.
            </p>

        </div>

    `;

}


/**
 * Display when no additional action is needed.
 */
function renderNoRecommendations(

    container:HTMLElement

):void {

    container.innerHTML = `

        <div
            class="
                recommendations-empty-state
                recommendations-empty-success
            "
        >

            <span class="empty-state-icon">
                ✓
            </span>

            <p>
                No additional operational actions are recommended.
            </p>

        </div>

    `;

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