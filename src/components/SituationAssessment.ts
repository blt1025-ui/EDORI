import { TimeSection } from "./assessment/TimeSection";
import { DemandSection } from "./assessment/DemandSection";
import { HospitalSection } from "./assessment/HospitalSection";
import { ResourcesSection } from "./assessment/ResourcesSection";
import { ComplexitySection } from "./assessment/ComplexitySection";
import { ForecastSection } from "./assessment/ForecastSection";


export function SituationAssessment() {

    return `

<div class="panel">

    <h2>Situation Assessment</h2>

    ${TimeSection()}

    ${DemandSection()}

    ${HospitalSection()}

    ${ResourcesSection()}

    ${ComplexitySection()}

    ${ForecastSection()}

  

</div>

`;
}