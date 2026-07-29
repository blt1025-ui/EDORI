import { DemandSection } from "./assessment/DemandSection";
import { TimeSection } from "./assessment/TimeSection";

export function SituationAssessment() {

    return `

<div class="panel">

<h2>Situation Assessment</h2>

${TimeSection()}

${DemandSection()}

<div id="resource-section"></div>

<div id="complexity-section"></div>

</div>

`;

}

