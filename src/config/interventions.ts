/**
 * EDORI Operational Intervention Library
 *
 * Provides configured actions referenced by
 * operational trigger rules.
 *
 * These actions are decision-support suggestions.
 * They do not replace local policy, leadership
 * authority, or clinical judgment.
 */

import type {

    OperationalIntervention

}

from "../types/OperationalIntervention";


export const OPERATIONAL_INTERVENTIONS:

OperationalIntervention[] = [

    {

        id:
            "review-ed-capacity",

        title:
            "Review Available ED Capacity",

        description:
            "Review current treatment-space use, closed or unavailable rooms, hallway care areas, and opportunities to restore functional ED capacity.",

        category:
            "ED Capacity",

        defaultPriority:
            "Moderate",

        responsibleGroup:
            "ED Leadership",

        objective:
            "Identify immediately available emergency department treatment capacity.",

        reassessmentMinutes:
            60,

        enabled:
            true

    },


    {

        id:
            "evaluate-overflow-space",

        title:
            "Evaluate Overflow Treatment Space",

        description:
            "Assess whether approved overflow or alternate treatment areas should be opened based on current census, boarding burden, staffing capability, and local surge procedures.",

        category:
            "ED Capacity",

        defaultPriority:
            "High",

        responsibleGroup:
            "ED Leadership",

        objective:
            "Increase functional treatment capacity during demand above normal operating limits.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "review-ed-flow",

        title:
            "Review ED Patient Flow",

        description:
            "Review current intake, diagnostic, disposition, and discharge barriers that may be contributing to ED census growth.",

        category:
            "ED Flow",

        defaultPriority:
            "Moderate",

        responsibleGroup:
            "ED Leadership",

        objective:
            "Identify and address current barriers delaying emergency department throughput.",

        reassessmentMinutes:
            60,

        enabled:
            true

    },


    {

        id:
            "notify-ed-leadership",

        title:
            "Notify ED Leadership",

        description:
            "Notify the appropriate emergency department nursing and medical leaders of the current operational conditions and active triggers.",

        category:
            "Leadership Escalation",

        defaultPriority:
            "High",

        responsibleGroup:
            "Charge Nurse or ED Operations Lead",

        objective:
            "Ensure department leadership has timely situational awareness and can coordinate escalation.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "notify-bed-management",

        title:
            "Notify Bed Management",

        description:
            "Notify bed-management and patient-flow teams of the current boarding burden and request focused review of admission placement barriers.",

        category:
            "Boarding",

        defaultPriority:
            "High",

        responsibleGroup:
            "Bed Management",

        objective:
            "Accelerate movement of admitted patients from the ED to appropriate inpatient locations.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "review-boarding-barriers",

        title:
            "Review Boarding Barriers",

        description:
            "Review admitted ED patients for unresolved placement, specialty, isolation, transport, staffing, or bed-readiness barriers.",

        category:
            "Boarding",

        defaultPriority:
            "High",

        responsibleGroup:
            "Bed Management and Hospital Operations",

        objective:
            "Identify actionable causes of prolonged ED boarding.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "escalate-inpatient-throughput",

        title:
            "Escalate Inpatient Throughput",

        description:
            "Escalate unresolved inpatient flow barriers and request coordinated review of bed assignment, discharge progression, transport, and bed turnover.",

        category:
            "Hospital Throughput",

        defaultPriority:
            "High",

        responsibleGroup:
            "Hospital Operations",

        objective:
            "Increase inpatient throughput and reduce admitted-patient boarding in the ED.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "review-pending-discharges",

        title:
            "Review Pending Inpatient Discharges",

        description:
            "Review anticipated and delayed inpatient discharges, identify barriers, and prioritize actions that may safely release medical-bed capacity.",

        category:
            "Hospital Throughput",

        defaultPriority:
            "High",

        responsibleGroup:
            "Inpatient Leadership and Hospital Operations",

        objective:
            "Create usable inpatient capacity for admitted emergency department patients.",

        reassessmentMinutes:
            60,

        enabled:
            true

    },


    {

        id:
            "notify-hospital-operations",

        title:
            "Notify Hospital Operations",

        description:
            "Notify the hospital operations leader, nursing supervisor, or designated command structure of the active ED operational triggers.",

        category:
            "Leadership Escalation",

        defaultPriority:
            "Immediate",

        responsibleGroup:
            "Hospital Operations",

        objective:
            "Establish coordinated hospital-wide awareness and intervention.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "activate-hospital-surge",

        title:
            "Consider Hospital Surge Activation",

        description:
            "Evaluate activation of the appropriate hospital surge-plan tier according to local policy and leadership authority.",

        category:
            "Leadership Escalation",

        defaultPriority:
            "Immediate",

        responsibleGroup:
            "Hospital Operations and Executive Leadership",

        objective:
            "Coordinate the organizational response to severe ED and hospital capacity strain.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "prepare-for-demand-growth",

        title:
            "Prepare for Expected Demand Growth",

        description:
            "Review anticipated arrivals, available treatment capacity, pending dispositions, and operational resources in preparation for expected census growth.",

        category:
            "ED Flow",

        defaultPriority:
            "Moderate",

        responsibleGroup:
            "ED Leadership",

        objective:
            "Prepare the department before expected arrivals exceed expected departures.",

        reassessmentMinutes:
            60,

        enabled:
            true

    },


    {

        id:
            "review-clinical-assignments",

        title:
            "Review Clinical Assignments",

        description:
            "Review clinical assignments and distribution of high-acuity patients to ensure available teams and treatment areas are aligned with current patient complexity.",

        category:
            "Clinical Operations",

        defaultPriority:
            "High",

        responsibleGroup:
            "ED Nursing and Medical Leadership",

        objective:
            "Maintain safe distribution of high-acuity workload across available clinical teams.",

        reassessmentMinutes:
            60,

        enabled:
            true

    },


    {

        id:
            "increase-reassessment-frequency",

        title:
            "Increase EDORI Reassessment Frequency",

        description:
            "Repeat the EDORI assessment at a shorter interval until operational conditions stabilize or improve.",

        category:
            "Monitoring",

        defaultPriority:
            "High",

        responsibleGroup:
            "ED Operations Lead",

        objective:
            "Detect continued deterioration or improvement promptly.",

        reassessmentMinutes:
            30,

        enabled:
            true

    },


    {

        id:
            "review-active-triggers",

        title:
            "Review Active Operational Triggers",

        description:
            "Review all active and approaching EDORI triggers with the operational team and confirm that each relevant response has been considered.",

        category:
            "Monitoring",

        defaultPriority:
            "High",

        responsibleGroup:
            "ED and Hospital Operations",

        objective:
            "Ensure that active operational risks receive a coordinated response.",

        reassessmentMinutes:
            30,

        enabled:
            true

    }

];


/**
 * Return one enabled intervention by identifier.
 */
export function getOperationalIntervention(

    interventionId:string

):OperationalIntervention | null {

    const intervention =

        OPERATIONAL_INTERVENTIONS.find(

            item =>

                item.id === interventionId

                &&

                item.enabled

        );


    if(!intervention){

        return null;

    }


    return {

        ...intervention

    };

}


/**
 * Return all enabled interventions.
 */
export function getEnabledOperationalInterventions():

OperationalIntervention[] {

    return OPERATIONAL_INTERVENTIONS

        .filter(

            intervention =>

                intervention.enabled

        )

        .map(

            intervention => ({

                ...intervention

            })

        );

}