import { updateHistoricalValues }
from "./TimeService";


export function registerEventHandlers(){


const timeInputs = [

    "day",

    "hour"

];


timeInputs.forEach(id=>{


const element =
document.getElementById(id);


if(!element)
{
    console.warn(
        `${id} selector not found`
    );

    return;
}


element.addEventListener(
"change",
()=>{

    updateHistoricalValues();

}

);


});


}