export function DemandSection() {

    return `

    <div class="assessment-card">

        <h3>👥 ED Demand</h3>

        <div class="input-group">

            <label for="occupiedBeds">
                Occupied Treatment Spaces
            </label>

            <input
                type="number"
                id="occupiedBeds"
                value="0"
                min="0"
            
>

        </div>

        <div class="input-group">

            <label for="hallwayPatients">
                Hallway Patients
            </label>

            <input
                type="number"
                id="hallwayPatients"
                value="0"
                min="0"
                
                >

        </div>

        <div class="input-group">

            <label for="waitingPatients">
                Waiting Room Patients
            </label>

            <input
                type="number"
                id="waitingPatients"
                value="0"
                min="0"
                
                >

        </div>

        <div class="input-group">

            <label for="boardedPatients">
                Boarding Patients
            </label>

            <input
                type="number"
                id="boardedPatients"
                value="0"
                min="0">

        </div>

        <hr>

        <div class="calculated-row">

            <span>Total ED Volume</span>

            <strong id="totalVolume">

                --

            </strong>

        </div>

        <div class="calculated-row">

            <span>ED Occupancy Ratio</span>

            <strong id="occupancyRatio" class="status-normal">--</strong>

        </div>

        <div class="calculated-row">

            <span>Projected ED Volume</span>

            <strong id="projectedVolume">

                --

            </strong>

        </div>

    </div>

    `;

}