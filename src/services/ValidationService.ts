/**
 * ValidationService
 *
 * Ensures EDORI inputs are clinically
 * and operationally reasonable.
 */


export interface ValidationResult {


    valid:boolean;


    errors:string[];


}







export function validateState(

    state:any

):ValidationResult {



    const errors:string[] = [];





    /*
     * ED Volume Validation
     */


    if(

        state.edVolume < 0

    ){

        errors.push(

            "ED volume cannot be negative."

        );

    }







    /*
     * Boarding Validation
     */


    if(

        state.boardingPatients < 0

    ){

        errors.push(

            "Boarding patients cannot be negative."

        );

    }





    if(

        state.boardingPatients >

        state.edVolume

    ){

        errors.push(

            "Boarding patients cannot exceed total ED volume."

        );

    }







    /*
     * Hospital Capacity Validation
     */


    if(

        state.occupiedBeds < 0

    ){

        errors.push(

            "Occupied beds cannot be negative."

        );

    }






    if(

        state.occupiedBeds >

        273

    ){

        errors.push(

            "Occupied medical beds cannot exceed hospital capacity (273)."

        );

    }







    /*
     * Staffing Validation
     */


    if(

        state.nurses < 0

    ){

        errors.push(

            "Nursing staff cannot be negative."

        );

    }






    if(

        state.providers < 0

    ){

        errors.push(

            "Provider staffing cannot be negative."

        );

    }







    /*
     * ESI Validation
     */


    const esiTotal =


        (

            state.esi1 || 0

        )

        +

        (

            state.esi2 || 0

        )

        +

        (

            state.esi3 || 0

        )

        +

        (

            state.esi4 || 0

        )

        +

        (

            state.esi5 || 0

        );







    if(

        esiTotal >

        state.edVolume

    ){

        errors.push(

            "Total ESI count exceeds ED volume."

        );

    }







    return {


        valid:

            errors.length === 0,


        errors


    };


}