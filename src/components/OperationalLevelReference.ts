/**
 * OperationalLevelReference
 *
 * Displays the configured Alpha–Echo operational
 * levels, numerical score ranges, colors, and
 * descriptions.
 *
 * The component reads directly from
 * OPERATIONAL_STATES and performs no calculations.
 */

import {

    OPERATIONAL_STATES

}

from "../config/operationalStates";


/**
 * Render the Alpha–Echo level reference.
 */
export function OperationalLevelReference():string {

    return `

        <section class="operational-level-reference-container">

            <div class="panel-header">

                <div>

                    <h3>
                        Operational Level Reference
                    </h3>

                    <p class="panel-description">
                        Alpha through Echo surge-level definitions
                    </p>

                </div>

            </div>


            <div class="operational-level-reference-list">

                ${OPERATIONAL_STATES

                    .map(

                        state =>

                            createOperationalLevelRow(

                                state

                            )

                    )

                    .join("")}

            </div>

        </section>

    `;

}


/**
 * No runtime initialization is currently required.
 *
 * This function is provided to keep the component
 * interface consistent with other dashboard
 * components.
 */
export function initializeOperationalLevelReference():void {

    return;

}


/**
 * Create one configured operational-level row.
 */
function createOperationalLevelRow(

    state:(typeof OPERATIONAL_STATES)[number]

):string {

    return `

        <article
            class="operational-level-reference-row"
            style="
                --reference-level-color:
                ${escapeAttribute(
                    state.color
                )};
            "
        >

            <div class="operational-level-reference-indicator">

                <span
                    class="operational-level-reference-icon"
                    aria-hidden="true"
                >

                    ${escapeHtml(
                        state.icon
                    )}

                </span>

            </div>


            <div class="operational-level-reference-main">

                <div class="operational-level-reference-heading">

                    <strong>

                        ${escapeHtml(
                            state.title
                        )}

                    </strong>


                    <span>

                        ${state.minimum}–${state.maximum}

                    </span>

                </div>


                <p class="operational-level-reference-description">

                    ${escapeHtml(
                        state.description
                    )}

                </p>


                <p class="operational-level-reference-guidance">

                    ${escapeHtml(
                        state.recommendation
                    )}

                </p>

            </div>

        </article>

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


/**
 * Escape text inserted into HTML attributes.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}