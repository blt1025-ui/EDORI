export function ResourcesSection(){

return`

<div class="assessment-card">

<h3>👨‍⚕️ Clinical Resources</h3>

<div class="input-group">

<label>Current RNs</label>

<input
type="number"
id="currentRN"
value="0">

</div>

<div class="input-group">

<label>Current Physicians</label>

<input
type="number"
id="currentMD"
value="0">

</div>

<hr>

<div class="calculated-row">

<span>Expected RNs</span>

<strong id="expectedRN">

--

</strong>

</div>

<div class="calculated-row">

<span>Expected Physicians</span>

<strong id="expectedMD">

--

</strong>

</div>

</div>

`;

}