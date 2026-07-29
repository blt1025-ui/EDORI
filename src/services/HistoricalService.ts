import history from "../data/historical.json";

import type { HistoricalRecord } from "../types/HistoricalRecord";


export function getHistoricalRecord(

    day:string,

    hour:number

):HistoricalRecord | undefined {


    return history.find(record =>

        record.day === day &&

        record.hour === hour

    );


}