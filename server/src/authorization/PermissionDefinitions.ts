/**
 * PermissionDefinitions
 *
 * Server-authoritative EDORI permission model.
 */

export type RoleId =
    | "viewer"
    | "operator"
    | "administrator";

export type PermissionId =
    | "dashboard.view"
    | "assessment.view"
    | "assessment.submit"
    | "operational.view"
    | "administration.view"
    | "users.manage"
    | "configuration.manage"
    | "modelConfiguration.manage"
    | "historicalData.manage"
    | "triggerConfiguration.manage"
    | "surgePlan.manage"
    | "data.export"
    | "history.restore";

const ROLE_PERMISSIONS:Record<RoleId, readonly PermissionId[]> = {

    viewer:[
        "dashboard.view",
        "operational.view",
        "data.export"
    ],

    operator:[
        "dashboard.view",
        "assessment.view",
        "assessment.submit",
        "operational.view",
        "data.export"
    ],

    administrator:[
        "dashboard.view",
        "assessment.view",
        "assessment.submit",
        "operational.view",
        "administration.view",
        "users.manage",
        "configuration.manage",
        "modelConfiguration.manage",
        "historicalData.manage",
        "triggerConfiguration.manage",
        "surgePlan.manage",
        "data.export",
        "history.restore"
    ]

};


export function roleHasPermission(

    role:RoleId,

    permission:PermissionId

):boolean {

    return ROLE_PERMISSIONS[
        role
    ].includes(
        permission
    );

}


export function getPermissionsForRole(

    role:RoleId

):PermissionId[] {

    return [
        ...ROLE_PERMISSIONS[
            role
        ]
    ];

}