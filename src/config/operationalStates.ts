/**
 * Operational States
 *
 * Defines EDORI score interpretation.
 *
 * This is the single source of truth
 * for dashboard operational messaging.
 */


export interface OperationalState {

    title:string;

    icon:string;

    color:string;

    recommendation:string;

}



export const OPERATIONAL_STATES = [

    {
        minimum:0,

        maximum:20,

        title:
        "Normal Operations",

        icon:
        "🟢",

        color:
        "#2E7D32",

        recommendation:
        "Emergency department operations are stable. Continue routine monitoring."

    },


    {
        minimum:21,

        maximum:40,

        title:
        "Elevated Activity",

        icon:
        "🔵",

        color:
        "#1565C0",

        recommendation:
        "Patient demand is increasing. Monitor patient flow and staffing closely."

    },


    {
        minimum:41,

        maximum:60,

        title:
        "Busy",

        icon:
        "🟡",

        color:
        "#F9A825",

        recommendation:
        "Operational strain is developing. Evaluate throughput barriers and resource needs."

    },


    {
        minimum:61,

        maximum:80,

        title:
        "Surge",

        icon:
        "🟠",

        color:
        "#EF6C00",

        recommendation:
        "Hospital surge interventions should be considered. Increase operational awareness."

    },


    {
        minimum:81,

        maximum:100,

        title:
        "Severe Surge",

        icon:
        "🔴",

        color:
        "#C62828",

        recommendation:
        "Immediate hospital-wide intervention is recommended. Activate surge response."

    }

] satisfies OperationalState[];