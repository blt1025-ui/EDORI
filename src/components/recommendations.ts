/**
 * Recommendations
 *
 * Displays operational recommendations
 * based on EDORI conditions.
 */


import { subscribe }
from "../services/EventService";


import { getState }
from "../services/StateService";


import { calculateEdori }
from "../services/EdoriService";


import { generateRecommendations }
from "../services/RecommendationService";





export function Recommendations(): string {


    return `


    <section class="recommendations-container">


        <h3>
            Recommended Actions
        </h3>



        <div id="recommendations-list">


            <p>
                No recommendations available.
            </p>


        </div>



    </section>


    `;

}








export function initializeRecommendations():void {


    updateRecommendations();



    subscribe(

        "stateChanged",

        updateRecommendations

    );


}








function updateRecommendations():void {



    const container =

        document.getElementById(

            "recommendations-list"

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






    const recommendations =

        generateRecommendations(

            result.score,

            result.drivers

        );






    if(

        recommendations.length === 0

    ){


        container.innerHTML =


        `

        <p>
            No operational recommendations.
        </p>

        `;


        return;

    }






    container.innerHTML =


        recommendations

        .map(

            item => `


            <div class="recommendation-card">


                <p>

                    ${item}

                </p>


            </div>


            `

        )

        .join("");



}