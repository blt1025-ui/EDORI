/**
 * Drivers
 *
 * Displays the operational factors
 * contributing to EDORI score.
 */


import { subscribe }
from "../services/EventService";


import { getState }
from "../services/StateService";


import { calculateEdori }
from "../services/EdoriService";




export function Drivers(): string {


    return `


    <section class="drivers-container">


        <h3>
            Primary Drivers
        </h3>



        <div id="drivers-list">


            <p>
                No active drivers
            </p>


        </div>



    </section>


    `;

}







export function initializeDrivers():void {


    updateDrivers();



    subscribe(

        "stateChanged",

        updateDrivers

    );


}








function updateDrivers():void {



    const container =

        document.getElementById(

            "drivers-list"

        );





    if(!container){

        return;

    }





    const state =

        getState();





    const result =

        calculateEdori(

            state

        );





    if(

        !result.drivers ||

        result.drivers.length === 0

    ){

        container.innerHTML =

        `

        <p>
            No significant operational drivers identified.
        </p>

        `;


        return;

    }







    container.innerHTML =


        result.drivers

        .map(

            driver => `


            <div class="driver-card">


                <strong>

                    ${driver.title}

                </strong>


                <p>

                    ${driver.description}

                </p>


            </div>


            `

        )

        .join("");



}