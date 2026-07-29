import { SummaryCards } from "./SummaryCards";
import { SituationAssessment } from "./SituationAssessment";
import { Gauge } from "./Gauge";
import { Recommendations } from "./Recommendations";
import { TrendChart } from "./TrendChart";
import { Drivers } from "./Drivers";

export function Dashboard() {

    return `

    <main class="dashboard">

        <div class="dashboard-header">
        <div id="statusBanner"
class="status-banner">

Normal Operations

</div>

            <h2>Emergency Department Dashboard</h2>

            <p>Operational Readiness Overview</p>

        </div>

        ${SummaryCards()}

        <div class="dashboard-grid">

            <div class="left-column">

                ${SituationAssessment()}

            </div>

            <div class="right-column">

                ${Gauge()}

                ${Drivers()}

                ${Recommendations()}

                ${TrendChart()}

            </div>

        </div>

    </main>

    `;

}