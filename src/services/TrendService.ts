/**
 * TrendService
 *
 * Provides trend-ready EDORI points from the
 * persistent SnapshotService history.
 *
 * SnapshotService is the single source of truth.
 * TrendService does not maintain a separate
 * in-memory array and does not save data.
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
 * Return all persistent EDORI snapshots as
 * trend-chart points in chronological order.
 */
export function getTrendHistory():

TrendPoint[] {

    return getSnapshots()

        .map(

            snapshot => ({

                timestamp:new Date(

                    snapshot.timestamp

                ),

                score:snapshot.score

            })

        )

        .filter(

            point =>

                Number.isFinite(

                    point.score

                )

                &&

                !Number.isNaN(

                    point.timestamp.getTime()

                )

        )

        .sort(

            (

                first,

                second

            ) =>

                first.timestamp.getTime()

                -

                second.timestamp.getTime()

        );

}


/**
 * Return the most recent trend points.
 */
export function getRecentTrendHistory(

    maximumPoints:number = 50

):TrendPoint[] {

    const safeMaximum = Math.max(

        0,

        Math.floor(

            maximumPoints

        )

    );


    if(safeMaximum === 0){

        return [];

    }


    return getTrendHistory().slice(

        -safeMaximum

    );

}


/**
 * Return the most recent trend point.
 */
export function getLatestTrendPoint():

TrendPoint | null {

    const history = getTrendHistory();


    if(history.length === 0){

        return null;

    }


    return {

        ...history[

            history.length - 1

        ]

    };

}


/**
 * Return the difference between the most recent
 * two EDORI scores.
 */
export function getLatestTrendDifference():

number | null {

    const history = getTrendHistory();


    if(history.length < 2){

        return null;

    }


    const current = history[

        history.length - 1

    ];


    const previous = history[

        history.length - 2

    ];


    return current.score -

        previous.score;

}