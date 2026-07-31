/**
 * AssessmentHistory
 *
 * Displays recent EDORI assessments.
 */


import {

    getSnapshots

}

from "../services/SnapshotService";



import {

    subscribe

}

from "../services/EventService";








export function AssessmentHistory():string {


    return `


<section class="history-container">


<h3>
Assessment History
</h3>



<div id="history-table">


No assessments available.


</div>



</section>


`;

}









export function initializeAssessmentHistory():void {


    updateHistory();



    subscribe(

        "stateChanged",

        updateHistory

    );


}









function updateHistory():void {


    const container =

        document.getElementById(

            "history-table"

        );





    if(!container){

        return;

    }







    const snapshots =

        getSnapshots()

        .slice()

        .reverse()

        .slice(0,10);







    if(snapshots.length===0){


        container.innerHTML =

        "No assessments available.";


        return;


    }







    container.innerHTML = `



<table class="history-table">


<thead>

<tr>

<th>
Time
</th>

<th>
Score
</th>

<th>
Status
</th>

</tr>

</thead>



<tbody>


${

snapshots.map(

snapshot =>


`

<tr>


<td>

${

snapshot.timestamp

.toLocaleTimeString()

}

</td>


<td>

${

snapshot.score

}

</td>



<td>

${

snapshot.status

}

</td>



</tr>


`

)

.join("")

}



</tbody>


</table>



`;

}