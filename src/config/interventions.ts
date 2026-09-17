/**
 * Hospital Readiness operational intervention library.
 * Updated from the approved HRI v2.2 trigger/recommendation workbook.
 */

import type { OperationalIntervention } from "../types/OperationalIntervention";

export const OPERATIONAL_INTERVENTIONS:OperationalIntervention[] = [
    {
        id:"evaluate-overflow-space",
        title:"Evaluate Overflow Treatment Space",
        description:"Assess whether approved overflow or alternate treatment areas should be opened based on current census, boarding burden, staffing capability, and local surge procedures.",
        category:"ED Capacity",
        defaultPriority:"High",
        responsibleGroup:"ED Nursing",
        objective:"Increase functional treatment capacity during demand above normal operating limits.",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"notify-hospital-operations",
        title:"Notify Hospital Operations",
        description:"Notify the hospital operations leader, nursing supervisor, or designated command structure of the active ED operational triggers.",
        category:"Leadership Escalation",
        defaultPriority:"High",
        responsibleGroup:"Hospital Operations",
        objective:"Establish coordinated hospital-wide awareness and intervention.",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Increase-acute-care-capacity",
        title:"Increase Acute Care Capacity",
        description:"Reassess acute-care staffing. Stretch assignments by up to 2 patients per unit when appropriate.\n\nReach out to the UMMS Staffing Center for potential additional resources if staffing is a barrier.",
        category:"Clinical Operations",
        defaultPriority:"Immediate",
        responsibleGroup:"Bed Management and Hospital Operations",
        objective:"Increase available bed capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Remove-Time-Restriction",
        title:"Remove Time Restrictions",
        description:"Blackout periods (08:00–08:30) and the 15-minute delay from .phrase entry to transport are no longer in effect.",
        category:"Hospital Throughput",
        defaultPriority:"Immediate",
        responsibleGroup:"ED Nursing",
        objective:"Decompress ED boarding",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"reallocate-staff-to-ED",
        title:"Reallocate Staff to ED Boarders",
        description:"If all inpatient units are at physical capacity, reassess staffing and, when feasible, redeploy staff to the ED to care for boarding patients.",
        category:"ED Flow",
        defaultPriority:"Immediate",
        responsibleGroup:"Nursing Operations and Bed Flow",
        objective:"Support ED boarding volumes",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"connect-with-EVS-and-transport",
        title:"Target Transport and EVS Staff",
        description:"Bed Flow will communicate needs with EVS and Transport to prioritize efforts around moving patients and turning over beds.",
        category:"Hospital Throughput",
        defaultPriority:"Immediate",
        responsibleGroup:"Bed Flow and Operations Leadership",
        objective:"Improve patient flow",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"reallocate-staff-to-from CC",
        title:"Reallocate Staff in Acute and Critical Care",
        description:"When appropriate, assess the ability to float nurses from ICU to IMC or from IMC to 8W/4W to increase staffed bed capacity in those areas.",
        category:"Clinical Operations",
        defaultPriority:"Immediate",
        responsibleGroup:"Critical Care and Acute Care Nursing",
        objective:"Increase staffed capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Bring-in-ICUIMC-Nurse",
        title:"Bring in Additional ICU/IMC Nurse",
        description:"If additional ICU physical space is available, consider the following as needed:\n- Bring in the on-call nurse\n- Pull in the Rapid Response nurse\n- Stretch 1–2 nurse assignments when appropriate\n- Pull in the second Rapid Response nurse\n- Pull in the ANM",
        category:"Clinical Operations",
        defaultPriority:"Immediate",
        responsibleGroup:"Critical Care Nursing",
        objective:"Increase critical-care capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Admit-ICU-Boarders-waiting-tx-out",
        title:"Admit ICU Boarders with Pending Transfers",
        description:"Admit ICU boarders to open physical ICU beds while waiting for acute-care-level downgrades to transfer out.\n\nThe admission can be taken by the RRT RN, Charge RN, or a temporarily stretched RN assignment while waiting for downgrades.",
        category:"Clinical Operations",
        defaultPriority:"Immediate",
        responsibleGroup:"Critical Care Nursing",
        objective:"Increase critical-care capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"ED-Boarders-to-hallway",
        title:"Pull ED Boarders to Hallways",
        description:"Move stable ED boarders to approved hallway locations while awaiting transport so treatment rooms can be turned over and returned to use more quickly.",
        category:"ED Flow",
        defaultPriority:"Immediate",
        responsibleGroup:"ED Nursing",
        objective:"Create usable patient-care space in the ED",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"2E-assessment",
        title:"Reassess Patients Referred to 2E",
        description:"Reassess consults sent to 2E for acceptance, including both ED and inpatient referrals.",
        category:"Hospital Throughput",
        defaultPriority:"High",
        responsibleGroup:"Psychiatry",
        objective:"Increase capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Pause-kaiser",
        title:"Consider Pausing Kaiser Transfers",
        description:"Assess support for pausing Kaiser transfers to 4S and 5S. Kaiser leadership must be notified.",
        category:"Leadership Escalation",
        defaultPriority:"High",
        responsibleGroup:"Executive Leadership",
        objective:"Increase capacity",
        reassessmentMinutes:240,
        enabled:true
    },
    {
        id:"Consider-HICS-Activation",
        title:"Consider HICS Activation",
        description:"The HRI operational level has remained at Delta or Echo for at least 6 consecutive assessments. Consider activation of HICS.",
        category:"Leadership Escalation",
        defaultPriority:"Immediate",
        responsibleGroup:"Hospital Operations",
        objective:"Assess resource utilization and additional operational opportunities",
        reassessmentMinutes:240,
        enabled:true
    },
];

/**
 * Resolve one enabled built-in operational intervention by identifier.
 *
 * OperationalAssessmentService relies on this helper when converting
 * active triggers into recommendations.
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

