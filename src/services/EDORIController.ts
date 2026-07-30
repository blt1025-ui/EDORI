import { getState } 
from "./StateService";


import { calculateEDORI }
from "./EdoriService";



export function updateEDORI(){


    const state =
        getState();



    const result =
        calculateEDORI(
            state
        );



    updateScoreDisplay(
        result
    );


}





function updateScoreDisplay(

    result:any

){


    const score =
        document.getElementById(
            "edoriScore"
        );


    const status =
        document.getElementById(
            "edoriStatus"
        );



    if(score){

        score.textContent =
            result.score;

    }



    if(status){

        status.textContent =
            result.status;

    }


}