/**
 * SnapshotService
 *
 * Stores and retrieves EDORI history.
 *
 * Current implementation:
 * Browser local storage.
 *
 * Future:
 * Database/API persistence.
 */


import type { EdoriSnapshot }
from "../types/EdoriSnapshot";



const STORAGE_KEY =
    "edori_snapshots";



/**
 * Save a new EDORI snapshot
 */
export function saveSnapshot(

    snapshot:EdoriSnapshot

):void {


    const existing =
        getSnapshots();



    existing.push(snapshot);



    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(existing)

    );

}



/**
 * Retrieve historical snapshots
 */
export function getSnapshots():

EdoriSnapshot[] {


    const stored =

        localStorage.getItem(

            STORAGE_KEY

        );



    if(!stored){

        return [];

    }



    const snapshots:

    EdoriSnapshot[] =

        JSON.parse(

            stored

        );



    return snapshots.map(

        item => ({

            ...item,

            timestamp:
                new Date(
                    item.timestamp
                )

        })

    );

}



/**
 * Remove all history
 */
export function clearSnapshots():

void {


    localStorage.removeItem(

        STORAGE_KEY

    );

}

export function shouldCreateSnapshot(

    snapshot:EdoriSnapshot

):boolean {


    const history =
        getSnapshots();



    if(history.length === 0){

        return true;

    }



    const previous =

        history[
            history.length - 1
        ];



    const scoreChanged =

        previous.score !== snapshot.score;



    const timePassed =

        (
            snapshot.timestamp.getTime()

            -

            previous.timestamp.getTime()

        )

        >

        15 * 60 * 1000;



    return (

        scoreChanged

        ||

        timePassed

    );

}