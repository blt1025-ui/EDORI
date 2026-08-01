/**
 * Operational Trigger Development Runner
 *
 * Evaluates configured triggers against the
 * current committed assessment and result.
 */

import {

    evaluateOperationalTriggers

}

from "../services/OperationalTriggerService";


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


export function printOperationalTriggerReport():void {

    if(!hasCommittedAssessment()){

        console.warn(

            "No committed EDORI assessment is available."

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


    const triggerResults =

        evaluateOperationalTriggers({

            assessment:
                getState(),

            result,

            snapshots:
                getSnapshots(),

            evaluatedAt:
                new Date()

        });


    console.group(

        "EDORI Operational Trigger Report"

    );


    console.table(

        triggerResults.map(

            item => ({

                Trigger:
                    item.trigger.title,

                Category:
                    item.trigger.category,

                Priority:
                    item.trigger.priority,

                Active:
                    item.active

                        ? "YES"

                        : "NO",

                Approaching:
                    item.approaching

                        ? "YES"

                        : "NO",

                Proximity:
                    `${Math.round(item.proximityPercent)}%`,

                MinimumState:
                    item.trigger.minimumOperationalState

                    ?? "None",

                Reassess:
                    item.trigger.reassessmentMinutes

                    ? `${item.trigger.reassessmentMinutes} min`

                    : "None"

            })

        )

    );


    const active = triggerResults.filter(

        item => item.active

    );


    const approaching = triggerResults.filter(

        item => item.approaching

    );


    console.log(

        "Active triggers:",

        active.map(

            item => item.trigger.title

        )

    );


    console.log(

        "Approaching triggers:",

        approaching.map(

            item => item.trigger.title

        )

    );


    console.groupEnd();

}