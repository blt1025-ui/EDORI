export function HospitalSection(){

return`

<div class="assessment-card">

<h3>🏥 Hospital Throughput</h3>

<div class="input-group">

<label>Occupied Medical Beds</label>

<input
type="number"
id="occupiedMedicalBeds"
value="0">

</div>

<hr>

<div class="calculated-row">

<span>Medical Bed Occupancy</span>

<strong id="hospitalOccupancy">

--

</strong>

</div>

</div>

`;

}