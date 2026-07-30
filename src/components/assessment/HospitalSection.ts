/**
 * HospitalSection
 *
 * Captures inpatient capacity pressure.
 *
 * Uses:
 *
 * Occupied Medical Beds / 273
 *
 * rather than manually entering hospital occupancy.
 */


import { updateState }
from "../../services/StateService";


import { emit }
from "../../services/EventService";


import { HOSPITAL }
from "../../config/constants";



export function HospitalSection(): string {


    return `


    <section class="assessment-section">


        <h3>
            Hospital Capacity
        </h3>



        <div class="input-grid">


            <div class="input-group">


                <label>
                    Occupied Medical Beds
                </label>


                <input

                    id="edori-medical-beds"

                    type="number"

                    min="0"

                    max="${HOSPITAL.MEDICAL_BEDS}"

                    value="0"

                />


                <small>

                    Medical beds currently occupied

                </small>


            </div>



        </div>





        <div class="metric-display">


            <div>

                Medical Bed Occupancy

                <strong id="edori-medical-occupancy">

                    0%

                </strong>


            </div>


        </div>



    </section>


    `;

}







/**
 * Connects hospital inputs
 * to application state.
 */
export function initializeHospitalSection():void {



    const bedInput =

        document.getElementById(

            "edori-medical-beds"

        ) as HTMLInputElement;




    const occupancyDisplay =

        document.getElementById(

            "edori-medical-occupancy"

        );





    if(!bedInput){

        return;

    }






    function updateHospital(){



        const occupiedBeds =

            Number(

                bedInput.value

            ) || 0;





        updateState({


            occupiedMedicalBeds:

                occupiedBeds


        });






        const occupancy =

            (

                occupiedBeds /

                HOSPITAL.MEDICAL_BEDS

            ) * 100;





        if(occupancyDisplay){


            occupancyDisplay.textContent =

                `${Math.round(occupancy)}%`;


        }





        emit(

            "stateChanged"

        );


    }






    bedInput.addEventListener(

        "input",

        updateHospital

    );


}