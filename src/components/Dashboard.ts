/**
 * Dashboard
 *
 * Main EDORI operational dashboard.
 *
 * Connects:
 *
 * Situation Assessment
 *        ↓
 * State Service
 *        ↓
 * Validation
 *        ↓
 * EDORI Calculation Engine
 *        ↓
 * Dashboard Displays
 */


import { SummaryCards }
from "./SummaryCards";


import { SituationAssessment }
from "./assessment/SituationAssessment";


import { Gauge }
from "./Gauge";


import { Drivers }
from "./Drivers";


import { Recommendations }
from "./Recommendations";


import { TrendChart }
from "./TrendChart";



import { initializeSituationAssessment }
from "./assessment/SituationAssessment";


import { initializeGauge }
from "./Gauge";


import { initializeDrivers }
from "./Drivers";


import { initializeRecommendations }
from "./Recommendations";


import { initializeTrendChart }
from "./TrendChart";



import { subscribe }
from "../services/EventService";


import { getState }
from "../services/StateService";


import { calculateEdori }
from "../services/EdoriService";


import { validateState }
from "../services/ValidationService";





export function Dashboard(): string {


    return `


    <main class="dashboard">



        <div class="dashboard-header">


            <div

                id="statusBanner"

                class="status-banner"

            >

                Normal Operations

            </div>



            <h2>

                Emergency Department Dashboard

            </h2>



            <p>

                Operational Readiness Overview

            </p>



        </div>





        ${SummaryCards()}





        <div class="dashboard-grid">



            <div class="left-column">


                ${SituationAssessment()}


            </div>





            <div class="right-column">


                ${Gauge()}


                ${Drivers()}


                ${Recommendations()}


                ${TrendChart()}


            </div>



        </div>



    </main>


    `;

}








/**
 * Initializes dashboard functionality
 */
export function initializeDashboard():void {



    /*
     * Start assessment inputs
     */

    initializeSituationAssessment();




    /*
     * Start dashboard displays
     */

    initializeGauge();


    initializeDrivers();


    initializeRecommendations();


    initializeTrendChart();





    /*
     * Initial calculation
     */

    updateDashboard();





    /*
     * Listen for changes
     */

    subscribe(

        "stateChanged",

        updateDashboard

    );


}









/**
 * Recalculates EDORI
 * and updates dashboard status
 */
function updateDashboard():void {



    const state =

        getState();





    const validation =

        validateState(

            state

        );





    if(!validation.valid){


        showValidationErrors(

            validation.errors

        );


        return;


    }






    const result =

        calculateEdori(

            state

        );





    updateStatusBanner(

        result.status

    );



}









/**
 * Updates top status indicator
 */
function updateStatusBanner(

    status:string

):void {



    const banner =

        document.getElementById(

            "statusBanner"

        );





    if(!banner){

        return;

    }





    banner.textContent = status;



}








/**
 * Displays validation problems
 */
function showValidationErrors(

    errors:string[]

):void {



    const banner =

        document.getElementById(

            "statusBanner"

        );





    if(!banner){

        return;

    }





    banner.textContent =

        errors.join(

            " | "

        );



}