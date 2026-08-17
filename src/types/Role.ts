/**
 * Role
 *
 * EDORI uses three application roles.
 */

export type RoleId =

    | "viewer"
    | "operator"
    | "administrator";


export interface RoleDefinition {

    id:RoleId;

    title:string;

    description:string;

}