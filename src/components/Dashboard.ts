import { SummaryCards } from "./SummaryCards";

export function Dashboard(){

return `

<main class="dashboard">

<div class="dashboard-header">

<h2>Emergency Department Dashboard</h2>

<p>Operational Readiness Overview</p>

</div>

${SummaryCards()}

<div id="dataEntry">

</div>

</main>

`;

}