/**
 * EventService
 *
 * Lightweight application event system.
 *
 * Allows components to communicate without
 * directly depending on each other.
 */



type EventCallback = () => void;





interface EventListeners {


    [event:string]: EventCallback[];


}






const listeners:EventListeners = {};









/**
 * Subscribe to an event
 */
export function subscribe(

    event:string,

    callback:EventCallback

):void {



    if(!listeners[event]){


        listeners[event] = [];


    }





    listeners[event].push(

        callback

    );


}









/**
 * Emit an event
 */
export function emit(

    event:string

):void {



    if(!listeners[event]){

        return;

    }






    listeners[event].forEach(

        callback => {


            callback();


        }


    );


}









/**
 * Remove all listeners
 *
 * Useful for testing/resetting
 */
export function clearEvents():void {


    Object.keys(

        listeners

    ).forEach(

        event => {


            delete listeners[event];


        }


    );


}