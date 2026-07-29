export interface ForecastResult {

    projectedVolume:number;

    netChange:number;

    riskScore:number;

}



export function calculateForecast(

    currentVolume:number,

    expectedArrivals:number,

    expectedDepartures:number

):ForecastResult {



    const netChange =

        expectedArrivals -

        expectedDepartures;



    const projectedVolume =

        currentVolume +

        netChange;



    /*
    Forecast risk

    Positive patient accumulation
    increases risk.

    */

    const riskScore = Math.max(

        0,

        Math.min(

            100,

            50 + (netChange * 10)

        )

    );



    return {

        projectedVolume,

        netChange,

        riskScore

    };

}