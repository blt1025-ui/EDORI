$path = "src\components\HistoryRestoreCenter.ts"

$content = Get-Content $path -Raw


$replacement = @'
function normalizeSnapshot(

    value:unknown

):EdoriSnapshot | null {

    if(

        typeof value !== "object"

        ||

        value === null

    ){

        return null;

    }


    const candidate =

        value as Record<string, unknown>;


    /*
     * =================================================
     * Version 2.1 snapshot schema
     * =================================================
     *
     * Version 2.1 uses snapshot schema 3.
     *
     * Older schema records are intentionally not
     * reconstructed because doing so could reintroduce
     * the obsolete projected-inflow model.
     */

    const schemaVersion =

        normalizeNumber(

            candidate.schemaVersion

        );


    if(

        schemaVersion !== 3

    ){

        return null;

    }


    /*
     * =================================================
     * Required core values
     * =================================================
     */

    const timestamp =

        normalizeDate(

            candidate.timestamp

        );


    const score =

        normalizeNumber(

            candidate.score

        );


    const operationalState =

        normalizeOperationalState(

            candidate.operationalState

        );


    if(

        timestamp === null

        ||

        score === null

        ||

        operationalState === null

    ){

        return null;

    }


    /*
     * =================================================
     * Current non-ED hospital inflow
     * =================================================
     */

    const currentDirectAdmissions =

        normalizeNonnegativeNumber(

            candidate.currentDirectAdmissions

        )

        ?? 0;


    const currentSurgicalAdmissions =

        normalizeNonnegativeNumber(

            candidate.currentSurgicalAdmissions

        )

        ?? 0;


    const knownNonEDInflow =

        normalizeNonnegativeNumber(

            candidate.knownNonEDInflow

        )

        ??

        (

            currentDirectAdmissions

            +

            currentSurgicalAdmissions

        );


    /*
     * =================================================
     * Current acute-care capacity
     * =================================================
     */

    const staffedAcuteCareBeds =

        normalizePositiveNumber(

            candidate.staffedAcuteCareBeds

        )

        ?? 1;


    const occupiedAcuteCareBeds =

        normalizeNonnegativeNumber(

            candidate.occupiedAcuteCareBeds

        )

        ?? 0;


    const currentAvailableAcuteCareBeds =

        normalizeNumber(

            candidate.currentAvailableAcuteCareBeds

        )

        ??

        (

            staffedAcuteCareBeds

            -

            occupiedAcuteCareBeds

        );


    /*
     * =================================================
     * Historical ED expectations
     * =================================================
     */

    const expectedEDVolume =

        normalizeNonnegativeNumber(

            candidate.expectedEDVolume

        )

        ?? 0;


    const expectedEDBoarders =

        normalizeNonnegativeNumber(

            candidate.expectedEDBoarders

        )

        ?? 0;


    /*
     * =================================================
     * Historical acute-care baseline
     * =================================================
     */

    const expectedStaffedAcuteCareBeds =

        normalizePositiveNumber(

            candidate.expectedStaffedAcuteCareBeds

        )

        ?? staffedAcuteCareBeds;


    const expectedOccupiedAcuteCareBeds =

        normalizeNonnegativeNumber(

            candidate.expectedOccupiedAcuteCareBeds

        )

        ?? occupiedAcuteCareBeds;


    const expectedAvailableAcuteCareBeds =

        normalizeNumber(

            candidate.expectedAvailableAcuteCareBeds

        )

        ??

        (

            expectedStaffedAcuteCareBeds

            -

            expectedOccupiedAcuteCareBeds

        );


    /*
     * =================================================
     * Historical four-hour flow
     * =================================================
     */

    const expectedEDAdmissions4h =

        normalizeNonnegativeNumber(

            candidate.expectedEDAdmissions4h

        )

        ?? 0;


    const expectedDirectAdmissions4h =

        normalizeNonnegativeNumber(

            candidate.expectedDirectAdmissions4h

        )

        ?? 0;


    const expectedSurgicalAdmissions4h =

        normalizeNonnegativeNumber(

            candidate.expectedSurgicalAdmissions4h

        )

        ?? 0;


    const expectedNonEDInflow =

        normalizeNonnegativeNumber(

            candidate.expectedNonEDInflow

        )

        ??

        (

            expectedDirectAdmissions4h

            +

            expectedSurgicalAdmissions4h

        );


    const expectedHospitalInflow4h =

        normalizeNonnegativeNumber(

            candidate.expectedHospitalInflow4h

        )

        ??

        (

            expectedEDAdmissions4h

            +

            expectedDirectAdmissions4h

            +

            expectedSurgicalAdmissions4h

        );


    const expectedInpatientDepartures4h =

        normalizeNonnegativeNumber(

            candidate.expectedInpatientDepartures4h

        )

        ?? 0;


    /*
     * =================================================
     * Current ED boarding
     * =================================================
     */

    const boardedPatients =

        normalizeNonnegativeNumber(

            candidate.boardedPatients

        )

        ?? 0;


    /*
     * =================================================
     * Version 2.1 projected new admissions
     * =================================================
     */

    const projectedDirectAdmissions =

        normalizeNonnegativeNumber(

            candidate.projectedDirectAdmissions

        )

        ?? currentDirectAdmissions;


    const projectedSurgicalAdmissions =

        normalizeNonnegativeNumber(

            candidate.projectedSurgicalAdmissions

        )

        ?? currentSurgicalAdmissions;


    const projectedNewAdmissions =

        normalizeNonnegativeNumber(

            candidate.projectedNewAdmissions

        )

        ??

        (

            expectedEDAdmissions4h

            +

            projectedDirectAdmissions

            +

            projectedSurgicalAdmissions

        );


    /*
     * Existing ED boarders are already current bed
     * demand.
     *
     * They are added exactly once to new admissions.
     */
    const projectedTotalBedDemand =

        normalizeNonnegativeNumber(

            candidate.projectedTotalBedDemand

        )

        ??

        (

            boardedPatients

            +

            projectedNewAdmissions

        );


    /*
     * =================================================
     * Historical projected demand
     * =================================================
     */

    const historicalProjectedBedDemand4h =

        normalizeNonnegativeNumber(

            candidate.historicalProjectedBedDemand4h

        )

        ??

        (

            expectedEDBoarders

            +

            expectedEDAdmissions4h

            +

            expectedDirectAdmissions4h

            +

            expectedSurgicalAdmissions4h

        );


    /*
     * =================================================
     * Projected capacity
     * =================================================
     */

    const projectedAvailableAcuteCareBeds =

        normalizeNumber(

            candidate.projectedAvailableAcuteCareBeds

        )

        ??

        (

            currentAvailableAcuteCareBeds

            +

            expectedInpatientDepartures4h

            -

            projectedTotalBedDemand

        );


    /*
     * Historical balance may be negative.
     */
    const historicalProjectedBedBalance4h =

        normalizeNumber(

            candidate.historicalProjectedBedBalance4h

        )

        ??

        (

            expectedAvailableAcuteCareBeds

            +

            expectedInpatientDepartures4h

            -

            historicalProjectedBedDemand4h

        );


    /*
     * Negative variance means today's projection is
     * worse than historical expectation.
     */
    const projectedCapacityVariance =

        normalizeNumber(

            candidate.projectedCapacityVariance

        )

        ??

        (

            projectedAvailableAcuteCareBeds

            -

            historicalProjectedBedBalance4h

        );


    /*
     * =================================================
     * Return Version 2.1 snapshot
     * =================================================
     */

    return {

        id:

            normalizeString(

                candidate.id

            )

            ??

            createRestoredSnapshotId(

                timestamp

            ),

        timestamp,

        schemaVersion:3,

        score:

            clampScore(

                score

            ),

        status:

            normalizeString(

                candidate.status

            )

            ??

            operationalState.title,

        operationalState,

        day:

            normalizeString(

                candidate.day

            )

            ??

            getDayName(

                timestamp

            ),

        hour:

            normalizeHour(

                candidate.hour

            )

            ??

            timestamp.getHours(),

        forecastHours:

            normalizePositiveInteger(

                candidate.forecastHours

            )

            ?? 4,


        /*
         * Emergency Department
         */

        totalEDVolume:

            normalizeNonnegativeNumber(

                candidate.totalEDVolume

            )

            ?? 0,

        boardedPatients,

        esi1:

            normalizeNonnegativeNumber(

                candidate.esi1

            )

            ?? 0,

        esi2:

            normalizeNonnegativeNumber(

                candidate.esi2

            )

            ?? 0,


        /*
         * Current hospital capacity
         */

        staffedAcuteCareBeds,

        occupiedAcuteCareBeds,

        staffedCriticalCareBeds:

            normalizePositiveNumber(

                candidate.staffedCriticalCareBeds

            )

            ?? 1,

        occupiedCriticalCareBeds:

            normalizeNonnegativeNumber(

                candidate.occupiedCriticalCareBeds

            )

            ?? 0,


        /*
         * Current non-ED inflow
         */

        currentDirectAdmissions,

        currentSurgicalAdmissions,

        knownNonEDInflow,

        expectedNonEDInflow,


        /*
         * Historical ED expectations
         */

        expectedEDVolume,

        expectedEDBoarders,


        /*
         * Historical acute-care baseline
         */

        expectedStaffedAcuteCareBeds,

        expectedOccupiedAcuteCareBeds,

        expectedAvailableAcuteCareBeds,


        /*
         * Historical four-hour flow
         */

        expectedEDAdmissions4h,

        expectedDirectAdmissions4h,

        expectedSurgicalAdmissions4h,

        expectedHospitalInflow4h,

        expectedInpatientDepartures4h,


        /*
         * Four-hour projected demand
         */

        projectedDirectAdmissions,

        projectedSurgicalAdmissions,

        projectedNewAdmissions,

        projectedTotalBedDemand,

        historicalProjectedBedDemand4h,


        /*
         * Four-hour projected capacity
         */

        currentAvailableAcuteCareBeds,

        projectedAvailableAcuteCareBeds,

        historicalProjectedBedBalance4h,

        projectedCapacityVariance,


        /*
         * Hospital Readiness domains
         */

        edPressureScore:

            normalizeOptionalScore(

                candidate.edPressureScore

            )

            ?? 0,

        acuteCapacityScore:

            normalizeOptionalScore(

                candidate.acuteCapacityScore

            )

            ?? 0,

        criticalCapacityScore:

            normalizeOptionalScore(

                candidate.criticalCapacityScore

            )

            ?? 0,

        inflowScore:

            normalizeOptionalScore(

                candidate.inflowScore

            )

            ?? 0,

        projectedCapacityScore:

            normalizeOptionalScore(

                candidate.projectedCapacityScore

            )

            ?? 0,


        /*
         * ED subdomains
         */

        edVolumeScore:

            normalizeOptionalScore(

                candidate.edVolumeScore

            )

            ?? 0,

        edBoardingScore:

            normalizeOptionalScore(

                candidate.edBoardingScore

            )

            ?? 0,

        edAcuityScore:

            normalizeOptionalScore(

                candidate.edAcuityScore

            )

            ?? 0,


        /*
         * Temporary compatibility fields
         */

        currentEDAdmissions:0,

        currentHospitalInflow:

            normalizeNonnegativeNumber(

                candidate.currentHospitalInflow

            )

            ??

            knownNonEDInflow,

        projectedHospitalInflow:

            normalizeNonnegativeNumber(

                candidate.projectedHospitalInflow

            )

            ??

            projectedNewAdmissions,


        /*
         * Optional trend metadata
         */

        scoreChange:

            normalizeOptionalScoreChange(

                candidate.scoreChange

            ),

        trendDirection:

            normalizeString(

                candidate.trendDirection

            ),

        activeTriggerIds:

            normalizeStringArray(

                candidate.activeTriggerIds

            ),

        activeTriggerTitles:

            normalizeStringArray(

                candidate.activeTriggerTitles

            )

    };

}
'@


$pattern = '(?s)function normalizeSnapshot\(\s*value:unknown\s*\):EdoriSnapshot \| null \{.*?\n\}\s*(?=/\*\*\s*\r?\n\s*\* Normalize an operational state)'


$regex = [regex]::new(

    $pattern

)


if(

    !$regex.IsMatch(

        $content

    )

){

    throw "Could not locate normalizeSnapshot() in HistoryRestoreCenter.ts."

}


$updated = $regex.Replace(

    $content,

    [System.Text.RegularExpressions.MatchEvaluator]{

        param($match)

        return $replacement

    },

    1

)


Set-Content `
    -Path $path `
    -Value $updated `
    -Encoding UTF8


Write-Host ""
Write-Host "HistoryRestoreCenter Version 2.1 normalizeSnapshot migration complete."
Write-Host ""