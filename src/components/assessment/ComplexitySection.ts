export function ComplexitySection(){

return`

<div class="assessment-card">

<h3>🩺 Patient Complexity</h3>

<div class="esi-grid">

<label>ESI-1</label>
<input id="esi1" type="number" value="0">

<label>ESI-2</label>
<input id="esi2" type="number" value="0">

<label>ESI-3</label>
<input id="esi3" type="number" value="0">

<label>ESI-4</label>
<input id="esi4" type="number" value="0">

<label>ESI-5</label>
<input id="esi5" type="number" value="0">

</div>

<hr>

<div class="calculated-row">

<span>Total Acuity Units</span>

<strong id="acuityUnits">

--

</strong>

</div>

`;

}