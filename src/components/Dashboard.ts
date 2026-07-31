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


import {
    SummaryStatus,
    initializeSummaryStatus
}
from "./SummaryStatus";


import {
    SummaryCards
}
from "./SummaryCards";


import {
    SituationAssessment,
    initializeSituationAssessment
}
from "./assessment/SituationAssessment";


import {
    Gauge,
    initializeGauge
}
from "./Gauge";


import {
    Drivers,
    initializeDrivers
}
from "./Drivers";


import {
    Recommendations,
    initializeRecommendations
}
from "./Recommendations";


import {
    TrendChart,
    initializeTrendChart
}
from "./TrendChart";


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


import {
    validateState
}
from "../services/ValidationService";


import type {
    SituationAssessment as SituationAssessmentType
}
from "../types/SituationAssessment";





export function Dashboard():string {


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




        <div

        id="assessmentFreshness"

        class="assessment-freshness"

        >

            Assessment not yet calculated.

        </div>



    </div>






    ${SummaryCards()}



    ${SummaryStatus()}







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



    //
    // Input components
    //

    initializeSituationAssessment();




    //
    // Dashboard widgets
    //

    initializeSummaryStatus();


    initializeGauge();


    initializeDrivers();


    initializeRecommendations();


    initializeTrendChart();






    //
    // Initial calculation
    //

    updateDashboard();







    //
    // Listen for committed assessments
    //

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


        updateAssessmentFreshness(

            state

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





    updateAssessmentFreshness(

        state

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

        errors.join(" | ");



}









/**
 * Displays assessment age
 */
function updateAssessmentFreshness(

    state:SituationAssessmentType

):void {



    const element =

        document.getElementById(

            "assessmentFreshness"

        );





    if(!element){

        return;

    }






    if(!state.assessmentTime){


        element.textContent =

            "Assessment not yet calculated.";


        return;


    }







    const assessmentDate =

        new Date(

            state.assessmentTime

        );





    const now =

        new Date();





    const minutes =

        Math.floor(

            (

                now.getTime()

                -

                assessmentDate.getTime()

            )

            /

            60000

        );






    element.textContent =

        `Last calculated ${minutes} minutes ago`;



}