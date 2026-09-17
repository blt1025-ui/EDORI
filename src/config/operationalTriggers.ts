/**
 * Hospital Readiness operational trigger configuration.
 * Updated from the approved HRI v2.2 trigger/recommendation workbook.
 * Triggers are advisory and do not change the score-derived Alpha–Echo level.
 */

import type { OperationalTrigger } from "../types/OperationalTrigger";

export const OPERATIONAL_TRIGGERS:OperationalTrigger[] = [
    {
        id:"ed-volume-above-expected",
        title:"ED Volume Significantly Above Expected",
        description:"Current ED census is at least 35 patients above the historical weekday and hour expectation.",
        enabled:true,
        category:"ED Operational Pressure",
        priority:"Moderate",
        conditions:[
            {
                metric:"volumeAboveExpected",
                operator:"greaterThanOrEqual",
                threshold:35
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["reallocate-staff-to-ED"],
        rationale:"Historical comparison identifies ED demand that is unusually high for the current weekday and hour."
    },
    {
        id:"significant-boarding",
        title:"Significant ED Boarding",
        description:"At least 30 admitted patients are boarding in the emergency department.",
        enabled:true,
        category:"ED Operational Pressure",
        priority:"Moderate",
        conditions:[
            {
                metric:"boardedPatients",
                operator:"greaterThanOrEqual",
                threshold:30
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["evaluate-overflow-space","Remove-Time-Restriction","connect-with-EVS-and-transport"],
        rationale:"A large ED boarding population reduces functional emergency treatment capacity and reflects hospital throughput pressure."
    },
    {
        id:"boarding-crisis",
        title:"Severe ED Boarding",
        description:"At least 40 admitted patients are boarding in the emergency department.",
        enabled:true,
        category:"ED Operational Pressure",
        priority:"Critical",
        conditions:[
            {
                metric:"boardedPatients",
                operator:"greaterThanOrEqual",
                threshold:40
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Increase-acute-care-capacity","reallocate-staff-to-ED","evaluate-overflow-space","Remove-Time-Restriction","connect-with-EVS-and-transport","ED-Boarders-to-hallway"],
        rationale:"Boarding at this level consumes a substantial portion of ED capacity and warrants coordinated hospital intervention."
    },
    {
        id:"acute-care-near-capacity",
        title:"Acute-Care Capacity Constrained",
        description:"Staffed acute-care occupancy is at least 95%.",
        enabled:true,
        category:"Acute-Care Capacity",
        priority:"High",
        conditions:[
            {
                metric:"acuteCareOccupancyPercent",
                operator:"greaterThanOrEqual",
                threshold:95
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Increase-acute-care-capacity","connect-with-EVS-and-transport"],
        rationale:"Very high staffed acute-care occupancy leaves limited reserve for new inpatient demand."
    },
    {
        id:"acute-care-no-available-beds",
        title:"No Available Acute-Care Beds",
        description:"No currently staffed acute-care beds remain available.",
        enabled:true,
        category:"Acute-Care Capacity",
        priority:"Critical",
        conditions:[
            {
                metric:"availableAcuteCareBeds",
                operator:"lessThanOrEqual",
                threshold:0
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Increase-acute-care-capacity","connect-with-EVS-and-transport"],
        rationale:"Absence of currently available staffed acute-care beds substantially limits the hospital's ability to absorb new admissions."
    },
    {
        id:"critical-care-near-capacity-plus-acuity",
        title:"ED High-Acuity Volume & Critical-Care Capacity Constrained",
        description:"Staffed critical-care occupancy is at least 95% and more than 30% of the ED census consists of ESI 1 or ESI 2 patients.",
        enabled:true,
        category:"Critical-Care Capacity",
        priority:"High",
        conditions:[
            {
                metric:"criticalCareOccupancyPercent",
                operator:"greaterThanOrEqual",
                threshold:95
            },
            {
                metric:"highAcuityPercent",
                operator:"greaterThanOrEqual",
                threshold:30
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Bring-in-ICUIMC-Nurse","Admit-ICU-Boarders-waiting-tx-out"],
        rationale:"Limited staffed critical-care reserve combined with a high-acuity ED census may constrain placement of high-acuity patients and increase clinical workload."
    },
    {
        id:"critical-care-no-available-beds",
        title:"No Available Critical-Care Beds",
        description:"No currently staffed critical-care beds remain available.",
        enabled:true,
        category:"Critical-Care Capacity",
        priority:"Critical",
        conditions:[
            {
                metric:"availableCriticalCareBeds",
                operator:"lessThanOrEqual",
                threshold:0
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Bring-in-ICUIMC-Nurse"],
        rationale:"Loss of all staffed critical-care reserve creates an immediate hospital-wide capacity constraint."
    },
    {
        id:"severe-projected-acute-capacity-deficit",
        title:"Severe Projected Acute-Care Capacity Deficit",
        description:"The four-hour forecast projects a deficit of at least 10 staffed acute-care beds and projected capacity pressure is severe relative to the historical baseline.",
        enabled:true,
        category:"Projected Capacity",
        priority:"Critical",
        conditions:[
            {
                metric:"projectedAvailableAcuteCareBeds",
                operator:"lessThanOrEqual",
                threshold:-10
            },
            {
                metric:"projectedCapacityScore",
                operator:"greaterThanOrEqual",
                threshold:80
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["connect-with-EVS-and-transport","Increase-acute-care-capacity","reallocate-staff-to-from CC","ED-Boarders-to-hallway","2E-assessment","notify-hospital-operations"],
        rationale:"A large projected deficit combined with severe deterioration relative to the historical projected-capacity baseline represents an unusually high near-term capacity risk."
    },
    {
        id:"consecutive-score-increases",
        title:"Sustained Operational Deterioration",
        description:"Hospital Readiness pressure has increased across at least three consecutive assessment transitions.",
        enabled:true,
        category:"Operational Momentum",
        priority:"High",
        conditions:[
            {
                metric:"consecutiveScoreIncreases",
                operator:"greaterThanOrEqual",
                threshold:3
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["notify-hospital-operations"],
        rationale:"Sustained deterioration may warrant escalation even before a single absolute capacity threshold becomes critical."
    },
    {
        id:"sustained-delta-echo",
        title:"Sustained Delta/Echo Operations",
        description:"The HRI operational level has remained at Delta or Echo for at least 6 consecutive assessments.",
        enabled:true,
        category:"Operational Momentum",
        priority:"Critical",
        conditions:[
            {
                metric:"consecutiveDeltaOrHigherAssessments",
                operator:"greaterThanOrEqual",
                threshold:6
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["Pause-kaiser","Consider-HICS-Activation"],
        rationale:"Sustained Delta or Echo conditions indicate prolonged severe operational strain and warrant consideration of higher-level system interventions."
    },
    {
        id:"extreme-ed-acuity-burden",
        title:"Extreme ED High-Acuity Burden",
        description:"At least 40% of the current ED census consists of ESI 1 or ESI 2 patients.",
        enabled:true,
        category:"ED Operational Pressure",
        priority:"High",
        conditions:[
            {
                metric:"highAcuityPercent",
                operator:"greaterThanOrEqual",
                threshold:40
            }
        ],
        minimumOperationalState:null,
        reassessmentMinutes:240,
        interventionIds:["reallocate-staff-to-ED"],
        rationale:"An extreme concentration of ESI 1 and ESI 2 patients can create substantial clinical workload and reduce ED operational reserve even when inpatient critical-care capacity remains available."
    },
];
