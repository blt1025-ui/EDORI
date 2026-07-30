/**
 * ForecastSection
 *
 * Displays predicted ED conditions
 * based on historical arrival/departure patterns.
 *
 * No manual data entry required.
 */


import { getState }
from "../../services/StateService";


import { calculateForecast }
from "../../services/ForecastService";



import { subscribe }
from "../../services/EventService";





export function ForecastSection(): string {


    return `


    <section class="assessment-section">


        <h3>
            Operational Forecast
        </h3>



        <div class="metric-grid">


            <div class="metric-card">


                <span>
                    Expected Arrivals
                </span>


                <strong id="forecast-arrivals">

                    0

                </strong>


            </div>





            <div class="metric-card">


                <span>
                    Expected Departures
                </span>


                <strong id="forecast-departures">

                    0

                </strong>


            </div>





            <div class="metric-card">


                <span>
                    Projected ED Volume
                </span>


                <strong id="forecast-volume">

                    0

                </strong>


            </div>





            <div class="metric-card">


                <span>
                    Forecast Strain
                </span>


                <strong id="forecast-score">

                    0%

                </strong>


            </div>



        </div>


    </section>


    `;

}







/**
 * Initializes forecast display.
 */
export function initializeForecastSection():void {


    updateForecastDisplay();



    subscribe(

        "stateChanged",

        updateForecastDisplay

    );


}







function updateForecastDisplay():void {



    const state =

        getState();




    const forecast =

        calculateForecast(

            state

        );





    const arrivals =

        document.getElementById(

            "forecast-arrivals"

        );




    const departures =

        document.getElementById(

            "forecast-departures"

        );




    const volume =

        document.getElementById(

            "forecast-volume"

        );




    const score =

        document.getElementById(

            "forecast-score"

        );






    if(arrivals){

        arrivals.textContent =

            String(

                state.expectedArrivals

            );

    }





    if(departures){

        departures.textContent =

            String(

                state.expectedDepartures

            );

    }





    if(volume){

        volume.textContent =

            String(

                forecast.projectedVolume

            );

    }





    if(score){

        score.textContent =

            `${Math.round(

                forecast.forecastScore

            )}%`;

    }


}