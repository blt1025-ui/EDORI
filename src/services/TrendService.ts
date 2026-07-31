/**
 * TrendService
 *
 * Provides EDORI historical trend data.
 *
 * Uses SnapshotService as the
 * persistent source of truth.
 *
 * Future:
 * - IndexedDB storage
 * - Database integration
 * - Enterprise analytics
 */


import {

    getSnapshots

}

from "./SnapshotService";





export interface TrendPoint {


    timestamp:Date;


    score:number;


}








/**
 * Returns historical EDORI trend points
 */
export function getTrendHistory():

TrendPoint[] {



    const snapshots =

        getSnapshots();





    return snapshots.map(

        snapshot => ({


            timestamp:

                snapshot.timestamp,


            score:

                snapshot.score


        })

    );



}