/**
 * AssessmentPage
 *
 * Primary EDORI data-entry workspace.
 *
 * Workflow:
 *
 * 1. Enter current operational conditions
 * 2. Review automatic historical context
 * 3. Calculate and save the assessment
 * 4. Review recently saved assessments
 *
 * Current-state interpretation, drivers,
 * recommendations, and forecasting are intentionally
 * kept on other application pages.
 */

import {

    SituationAssessment

}

from "../assessment/SituationAssessment";


import {

    AssessmentHistory

}

from "../AssessmentHistory";


/**
 * Render the Assessment page.
 */
export function AssessmentPage():string {

    return `

        <main
            id="assessmentPage"
            class="
                application-page
                assessment-page
            "
            data-application-page="assessment"
            hidden
        >

            <div class="application-page-heading">

                <div>

                    <span class="application-page-eyebrow">
                        Hospital Readiness
                    </span>


                    <h2>
                        Assessment
                    </h2>


                    <p>
                        Enter the current operational conditions and save a new Hospital Readiness assessment.
                    </p>

                </div>

            </div>


            <section
                class="
                    assessment-workflow-section
                    assessment-workflow-entry
                "
                aria-label="Current Hospital Readiness assessment"
            >

                <div class="assessment-page-entry">

                    ${SituationAssessment()}

                </div>

            </section>


            <section
                class="
                    assessment-workflow-section
                    assessment-workflow-history
                "
                aria-label="Recent Hospital Readiness assessments"
            >

                <div class="assessment-workflow-heading">

                    <div>

                        <span class="assessment-workflow-step">
                            Recent History
                        </span>


                        <h3>
                            Recent Assessments
                        </h3>


                        <p>
                            Review recently saved assessments to confirm the latest score, operational level, and key conditions.
                        </p>

                    </div>

                </div>


                <div class="assessment-page-history">

                    ${AssessmentHistory()}

                </div>

            </section>

        </main>

    `;

}