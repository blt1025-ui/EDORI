/**
 * ComplexitySection
 *
 * Captures patient acuity distribution.
 *
 * Uses Emergency Severity Index (ESI)
 * categories to estimate clinical complexity.
 */


import { updateState }
from "../../services/StateService";


import { emit }
from "../../services/EventService";



export function ComplexitySection(): string {


    return `


    <section class="assessment-section">


        <h3>
            Patient Acuity
        </h3>



        <div class="input-grid">



            ${createESIInput(
                "ESI 1",
                "edori-esi1"
            )}


            ${createESIInput(
                "ESI 2",
                "edori-esi2"
            )}


            ${createESIInput(
                "ESI 3",
                "edori-esi3"
            )}


            ${createESIInput(
                "ESI 4",
                "edori-esi4"
            )}


            ${createESIInput(
                "ESI 5",
                "edori-esi5"
            )}



        </div>


    </section>


    `;

}






function createESIInput(

    label:string,

    id:string

):string {


    return `


    <div class="input-group">


        <label>

            ${label}

        </label>


        <input

            id="${id}"

            type="number"

            min="0"

            value="0"

        />


    </div>


    `;


}







/**
 * Connects acuity inputs
 * to application state.
 */
export function initializeComplexitySection():void {



    const esiInputs = {


        esi1:

            document.getElementById(
                "edori-esi1"
            ) as HTMLInputElement,


        esi2:

            document.getElementById(
                "edori-esi2"
            ) as HTMLInputElement,


        esi3:

            document.getElementById(
                "edori-esi3"
            ) as HTMLInputElement,


        esi4:

            document.getElementById(
                "edori-esi4"
            ) as HTMLInputElement,


        esi5:

            document.getElementById(
                "edori-esi5"
            ) as HTMLInputElement

    };





    function updateAcuity(){



        updateState({


            esi1:

                Number(
                    esiInputs.esi1.value
                ) || 0,



            esi2:

                Number(
                    esiInputs.esi2.value
                ) || 0,



            esi3:

                Number(
                    esiInputs.esi3.value
                ) || 0,



            esi4:

                Number(
                    esiInputs.esi4.value
                ) || 0,



            esi5:

                Number(
                    esiInputs.esi5.value
                ) || 0


        });





        emit(

            "stateChanged"

        );


    }





    Object.values(

        esiInputs

    ).forEach(

        input => {


            if(input){

                input.addEventListener(

                    "input",

                    updateAcuity

                );

            }


        }

    );


}