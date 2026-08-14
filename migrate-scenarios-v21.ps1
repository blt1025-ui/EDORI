$path = "src\scenarios\edoriScenarios.ts"

$content = Get-Content $path -Raw


$scenarios = @(

    @{
        Id = "quiet-overnight"
        ExpectedOccupied = 205
        ExpectedAvailable = 68
        HistoricalDemand = 13
        HistoricalBalance = 63
    },

    @{
        Id = "typical-daytime"
        ExpectedOccupied = 230
        ExpectedAvailable = 43
        HistoricalDemand = 35
        HistoricalBalance = 26
    },

    @{
        Id = "developing-surge"
        ExpectedOccupied = 240
        ExpectedAvailable = 33
        HistoricalDemand = 47
        HistoricalBalance = 2
    },

    @{
        Id = "boarding-crisis"
        ExpectedOccupied = 245
        ExpectedAvailable = 28
        HistoricalDemand = 56
        HistoricalBalance = -14
    },

    @{
        Id = "critical-operations"
        ExpectedOccupied = 250
        ExpectedAvailable = 23
        HistoricalDemand = 63
        HistoricalBalance = -30
    },

    @{
        Id = "high-acuity-moderate-volume"
        ExpectedOccupied = 225
        ExpectedAvailable = 48
        HistoricalDemand = 34
        HistoricalBalance = 31
    },

    @{
        Id = "hospital-capacity-constrained"
        ExpectedOccupied = 240
        ExpectedAvailable = 33
        HistoricalDemand = 40
        HistoricalBalance = 10
    },

    @{
        Id = "high-but-expected"
        ExpectedOccupied = 245
        ExpectedAvailable = 28
        HistoricalDemand = 54
        HistoricalBalance = -7
    }

)


foreach($scenario in $scenarios){

    $id = [regex]::Escape(
        $scenario.Id
    )


    $pattern = @"
(?s)(id:\s*"$id".*?expectedEDBoarders:\s*[0-9.]+,)
"@


    $replacement = @"
`$1

            expectedStaffedAcuteCareBeds:
                273,

            expectedOccupiedAcuteCareBeds:
                $($scenario.ExpectedOccupied),

            expectedAvailableAcuteCareBeds:
                $($scenario.ExpectedAvailable),

            historicalProjectedBedDemand4h:
                $($scenario.HistoricalDemand),

            historicalProjectedBedBalance4h:
                $($scenario.HistoricalBalance),
"@


    $updated = [regex]::Replace(

        $content,

        $pattern,

        $replacement,

        1

    )


    if($updated -eq $content){

        throw "Unable to update scenario: $($scenario.Id)"

    }


    $content = $updated

}


$content = $content.Replace(

    "Version 2 Hospital Readiness Model",

    "Version 2.1 Hospital Readiness Model"

)


Set-Content `
    -Path $path `
    -Value $content `
    -Encoding UTF8


Write-Host ""
Write-Host "Version 2.1 scenario migration complete."
Write-Host ""