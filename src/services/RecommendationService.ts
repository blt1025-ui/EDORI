/**
 * RecommendationService
 *
 * Converts EDORI findings into
 * operational recommendations.
 */


export function generateRecommendations(

    score:number,

    drivers:any[]

):string[] {



    const recommendations:string[] = [];





    /*
     * Score-based recommendations
     */



    if(score < 40){


        recommendations.push(

            "Continue normal emergency department operations."

        );


    }





    else if(score < 55){


        recommendations.push(

            "Increase operational awareness and monitor developing strain."

        );


    }





    else if(score < 75){


        recommendations.push(

            "Consider initiating surge mitigation strategies."

        );


        recommendations.push(

            "Review staffing, throughput, and capacity constraints."

        );


    }





    else{


        recommendations.push(

            "Consider activation of hospital surge response processes."

        );


        recommendations.push(

            "Escalate multidisciplinary review of emergency department capacity."

        );


    }








    /*
     * Driver-based recommendations
     */



    drivers.forEach(

        driver => {



            const title =

                driver.title.toLowerCase();





            if(

                title.includes(

                    "boarding"

                )

            ){


                recommendations.push(

                    "Review inpatient throughput barriers and available bed capacity."

                );


            }





            if(

                title.includes(

                    "volume"

                )

            ){


                recommendations.push(

                    "Evaluate additional emergency department treatment capacity."

                );


            }





            if(

                title.includes(

                    "acuity"

                )

            ){


                recommendations.push(

                    "Review allocation of clinical resources for high acuity patients."

                );


            }





            if(

                title.includes(

                    "staff"

                )

            ){


                recommendations.push(

                    "Evaluate staffing alignment with current demand."

                );


            }



        }

    );







    /*
     * Remove duplicates
     */


    return [

        ...new Set(

            recommendations

        )

    ];

}