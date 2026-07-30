/**
 * Gauge
 *
 * Displays current EDORI score.
 */


import { subscribe }
from "../services/EventService";


import { getState }
from "../services/StateService";


import { calculateEdori }
from "../services/EdoriService";




export function Gauge():string {


    return `


    <section class="gauge-container">


        <h3>
            EDORI Score
        </h3>



        <div class="gauge">


            <div

                id="edori-score"

                class="gauge-value"

            >

                0

            </div>


            <div

                id="edori-status"

                class="gauge-status"

            >

                Normal Operations

            </div>


        </div>



    </section>


    `;

}







export function initializeGauge():void {


    updateGauge();



    subscribe(

        "stateChanged",

        updateGauge

    );


}








function updateGauge():void {



    const state =

        getState();





    const result =

        calculateEdori(

            state

        );





    const scoreElement =

        document.getElementById(

            "edori-score"

        );





    const statusElement =

        document.getElementById(

            "edori-status"

        );





    if(scoreElement){

        scoreElement.textContent =

            String(

                Math.round(

                    result.score

                )

            );

    }





    if(statusElement){

        statusElement.textContent =

            result.status;

    }



}