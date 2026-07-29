import { getHistoricalRecord } from "./HistoricalService";


export function updateHistoricalValues() {


    const dayElement = document.getElementById("day");

    const hourElement = document.getElementById("hour");


    if (!dayElement || !hourElement) {

        console.warn("Time selectors not found");

        return;

    }


    const day = 
        (dayElement as HTMLSelectElement).value;


    const hour =
        Number(
            (hourElement as HTMLSelectElement).value
        );


    const historical =
        getHistoricalRecord(
            day,
            hour
        );

       


    if (!historical) {

        console.warn(
            `No historical data found for ${day} ${hour}:00`
        );

        return;

    }


    updateText(
        "expectedVolume",
        historical.expectedVolume
    );


    updateText(
        "expectedBoarders",
        historical.expectedBoarders
    );


    updateText(
        "expectedRN",
        historical.expectedRN
    );


    updateText(
        "expectedMD",
        historical.expectedMD
    );


    updateText(
        "expectedArrivals",
        historical.expectedArrivals
    );


    updateText(
        "expectedDepartures",
        historical.expectedDepartures
    );

}



function updateText(

    elementID:string,

    value:number

) {


    const element =
        document.getElementById(elementID);


    if (!element) {

        return;

    }


    element.textContent =
        value.toString();

}



/*
Clear values if no historical
data exists
*/

function clearHistoricalDisplay(){


    const fields = [

        "expectedVolume",

        "expectedBoarders",

        "expectedRN",

        "expectedMD",

        "expectedArrivals",

        "expectedDepartures"

    ];



    fields.forEach(id=>{


        const element =
            document.getElementById(id);



        if(element){

            element.textContent = "--";

        }


    });


}