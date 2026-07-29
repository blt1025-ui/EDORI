export function TimeSection() {

    const days = [

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday",

        "Sunday"

    ];

    const dayOptions = days.map(day =>

        `<option value="${day}">${day}</option>`

    ).join("");

    const hourOptions = Array
        .from({ length: 24 }, (_, hour) => {

            const label = hour
                .toString()
                .padStart(2, "0") + ":00";

            return `<option value="${hour}">${label}</option>`;

        })
        .join("");

    return `

<div class="assessment-card">

<h3>📅 Time</h3>

<div class="input-group">

<label>Day</label>

<select id="day">

${dayOptions}

</select>

</div>

<div class="input-group">

<label>Hour</label>

<select id="hour">

${hourOptions}

</select>

</div>

</div>

`;

}