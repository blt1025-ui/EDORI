import { calculateEDORI }
from "./EdoriService";

import { getHistoricalRecord }
from "./HistoricalService";


export function updateEDORI(){


const day =
(document.getElementById("day")
as HTMLSelectElement).value;


const hour =
Number(
(document.getElementById("hour")
as HTMLSelectElement).value
);



const historical =
getHistoricalRecord(
day,
hour
);


if(!historical)
return;



// Later this will come
// from StateService

const assessment:any={

day,

hour,

totalEDVolume:
Number(
(document.getElementById("totalEDVolume")
as HTMLInputElement).value
),

boardedPatients:
Number(
(document.getElementById("boardedPatients")
as HTMLInputElement).value
)

};



const result =
calculateEDORI(
assessment,
historical
);

document
.getElementById("projectedVolume")!
.textContent =
forecast.projectedVolume.toString();



document
.getElementById("forecastRisk")!
.textContent =
forecast.riskScore.toString();

document
.getElementById("edoriScore")!
.textContent =
result.overallScore.toString();



document
.getElementById("edoriStatus")!
.textContent =
result.status;


}