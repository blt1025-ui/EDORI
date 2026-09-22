/**
 * ExecutiveReportPayload
 *
 * Structured, non-PHI snapshot of the authoritative
 * Executive Assessment Report.
 *
 * The frontend creates this payload from the already
 * calculated OperationalAssessment. The backend does
 * not recalculate Hospital Readiness.
 */

export interface ExecutiveReportListItem {

    title:string;

    description:string;

    label:string;

}


export interface ExecutiveReportTrendPoint {

    timestamp:string;

    score:number;

    operationalLevel:string;

}


export interface ExecutiveReportPayload {

    assessmentTimestamp:string;

    generatedTimestamp:string;

    hriScore:number;

    operationalLevel:string;

    operationalIcon:string;

    operationalColor:string;

    riskDirection:string;

    confidence:string;

    scoreChange:number | null;

    /*
     * Retained for API compatibility.
     * Operational triggers are not displayed in the
     * Executive Assessment Report, email, or PDF.
     */
    activeTriggerCount:number;

    priorityActionCount:number;


    domains:{

        edOperationalPressure:number;

        projectedAcuteCareCapacity:number;

        criticalCareCapacity:number;

    };


    capacity:{

        totalEDVolume:number;

        edTreatmentBeds:number;

        edCapacityPercent:number;

        boardedPatients:number;

        boardingSharePercent:number;

        occupiedAcuteCareBeds:number;

        staffedAcuteCareBeds:number;

        acuteOccupancyPercent:number;

        occupiedCriticalCareBeds:number;

        staffedCriticalCareBeds:number;

        criticalOccupancyPercent:number;

        knownDirectAdmissions4h:number;

        knownSurgicalAdmissions4h:number;

        expectedAdditionalEDAdmissions4h:number;

        expectedInpatientDepartures4h:number;

        projectedAvailableAcuteCareBeds:number;

    };


    acuity:{

        esi1:number;

        esi2:number;

        esi3to5:number;

        highAcuityCount:number;

        highAcuityPercent:number;

    };


    drivers:ExecutiveReportListItem[];

    /*
     * Retained for API compatibility only.
     * This collection is not rendered in the report.
     */
    triggers:ExecutiveReportListItem[];

    recommendations:ExecutiveReportListItem[];


    /**
     * Distribution-only recent HRI history.
     * Oldest point first; maximum 24 points.
     */
    trend:ExecutiveReportTrendPoint[];


    outlook:{

        heading:string;

        description:string;

    };

}