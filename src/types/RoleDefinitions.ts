/**
 * RoleDefinitions
 *
 * Default EDORI role hierarchy and permission mappings.
 */

import type {

    Permission

}

from "./Permission";


import type {

    RoleDefinition,
    RoleId

}

from "./Role";


export const ROLE_DEFINITIONS:
Record<RoleId,RoleDefinition> = {

    viewer:{

        id:
            "viewer",

        title:
            "Viewer",

        description:
            "Read-only access to current Hospital Readiness information, trends, recommendations, and reports."

    },


    operator:{

        id:
            "operator",

        title:
            "Operator",

        description:
            "Operational user who can enter, calculate, and save assessments in addition to Viewer access."

    },


    administrator:{

        id:
            "administrator",

        title:
            "Administrator",

        description:
            "Full EDORI access including configuration, historical data, backup/restore, users, roles, and permissions."

    }

};


const VIEWER_PERMISSIONS:Permission[] = [

    "dashboard.view",

    "operationalDetail.view",

    "assessment.view",

    "assessmentHistory.view",

    "reports.view"

];


const OPERATOR_PERMISSIONS:Permission[] = [

    ...VIEWER_PERMISSIONS,

    "assessment.create",

    "assessment.save",

    "handoff.copy",

    "reports.export"

];


const ADMINISTRATOR_PERMISSIONS:Permission[] = [

    ...OPERATOR_PERMISSIONS,

    "administration.view",

    "historicalData.manage",

    "history.restore",

    "configurationBackup.manage",

    "modelConfiguration.manage",

    "triggerConfiguration.manage",

    "surgePlan.manage",

    "users.manage",

    "roles.manage"

];


export const ROLE_PERMISSIONS:
Record<RoleId,readonly Permission[]> = {

    viewer:
        VIEWER_PERMISSIONS,

    operator:
        OPERATOR_PERMISSIONS,

    administrator:
        ADMINISTRATOR_PERMISSIONS

};


/**
 * Return a defensive copy of one role's permissions.
 */
export function getRolePermissions(

    role:RoleId

):Permission[] {

    return [

        ...ROLE_PERMISSIONS[role]

    ];

}