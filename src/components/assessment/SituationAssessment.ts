/**
 * SituationAssessment
 *
 * Main EDORI data entry panel.
 *
 * Collects:
 * - ED demand
 * - Boarding volume
 * - Hospital capacity
 * - Staffing
 * - Patient acuity
 *
 * Workflow:
 *
 * User enters data
 *        ↓
 * Draft assessment
 *        ↓
 * Calculate EDORI button
 *        ↓
 * Commit assessment
 *        ↓
 * EDORI recalculation
 */


import {

    updateDraft,

    submitAssessment

}

from "../../services/AssessmentService";


import {

    updateState

}

from "../../services/StateService";


import {

    emit

}

from "../../services/EventService";





export function SituationAssessment(): string {


    return `


<section class="situation-assessment">


<h2>
Situation Assessment
</h2>





<div class="assessment-section">


<h3>
ED Demand
</h3>


<div class="input-grid">



<div class="input-group">


<label>
Total ED Volume
</label>


<input

id="totalEDVolume"

type="number"

min="0"

value="0"

/>


</div>







<div class="input-group">


<label>
Boarding Patients
</label>


<input

id="boardedPatients"

type="number"

min="0"

value="0"

/>


</div>


</div>


</div>









<div class="assessment-section">


<h3>
Hospital Capacity
</h3>


<div class="input-grid">


<div class="input-group">


<label>
Occupied Medical Beds
</label>


<input

id="occupiedMedicalBeds"

type="number"

min="0"

max="273"

value="0"

/>


</div>


</div>


</div>









<div class="assessment-section">


<h3>
Clinical Resources
</h3>


<div class="input-grid">



<div class="input-group">


<label>
Registered Nurses
</label>


<input

id="currentRN"

type="number"

min="0"

value="0"

/>


</div>







<div class="input-group">


<label>
Physicians / Providers
</label>


<input

id="currentMD"

type="number"

min="0"

value="0"

/>


</div>


</div>


</div>









<div class="assessment-section">


<h3>
Patient Acuity Distribution
</h3>


<div class="input-grid">


${createESIInput(1)}

${createESIInput(2)}

${createESIInput(3)}

${createESIInput(4)}

${createESIInput(5)}


</div>


</div>







<div class="assessment-actions">


<button

id="calculateEdoriButton"

class="calculate-button"

>

Calculate EDORI

</button>




<p

id="assessmentMessage"

>

Enter all operational data then calculate.

</p>


</div>





</section>


`;

}









function createESIInput(

    level:number

):string {


    return `


<div class="input-group">


<label>

ESI ${level}

</label>


<input

id="esi${level}"

type="number"

min="0"

value="0"

/>


</div>


`;

}









export function initializeSituationAssessment():void {



    const fields = [


        "totalEDVolume",

        "boardedPatients",

        "occupiedMedicalBeds",

        "currentRN",

        "currentMD",

        "esi1",

        "esi2",

        "esi3",

        "esi4",

        "esi5"


    ];









    fields.forEach(

        (field)=>{


            const element =

                document.getElementById(

                    field

                ) as HTMLInputElement | null;





            if(!element){

                return;

            }








            element.addEventListener(

                "input",

                ()=>{


                    updateDraft(

                        field,

                        Number(

                            element.value

                        )

                    );


                }

            );


        }

    );









    const button =

        document.getElementById(

            "calculateEdoriButton"

        );





    if(button){


        button.addEventListener(

            "click",

            ()=>{


                const assessment =

                    submitAssessment();





                const message =

                    document.getElementById(

                        "assessmentMessage"

                    );







                if(!assessment){


                    if(message){


                        message.textContent =

                        "Please complete all fields before calculating.";


                    }


                    return;


                }







                updateState(

                    assessment

                );







                emit(

                    "stateChanged"

                );








                if(message){


                    message.textContent =

                    "EDORI calculated successfully.";


                }



            }

        );


    }


}