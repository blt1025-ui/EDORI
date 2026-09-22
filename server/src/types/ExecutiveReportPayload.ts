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

    triggers:ExecutiveReportListItem[];

    recommendations:ExecutiveReportListItem[];


    outlook:{

        heading:string;

        description:string;

    };

}