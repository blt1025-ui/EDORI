export function DemandSection() {

return `

<div class="assessment-card">

<h3>👥 ED Demand</h3>

<div class="input-group">

<label>Total ED Volume</label>

<input
type="number"
id="totalEDVolume"
value="0"
min="0">

</div>

<div class="input-group">

<label>Boarding Patients</label>

<input
type="number"
id="boardedPatients"
value="0"
min="0">

</div>

<hr>

<div class="calculated-row">

<span>ED Occupancy</span>

<strong id="occupancyRatio">

--

</strong>

</div>

<div class="calculated-row">

<span>Projected ED Volume</span>

<strong id="projectedVolume">

--

</strong>

<div class="calculated-row">

<span>Expected ED Volume</span>

<strong id="expectedVolume">
--
</strong>

</div>


<div class="calculated-row">

<span>Expected Boarders</span>

<strong id="expectedBoarders">
--
</strong>

</div>

</div>

<div class="calculated-row">

<span>Boarding %</span>

<strong id="boardingPercent">

--

</strong>

</div>

</div>

`;

}