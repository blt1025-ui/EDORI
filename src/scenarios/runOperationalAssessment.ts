/**
 * Operational Assessment Development Runner
 */

import {

    createOperationalAssessment

}

from "../services/OperationalAssessmentService";


import {

    getLatestResult

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


export function printOperationalAssessmentReport():void {

    if(!hasCommittedAssessment()){

        console.warn(

            "No committed assessment is available."

        );

        return;

    }


    const result = getLatestResult();


    if(!result){

        console.warn(

            "No current EDORI result is available."

        );

        return;

    }


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


    console.group(

        "EDORI Operational Assessment"

    );


    console.log(

        "Score:",

        operationalAssessment.scoreResult.score

    );


    console.log(

        "Base state:",

        operationalAssessment.baseOperationalState.title

    );


    console.log(

        "Final state:",

        operationalAssessment.finalOperationalState.title

    );


    console.log(

        "Risk direction:",

        operationalAssessment.riskDirection

    );


    console.log(

        "Confidence:",

        operationalAssessment.confidence

    );


    console.table(

        operationalAssessment.pillarDetails.map(

            pillar => ({

                Pillar:
                    pillar.title,

                Score:
                    pillar.score,

                Summary:
                    pillar.summary

            })

        )

    );


    console.log(

        "Active triggers:",

        operationalAssessment.activeTriggers.map(

            result =>

                result.trigger.title

        )

    );


    console.log(

        "Recommendations:",

        operationalAssessment.recommendations.map(

            recommendation =>

                recommendation.title

        )

    );


    console.log(

        "Complete object:",

        operationalAssessment

    );


    console.groupEnd();

}