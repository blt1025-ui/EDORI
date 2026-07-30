/**
 * TrendChart
 *
 * Displays EDORI operational trend.
 *
 * Initial version:
 * - Stores recent EDORI scores
 * - Displays trend direction
 *
 * Future:
 * - Historical database integration
 * - Predictive modeling
 */


import { subscribe }
from "../services/EventService";


import { getState }
from "../services/StateService";


import { calculateEdori }
from "../services/EdoriService";





const trendHistory:number[] = [];





export function TrendChart():string {


    return `


    <section class="trend-container">


        <h3>
            EDORI Trend
        </h3>



        <div id="trend-display">


            <p>
                No trend data available.
            </p>


        </div>



    </section>


    `;

}







export function initializeTrendChart():void {


    updateTrend();



    subscribe(

        "stateChanged",

        updateTrend

    );


}








function updateTrend():void {



    const container =

        document.getElementById(

            "trend-display"

        );





    if(!container){

        return;

    }





    const state =

        getState();





    const result =

        calculateEdori(

            state

        );





    trendHistory.push(

        result.score

    );





    /*
     * Keep last 10 values
     */

    if(

        trendHistory.length > 10

    ){

        trendHistory.shift();

    }






    const current =

        Math.round(

            result.score

        );





    const previous =

        trendHistory.length > 1

        ?

        Math.round(

            trendHistory[

                trendHistory.length - 2

            ]

        )

        :

        current;







    let direction =

        "Stable";





    if(current > previous){

        direction =

            "Increasing";

    }





    if(current < previous){

        direction =

            "Improving";

    }







    container.innerHTML =


    `


    <div class="trend-summary">


        <strong>

            Current Score:

        </strong>

        ${current}



        <br>



        <strong>

            Trend:

        </strong>

        ${direction}



    </div>



    <div class="trend-history">


        ${

            trendHistory

            .map(

                value =>

                `

                <span>

                    ${Math.round(value)}

                </span>

                `

            )

            .join("")

        }


    </div>


    `;



}