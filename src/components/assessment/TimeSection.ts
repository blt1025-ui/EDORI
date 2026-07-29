export function TimeSection() {

    return `

    <div class="assessment-card">

        <h3>📅 Time Selection</h3>


        <div class="input-row">

            <label for="day">
                Day of Week
            </label>


            <select id="day">

                <option value="Monday">
                    Monday
                </option>

                <option value="Tuesday">
                    Tuesday
                </option>

                <option value="Wednesday">
                    Wednesday
                </option>

                <option value="Thursday">
                    Thursday
                </option>

                <option value="Friday">
                    Friday
                </option>

                <option value="Saturday">
                    Saturday
                </option>

                <option value="Sunday">
                    Sunday
                </option>

            </select>

        </div>



        <div class="input-row">

            <label for="hour">
                Hour of Day
            </label>


            <select id="hour">

                <option value="0">
                    00:00
                </option>

                <option value="1">
                    01:00
                </option>

                <option value="2">
                    02:00
                </option>

                <option value="3">
                    03:00
                </option>

                <option value="4">
                    04:00
                </option>

                <option value="5">
                    05:00
                </option>

                <option value="6">
                    06:00
                </option>

                <option value="7">
                    07:00
                </option>

                <option value="8">
                    08:00
                </option>

                <option value="9">
                    09:00
                </option>

                <option value="10">
                    10:00
                </option>

                <option value="11">
                    11:00
                </option>

                <option value="12">
                    12:00
                </option>

                <option value="13">
                    13:00
                </option>

                <option value="14">
                    14:00
                </option>

                <option value="15">
                    15:00
                </option>

                <option value="16">
                    16:00
                </option>

                <option value="17">
                    17:00
                </option>

                <option value="18">
                    18:00
                </option>

                <option value="19">
                    19:00
                </option>

                <option value="20">
                    20:00
                </option>

                <option value="21">
                    21:00
                </option>

                <option value="22">
                    22:00
                </option>

                <option value="23">
                    23:00
                </option>

            </select>

        </div>



        <div class="calculated-section">


            <h4>
                Historical Expectations
            </h4>



            <div class="calculated-row">

                <span>
                    Expected ED Volume
                </span>

                <strong id="expectedVolume">
                    --
                </strong>

            </div>



            <div class="calculated-row">

                <span>
                    Expected Boarders
                </span>

                <strong id="expectedBoarders">
                    --
                </strong>

            </div>



            <div class="calculated-row">

                <span>
                    Expected RNs
                </span>

                <strong id="expectedRN">
                    --
                </strong>

            </div>



            <div class="calculated-row">

                <span>
                    Expected Physicians
                </span>

                <strong id="expectedMD">
                    --
                </strong>

            </div>



            <div class="calculated-row">

                <span>
                    Expected Arrivals
                </span>

                <strong id="expectedArrivals">
                    --
                </strong>

            </div>



            <div class="calculated-row">

                <span>
                    Expected Departures
                </span>

                <strong id="expectedDepartures">
                    --
                </strong>

            </div>


        </div>


    </div>

    `;

}