/**
 * ResourcesSection
 *
 * Captures current clinical resources.
 *
 * Clinical capacity is evaluated using:
 *
 * RN staffing
 * +
 * Physician staffing
 *
 * in relation to:
 *
 * ED volume
 * +
 * patient acuity
 */


import { updateState }
from "../../services/StateService";


import { emit }
from "../../services/EventService";



export function ResourcesSection(): string {


    return `


    <section class="assessment-section">


        <h3>
            Clinical Resources
        </h3>




        <div class="input-grid">



            <div class="input-group">


                <label>
                    Current RN Staffing
                </label>


                <input

                    id="edori-current-rn"

                    type="number"

                    min="0"

                    value="0"

                />


                <small>
                    Registered nurses currently assigned
                </small>


            </div>





            <div class="input-group">


                <label>
                    Current Physician Staffing
                </label>


                <input

                    id="edori-current-md"

                    type="number"

                    min="0"

                    value="0"

                />


                <small>
                    Physicians or equivalent providers currently assigned
                </small>


            </div>



        </div>


    </section>


    `;

}







/**
 * Connect resource inputs
 * to application state.
 */
export function initializeResourcesSection():void {



    const rnInput =

        document.getElementById(

            "edori-current-rn"

        ) as HTMLInputElement;





    const mdInput =

        document.getElementById(

            "edori-current-md"

        ) as HTMLInputElement;






    if(

        !rnInput ||

        !mdInput

    ){

        return;

    }







    function updateResources(){



        const currentRN =

            Number(

                rnInput.value

            ) || 0;





        const currentMD =

            Number(

                mdInput.value

            ) || 0;






        updateState({


            currentRN,


            currentMD


        });






        emit(

            "stateChanged"

        );


    }






    rnInput.addEventListener(

        "input",

        updateResources

    );





    mdInput.addEventListener(

        "input",

        updateResources

    );



}