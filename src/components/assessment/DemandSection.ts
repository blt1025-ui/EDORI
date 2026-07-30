/**
 * DemandSection
 *
 * Captures current emergency department demand.
 *
 * ED Demand Inputs:
 * - Total ED volume
 * - Boarding patients
 *
 * ED occupancy is calculated using:
 *
 * Total ED Volume / 63 ED beds
 */


import { updateState }
from "../../services/StateService";


import { emit }
from "../../services/EventService";


import { HOSPITAL }
from "../../config/constants";



export function DemandSection(): string {


    return `


    <section class="assessment-section">


        <h3>
            ED Demand
        </h3>



        <div class="input-grid">



            <div class="input-group">


                <label>
                    Total ED Volume
                </label>


                <input

                    id="edori-total-volume"

                    type="number"

                    min="0"

                    value="0"

                />


                <small>
                    Current patients physically in the ED
                </small>


            </div>





            <div class="input-group">


                <label>
                    Boarding Patients
                </label>


                <input

                    id="edori-boarders"

                    type="number"

                    min="0"

                    value="0"

                />


                <small>
                    Admitted patients awaiting inpatient beds
                </small>


            </div>



        </div>





        <div class="metric-display">


            <div>

                ED Occupancy

                <strong id="edori-ed-occupancy">

                    0%

                </strong>


            </div>



        </div>



    </section>


    `;

}






/**
 * Connects input fields
 * to application state.
 */
export function initializeDemandSection():void {



    const volumeInput =

        document.getElementById(

            "edori-total-volume"

        ) as HTMLInputElement;




    const boarderInput =

        document.getElementById(

            "edori-boarders"

        ) as HTMLInputElement;





    const occupancyDisplay =

        document.getElementById(

            "edori-ed-occupancy"

        );





    if(

        !volumeInput ||

        !boarderInput

    ){

        return;

    }





    function updateDemand(){



        const volume =

            Number(

                volumeInput.value

            ) || 0;




        const boarders =

            Number(

                boarderInput.value

            ) || 0;





        updateState({


            totalEDVolume:

                volume,



            boardedPatients:

                boarders


        });





        /*
         * Calculate ED occupancy
         */

        const occupancy =

            (

                volume /

                HOSPITAL.ED_BEDS

            ) * 100;





        if(occupancyDisplay){


            occupancyDisplay.textContent =

                `${Math.round(occupancy)}%`;


        }





        emit(

            "stateChanged"

        );



    }





    volumeInput.addEventListener(

        "input",

        updateDemand

    );




    boarderInput.addEventListener(

        "input",

        updateDemand

    );


}