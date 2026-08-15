/**
 * Domain Severity
 *
 * Version 2.1 Hospital Readiness Model
 *
 * Single source of truth for interpreting the five
 * major Hospital Readiness domain scores.
 *
 * These labels are intentionally different from the
 * overall Alpha / Bravo / Charlie / Delta / Echo
 * operational states.
 *
 * Domain bands:
 *
 * 0-19    Low
 * 20-39   Watch
 * 40-59   Elevated
 * 60-79   High
 * 80-100  Severe
 */

export type DomainSeverityLevel =

    | "low"

    | "watch"

    | "elevated"

    | "high"

    | "severe";


export interface DomainSeverity {

    level:DomainSeverityLevel;

    label:string;

    minimum:number;

    maximum:number;

}


export const DOMAIN_SEVERITIES:

DomainSeverity[] = [

    {

        level:
            "low",

        label:
            "Low",

        minimum:
            0,

        maximum:
            19

    },

    {

        level:
            "watch",

        label:
            "Watch",

        minimum:
            20,

        maximum:
            39

    },

    {

        level:
            "elevated",

        label:
            "Elevated",

        minimum:
            40,

        maximum:
            59

    },

    {

        level:
            "high",

        label:
            "High",

        minimum:
            60,

        maximum:
            79

    },

    {

        level:
            "severe",

        label:
            "Severe",

        minimum:
            80,

        maximum:
            100

    }

];


/**
 * Normalize a domain score to the supported 0-100
 * range.
 */
export function normalizeDomainScore(

    score:number

):number {

    if(!Number.isFinite(score)){

        return 0;

    }


    return Math.min(

        100,

        Math.max(

            0,

            score

        )

    );

}


/**
 * Return the configured severity for one domain score.
 */
export function getDomainSeverity(

    score:number

):DomainSeverity {

    const safeScore =

        normalizeDomainScore(

            score

        );


    return DOMAIN_SEVERITIES.find(

        severity =>

            safeScore >= severity.minimum

            &&

            safeScore <= severity.maximum

    )

    ?? DOMAIN_SEVERITIES[0];

}


/**
 * Return the semantic label for one domain score.
 */
export function getDomainSeverityLabel(

    score:number

):string {

    return getDomainSeverity(

        score

    ).label;

}


/**
 * Return true when a domain should appear in the
 * compact Domain Alerts strip.
 *
 * Alerts begin at Elevated (40).
 */
export function isDomainAlert(

    score:number

):boolean {

    return normalizeDomainScore(

        score

    ) >= 40;

}


/**
 * Map domain severity into the existing command-card
 * Alpha-through-Echo CSS classes.
 *
 * These are visual classes only. They do not imply
 * that an individual domain has an Alpha/Bravo/etc.
 * operational state.
 */
export function getDomainCardSeverity(

    score:number

):

    | "alpha"

    | "bravo"

    | "charlie"

    | "delta"

    | "echo" {

    switch(

        getDomainSeverity(

            score

        ).level

    ){

        case "watch":

            return "bravo";


        case "elevated":

            return "charlie";


        case "high":

            return "delta";


        case "severe":

            return "echo";


        default:

            return "alpha";

    }

}