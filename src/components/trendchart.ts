/**
 * TrendChart
 *
 * Displays EDORI operational trend.
 *
 * Uses:
 * - Chart.js visualization
 * - Persistent EDORI snapshots
 *
 * Data flow:
 *
 * EdoriService
 *       ↓
 * SnapshotService
 *       ↓
 * TrendService
 *       ↓
 * TrendChart
 */


import {

    Chart,

    LineController,

    LineElement,

    PointElement,

    LinearScale,

    CategoryScale,

    Tooltip,

    Legend

}

from "chart.js";



import {

    getTrendHistory

}

from "../services/TrendService";



import {

    subscribe

}

from "../services/EventService";



import {

    getState

}

from "../services/StateService";



import {

    calculateEdori

}

from "../services/EdoriService";






let chart:Chart | null = null;









export function TrendChart():string {


    return `


<section class="trend-container">


<h3>
EDORI Trend
</h3>



<div class="trend-chart-wrapper">


<canvas

id="edoriTrendChart"

></canvas>


</div>




<div

id="trend-summary"

class="trend-summary"

>

Awaiting assessment data.

</div>



</section>


`;

}









export function initializeTrendChart():void {


    Chart.register(

        LineController,

        LineElement,

        PointElement,

        LinearScale,

        CategoryScale,

        Tooltip,

        Legend

    );




    updateTrend();





    subscribe(

        "stateChanged",

        updateTrend

    );


}









function updateTrend():void {



    /*
     * Trigger EDORI calculation.
     *
     * Snapshot creation occurs
     * inside EdoriService.
     */

    calculateEdori(

        getState()

    );



    renderChart();



}









function renderChart():void {



    const canvas =

        document.getElementById(

            "edoriTrendChart"

        ) as HTMLCanvasElement | null;





    if(!canvas){

        return;

    }







    const history =

        getTrendHistory();






    if(chart){


        chart.destroy();


    }








    chart = new Chart(

        canvas,

        {


            type:"line",



            data:{


                labels:

                    history.map(

                        point =>

                        point.timestamp

                        .toLocaleTimeString(

                            [],

                            {

                                hour:"2-digit",

                                minute:"2-digit"

                            }

                        )

                    ),



                datasets:[

                    {

                        label:

                        "EDORI Score",


                        data:

                        history.map(

                            point =>

                            point.score

                        ),



                        tension:.3,


                        borderWidth:3,


                        pointRadius:5


                    }

                ]

            },




            options:{


                responsive:true,


                maintainAspectRatio:false,



                scales:{


                    y:{


                        min:0,


                        max:100


                    }


                },



                plugins:{


                    legend:{


                        display:true


                    }


                }



            }


        }

    );





    updateTrendSummary();

}









function updateTrendSummary():void {



    const container =

        document.getElementById(

            "trend-summary"

        );





    if(!container){

        return;

    }






    const history =

        getTrendHistory();






    if(history.length === 0){


        container.textContent =

            "No EDORI assessments recorded.";


        return;


    }







    const current =

        history[

            history.length - 1

        ];







    if(history.length === 1){


        container.textContent =


        `Current Score: ${current.score}`;



        return;


    }







    const previous =

        history[

            history.length - 2

        ];







    let trend =

        "Stable";





    if(current.score > previous.score){


        trend =

        "Increasing";


    }






    if(current.score < previous.score){


        trend =

        "Improving";


    }







    container.textContent =


    `Current Score: ${current.score} | Trend: ${trend}`;



}