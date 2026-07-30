/**
 * TimeSection
 *
 * User interface component for selecting
 * the operational day and hour.
 *
 * Selecting a time automatically loads
 * historical expectations.
 */


import { setOperationalTime }
from "../../services/TimeService";



import { emit }
from "../../services/EventService";



export function TimeSection(): string {


    return `

    <section class="assessment-section">


        <h3>
            Operational Time
        </h3>


        <div class="input-grid">


            <div class="input-group">

                <label>
                    Day
                </label>


                <select id="edori-day">


                    <option value="Monday">
                        Monday
                    </option>


                    <option value="Tuesday">
                        Tuesday
                    </option>


                    <option value="Wednesday">
                        Wednesday
                    </option>


                    <option value="Thursday">
                        Thursday
                    </option>


                    <option value="Friday">
                        Friday
                    </option>


                    <option value="Saturday">
                        Saturday
                    </option>


                    <option value="Sunday">
                        Sunday
                    </option>


                </select>


            </div>




            <div class="input-group">


                <label>
                    Hour
                </label>


                <select id="edori-hour">

                    ${generateHours()}

                </select>


            </div>


        </div>


    </section>

    `;

}




/**
 * Creates the 24 hour selector.
 */
function generateHours(): string {


    let options = "";


    for(let hour = 0; hour < 24; hour++){


        options += `

            <option value="${hour}">
                ${formatHour(hour)}
            </option>

        `;


    }


    return options;

}




/**
 * Converts 0-23 format
 * into readable time.
 */
function formatHour(hour:number):string {


    const suffix =

        hour >= 12

        ? "PM"

        : "AM";



    const display =

        hour % 12 === 0

        ? 12

        : hour % 12;



    return `${display}:00 ${suffix}`;

}






/**
 * Connects HTML inputs
 * to application services.
 */
export function initializeTimeSection():void {



    const daySelect =

        document.getElementById(
            "edori-day"
        ) as HTMLSelectElement;



    const hourSelect =

        document.getElementById(
            "edori-hour"
        ) as HTMLSelectElement;





    if(

        !daySelect ||

        !hourSelect

    ){

        return;

    }





    function updateTime(){


        const day =

            daySelect.value;



        const hour =

            Number(
                hourSelect.value
            );



        setOperationalTime(

            day,

            hour

        );



        emit(

            "stateChanged"

        );

    }





    daySelect.addEventListener(

        "change",

        updateTime

    );



    hourSelect.addEventListener(

        "change",

        updateTime

    );

}