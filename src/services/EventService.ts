/**
 * EventService
 *
 * Lightweight typed application event system.
 *
 * Allows components to communicate without
 * directly depending on one another.
 */

import type {

    AppEventName

}

from "../config/appEvents";


type EventCallback = () => void;


type EventListeners = {

    [EventName in AppEventName]?:
        EventCallback[];

};


const listeners:EventListeners = {};


/**
 * Subscribe to an application event.
 */
export function subscribe(

    event:AppEventName,

    callback:EventCallback

):() => void {

    const eventListeners =

        listeners[event]

        ?? [];


    eventListeners.push(

        callback

    );


    listeners[event] =

        eventListeners;


    /*
     * Return an unsubscribe function.
     *
     * Components do not need it yet, but this
     * supports future route changes and tests.
     */

    return () => {

        unsubscribe(

            event,

            callback

        );

    };

}


/**
 * Emit an application event.
 */
export function emit(

    event:AppEventName

):void {

    const eventListeners =

        listeners[event];


    if(!eventListeners){

        return;

    }


    /*
     * Iterate over a copy so a callback can safely
     * unsubscribe while an event is being emitted.
     */

    [

        ...eventListeners

    ].forEach(

        callback => {

            try {

                callback();

            }
            catch(error){

                console.error(

                    `Error while handling EDORI event "${event}":`,

                    error

                );

            }

        }

    );

}


/**
 * Remove one event subscription.
 */
export function unsubscribe(

    event:AppEventName,

    callback:EventCallback

):void {

    const eventListeners =

        listeners[event];


    if(!eventListeners){

        return;

    }


    listeners[event] =

        eventListeners.filter(

            registeredCallback =>

                registeredCallback

                !==

                callback

        );


    if(

        listeners[event]?.length

        ===

        0

    ){

        delete listeners[event];

    }

}


/**
 * Remove all registered event listeners.
 *
 * Primarily useful for automated testing
 * and complete application resets.
 */
export function clearEvents():void {

    Object.keys(

        listeners

    ).forEach(

        event => {

            delete listeners[

                event as AppEventName

            ];

        }

    );

}


/**
 * Return the number of listeners for an event.
 *
 * Useful for development diagnostics and tests.
 */
export function getListenerCount(

    event:AppEventName

):number {

    return listeners[event]?.length

        ?? 0;

}