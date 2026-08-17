/**
 * UserManagement
 *
 * Administrative EDORI user-management interface.
 *
 * Responsibilities:
 *
 * - Display the local EDORI user directory
 * - Create new users
 * - Edit existing users
 * - Change application roles
 * - Activate and deactivate users
 * - Display the currently authenticated user
 * - Configure initial passwords for new users
 * - Reset passwords for existing users
 * - Display credential status
 * - Enforce users.manage authorization
 * - Refresh automatically when USERS_CHANGED fires
 */

import {

    APP_EVENTS

}

from "../config/appEvents";


import type {

    RoleId

}

from "../types/Role";


import {

    ROLE_DEFINITIONS

}

from "../types/RoleDefinitions";


import type {

    User

}

from "../types/User";


import {

    hasPermission

}

from "../services/AuthorizationService";


import {

    createUser,
    getCurrentUser,
    getUsers,
    updateUser

}

from "../services/UserService";


import {

    getCredentialStatus,
    hasCredential,
    setPassword

}

from "../services/CredentialService";


import {

    recordSecurityAuditEvent

}

from "../services/SecurityAuditService";


import {

    subscribe

}

from "../services/EventService";


/**
 * Track the user currently being edited.
 *
 * null means the modal is in Add User mode.
 */
let editingUserId:string | null = null;


/**
 * Prevent duplicate event subscriptions if the
 * component is initialized more than once.
 */
let initialized = false;


/**
 * Render the User Management page.
 */
export function UserManagement():string {

    if(

        !hasPermission(
            "users.manage"
        )

    ){

        return renderAccessDenied();

    }


    return `

        <section
            id="userManagement"
            class="user-management"
        >

            <div class="user-management-header">

                <div>

                    <span class="application-page-eyebrow">
                        Administration
                    </span>

                    <h2>
                        User Management
                    </h2>

                    <p>
                        Manage EDORI users, application roles, and access status.
                    </p>

                </div>


                <div class="user-management-header-actions">

                    <button
                        id="addUserButton"
                        class="button button-primary"
                        type="button"
                    >
                        + Add User
                    </button>

                </div>

            </div>


            <div
                id="userManagementMessage"
                class="user-management-message"
                aria-live="polite"
            ></div>


            <div class="user-management-notice">

                <strong>
                    EDORI account access
                </strong>

                <span>
                    User roles control application permissions. Passwords are configured
                    separately and are never displayed after they are saved.
                </span>

            </div>


            <div class="user-management-toolbar">

                <div class="user-management-search">

                    <label for="userSearchInput">
                        Search
                    </label>

                    <input
                        id="userSearchInput"
                        type="search"
                        placeholder="Search name, username, or email"
                        autocomplete="off"
                    />

                </div>


                <div class="user-management-filter">

                    <label for="userRoleFilter">
                        Role
                    </label>

                    <select id="userRoleFilter">

                        <option value="all">
                            All roles
                        </option>

                        <option value="administrator">
                            Administrator
                        </option>

                        <option value="operator">
                            Operator
                        </option>

                        <option value="viewer">
                            Viewer
                        </option>

                    </select>

                </div>


                <div class="user-management-filter">

                    <label for="userStatusFilter">
                        Status
                    </label>

                    <select id="userStatusFilter">

                        <option value="all">
                            All users
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>

                    </select>

                </div>

            </div>


            <div
                id="userDirectorySummary"
                class="user-directory-summary"
            ></div>


            <div class="user-management-table-wrapper">

                <table class="user-management-table">

                    <thead>

                        <tr>

                            <th>
                                User
                            </th>

                            <th>
                                Username
                            </th>

                            <th>
                                Role
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Password
                            </th>

                            <th>
                                Last Updated
                            </th>

                            <th>
                                Actions
                            </th>

                        </tr>

                    </thead>


                    <tbody id="userManagementTableBody">

                        ${renderUserRows()}

                    </tbody>

                </table>

            </div>


            <div
                id="userManagementEmptyState"
                class="user-management-empty-state"
                hidden
            >

                No users match the selected filters.

            </div>


            ${renderUserEditor()}

        </section>

    `;

}


/**
 * Initialize User Management interactions.
 */
export function initializeUserManagement():void {

    if(

        !hasPermission(
            "users.manage"
        )

    ){

        return;

    }


    bindUserManagementControls();


    refreshUserManagement();


    /*
     * Subscribe only once for the application lifetime.
     */
    if(!initialized){

        subscribe(

            APP_EVENTS.USERS_CHANGED,

            () => {

                refreshUserManagement();

            }

        );


        initialized = true;

    }

}


/**
 * Bind controls currently rendered in the page.
 */
function bindUserManagementControls():void {

    const addUserButton =

        document.getElementById(
            "addUserButton"
        );


    addUserButton?.addEventListener(

        "click",

        () => {

            openUserEditor(
                null
            );

        }

    );


    const searchInput =

        document.getElementById(
            "userSearchInput"
        ) as HTMLInputElement | null;


    searchInput?.addEventListener(

        "input",

        () => {

            refreshUserTable();

        }

    );


    const roleFilter =

        document.getElementById(
            "userRoleFilter"
        ) as HTMLSelectElement | null;


    roleFilter?.addEventListener(

        "change",

        () => {

            refreshUserTable();

        }

    );


    const statusFilter =

        document.getElementById(
            "userStatusFilter"
        ) as HTMLSelectElement | null;


    statusFilter?.addEventListener(

        "change",

        () => {

            refreshUserTable();

        }

    );


    bindUserEditorControls();

}


/**
 * Bind modal/editor controls.
 */
function bindUserEditorControls():void {

    const form =

        document.getElementById(
            "userEditorForm"
        ) as HTMLFormElement | null;


    form?.addEventListener(

        "submit",

        event => {

            event.preventDefault();

            void saveUserEditor();

        }

    );


    const cancelButton =

        document.getElementById(
            "cancelUserEditorButton"
        );


    cancelButton?.addEventListener(

        "click",

        () => {

            closeUserEditor();

        }

    );


    const closeButton =

        document.getElementById(
            "closeUserEditorButton"
        );


    closeButton?.addEventListener(

        "click",

        () => {

            closeUserEditor();

        }

    );


    const backdrop =

        document.getElementById(
            "userEditorBackdrop"
        );


    backdrop?.addEventListener(

        "click",

        event => {

            if(

                event.target
                ===
                backdrop

            ){

                closeUserEditor();

            }

        }

    );


    document.addEventListener(

        "keydown",

        handleUserEditorEscape

    );

}


/**
 * Close editor with Escape.
 */
function handleUserEditorEscape(

    event:KeyboardEvent

):void {

    if(event.key !== "Escape"){

        return;

    }


    const backdrop =

        document.getElementById(
            "userEditorBackdrop"
        );


    if(

        backdrop

        &&

        !backdrop.hasAttribute(
            "hidden"
        )

    ){

        closeUserEditor();

    }

}


/**
 * Refresh all dynamic User Management content.
 */
function refreshUserManagement():void {

    if(

        !document.getElementById(
            "userManagement"
        )

    ){

        return;

    }


    refreshUserTable();

}


/**
 * Refresh user table and directory summary.
 */
function refreshUserTable():void {

    const tbody =

        document.getElementById(
            "userManagementTableBody"
        );


    if(!tbody){

        return;

    }


    const users =

        getFilteredUsers();


    tbody.innerHTML =

        users
            .map(
                renderUserRow
            )
            .join("");


    bindUserRowControls();


    const emptyState =

        document.getElementById(
            "userManagementEmptyState"
        );


    if(emptyState){

        emptyState.hidden =

            users.length > 0;

    }


    renderDirectorySummary();

}


/**
 * Bind Edit buttons after table rendering.
 */
function bindUserRowControls():void {

    const buttons =

        document.querySelectorAll<HTMLButtonElement>(
            "[data-edit-user-id]"
        );


    buttons.forEach(

        button => {

            button.addEventListener(

                "click",

                () => {

                    const userId =

                        button.dataset.editUserId;


                    if(!userId){

                        return;

                    }


                    openUserEditor(
                        userId
                    );

                }

            );

        }

    );

}


/**
 * Filter users according to toolbar state.
 */
function getFilteredUsers():User[] {

    const users =

        getUsers();


    const searchInput =

        document.getElementById(
            "userSearchInput"
        ) as HTMLInputElement | null;


    const roleFilter =

        document.getElementById(
            "userRoleFilter"
        ) as HTMLSelectElement | null;


    const statusFilter =

        document.getElementById(
            "userStatusFilter"
        ) as HTMLSelectElement | null;


    const search =

        searchInput?.value
            .trim()
            .toLowerCase()

        ?? "";


    const role =

        roleFilter?.value

        ?? "all";


    const status =

        statusFilter?.value

        ?? "all";


    return users.filter(

        user => {

            const matchesSearch =

                search.length === 0

                ||

                user.displayName
                    .toLowerCase()
                    .includes(
                        search
                    )

                ||

                user.username
                    .toLowerCase()
                    .includes(
                        search
                    )

                ||

                user.email
                    .toLowerCase()
                    .includes(
                        search
                    );


            const matchesRole =

                role === "all"

                ||

                user.role === role;


            const matchesStatus =

                status === "all"

                ||

                (
                    status === "active"
                    &&
                    user.active
                )

                ||

                (
                    status === "inactive"
                    &&
                    !user.active
                );


            return (

                matchesSearch

                &&

                matchesRole

                &&

                matchesStatus

            );

        }

    );

}


/**
 * Render initial rows.
 */
function renderUserRows():string {

    return getUsers()

        .map(
            renderUserRow
        )

        .join("");

}


/**
 * Render one user.
 */
function renderUserRow(

    user:User

):string {

    const currentUser =

        getCurrentUser();


    const roleDefinition =

        ROLE_DEFINITIONS[
            user.role
        ];


    const isCurrentUser =

        currentUser?.id
        ===
        user.id;


    return `

        <tr
            class="
                user-management-row
                ${!user.active
                    ? "user-management-row-inactive"
                    : ""
                }
            "
        >

            <td>

                <div class="user-identity-cell">

                    <div class="user-avatar">

                        ${escapeHtml(
                            getUserInitials(
                                user.displayName
                            )
                        )}

                    </div>


                    <div>

                        <div class="user-display-name">

                            ${escapeHtml(
                                user.displayName
                            )}

                            ${isCurrentUser

                                ? `
                                    <span class="user-current-badge">
                                        Current
                                    </span>
                                `

                                : ""

                            }

                        </div>


                        <div class="user-email">

                            ${user.email

                                ? escapeHtml(
                                    user.email
                                )

                                : "No email entered"

                            }

                        </div>

                    </div>

                </div>

            </td>


            <td>

                <span class="user-username">

                    ${escapeHtml(
                        user.username
                    )}

                </span>

            </td>


            <td>

                <span
                    class="
                        user-role-badge
                        user-role-${user.role}
                    "
                    title="${escapeHtml(
                        roleDefinition.description
                    )}"
                >

                    ${escapeHtml(
                        roleDefinition.title
                    )}

                </span>

            </td>


            <td>

                <span
                    class="
                        user-status-badge
                        ${user.active
                            ? "user-status-active"
                            : "user-status-inactive"
                        }
                    "
                >

                    ${user.active
                        ? "Active"
                        : "Inactive"
                    }

                </span>

            </td>


            <td>

                <span
                    class="
                        user-credential-badge
                        ${!hasCredential(user.id)
                            ? "user-credential-missing"
                            : (
                                getCredentialStatus(
                                    user.id
                                ).mustChangePassword
                                    ? "user-credential-change-required"
                                    : "user-credential-configured"
                            )
                        }
                    "
                >

                    ${!hasCredential(user.id)
                        ? "Not configured"
                        : (
                            getCredentialStatus(
                                user.id
                            ).mustChangePassword
                                ? "Change required"
                                : "Configured"
                        )
                    }

                </span>

            </td>


            <td>

                ${escapeHtml(
                    formatDateTime(
                        user.updatedAt
                    )
                )}

            </td>


            <td>

                <button
                    type="button"
                    class="button button-secondary button-small"
                    data-edit-user-id="${escapeHtml(
                        user.id
                    )}"
                >
                    Edit
                </button>

            </td>

        </tr>

    `;

}


/**
 * Render directory summary.
 */
function renderDirectorySummary():void {

    const container =

        document.getElementById(
            "userDirectorySummary"
        );


    if(!container){

        return;

    }


    const users =

        getUsers();


    const activeUsers =

        users.filter(
            user =>
                user.active
        ).length;


    const administrators =

        users.filter(

            user =>
                user.active
                &&
                user.role === "administrator"

        ).length;


    const credentialedUsers =

        users.filter(

            user =>
                hasCredential(
                    user.id
                )

        ).length;


    container.innerHTML = `

        <span>
            <strong>${users.length}</strong>
            total user${users.length === 1 ? "" : "s"}
        </span>

        <span>
            <strong>${activeUsers}</strong>
            active
        </span>

        <span>
            <strong>${credentialedUsers}</strong>
            password${credentialedUsers === 1 ? "" : "s"} configured
        </span>

        <span>
            <strong>${administrators}</strong>
            active administrator${administrators === 1 ? "" : "s"}
        </span>

    `;

}


/**
 * Render Add/Edit User editor.
 */
function renderUserEditor():string {

    return `

        <div
            id="userEditorBackdrop"
            class="user-editor-backdrop"
            hidden
        >

            <div
                class="user-editor-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="userEditorTitle"
            >

                <div class="user-editor-header">

                    <div>

                        <span class="application-page-eyebrow">
                            User Access
                        </span>

                        <h3 id="userEditorTitle">
                            Add User
                        </h3>

                    </div>


                    <button
                        id="closeUserEditorButton"
                        type="button"
                        class="user-editor-close"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <form id="userEditorForm">

                    <div
                        id="userEditorMessage"
                        class="user-editor-message"
                        aria-live="polite"
                    ></div>


                    <div class="user-editor-grid">

                        <div class="form-field">

                            <label for="userDisplayNameInput">
                                Display name
                            </label>

                            <input
                                id="userDisplayNameInput"
                                type="text"
                                required
                                maxlength="120"
                                autocomplete="off"
                            />

                        </div>


                        <div class="form-field">

                            <label for="userUsernameInput">
                                Username
                            </label>

                            <input
                                id="userUsernameInput"
                                type="text"
                                required
                                maxlength="80"
                                autocomplete="off"
                            />

                        </div>


                        <div class="form-field user-editor-full-width">

                            <label for="userEmailInput">
                                Email
                            </label>

                            <input
                                id="userEmailInput"
                                type="email"
                                maxlength="160"
                                autocomplete="off"
                            />

                        </div>


                        <div class="form-field user-editor-full-width">

                            <label for="userRoleInput">
                                Application role
                            </label>

                            <select
                                id="userRoleInput"
                                required
                            >

                                ${renderRoleOptions()}

                            </select>


                            <div
                                id="userRoleDescription"
                                class="user-role-description"
                            ></div>

                        </div>


                        <div
                            id="userPasswordSection"
                            class="
                                user-password-section
                                user-editor-full-width
                            "
                        >

                            <div class="user-password-section-header">

                                <div>

                                    <strong id="userPasswordSectionTitle">
                                        Initial password
                                    </strong>

                                    <small id="userPasswordSectionDescription">
                                        Set a temporary password. The user must change it at first sign-in.
                                    </small>

                                </div>

                                <span
                                    id="userCredentialStatus"
                                    class="user-credential-inline-status"
                                >
                                </span>

                            </div>


                            <div class="user-password-grid">

                                <div class="form-field">

                                    <label for="userPasswordInput">
                                        Password
                                    </label>

                                    <input
                                        id="userPasswordInput"
                                        type="password"
                                        minlength="12"
                                        maxlength="128"
                                        autocomplete="new-password"
                                    />

                                </div>


                                <div class="form-field">

                                    <label for="userPasswordConfirmInput">
                                        Confirm password
                                    </label>

                                    <input
                                        id="userPasswordConfirmInput"
                                        type="password"
                                        minlength="12"
                                        maxlength="128"
                                        autocomplete="new-password"
                                    />

                                </div>

                            </div>


                            <div class="user-password-help">
                                Passwords must contain at least 12 characters.
                                Existing passwords are never displayed.
                            </div>

                        </div>


                        <div
                            id="userActiveField"
                            class="form-field user-editor-full-width"
                        >

                            <label class="user-active-control">

                                <input
                                    id="userActiveInput"
                                    type="checkbox"
                                    checked
                                />

                                <span>

                                    <strong>
                                        Active user
                                    </strong>

                                    <small>
                                        Inactive users cannot sign in to EDORI.
                                    </small>

                                </span>

                            </label>

                        </div>

                    </div>


                    <div class="user-editor-actions">

                        <button
                            id="cancelUserEditorButton"
                            type="button"
                            class="button button-secondary"
                        >
                            Cancel
                        </button>


                        <button
                            id="saveUserButton"
                            type="submit"
                            class="button button-primary"
                        >
                            Save User
                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;

}


/**
 * Render role selector choices from the authoritative
 * role-definition object.
 */
function renderRoleOptions():string {

    const roleIds:RoleId[] = [

        "viewer",
        "operator",
        "administrator"

    ];


    return roleIds

        .map(

            roleId => {

                const definition =

                    ROLE_DEFINITIONS[
                        roleId
                    ];


                return `

                    <option value="${definition.id}">

                        ${escapeHtml(
                            definition.title
                        )}

                    </option>

                `;

            }

        )

        .join("");

}


/**
 * Open editor in Add or Edit mode.
 */
function openUserEditor(

    userId:string | null

):void {

    editingUserId =

        userId;


    const backdrop =

        document.getElementById(
            "userEditorBackdrop"
        );


    const title =

        document.getElementById(
            "userEditorTitle"
        );


    const displayNameInput =

        document.getElementById(
            "userDisplayNameInput"
        ) as HTMLInputElement | null;


    const usernameInput =

        document.getElementById(
            "userUsernameInput"
        ) as HTMLInputElement | null;


    const emailInput =

        document.getElementById(
            "userEmailInput"
        ) as HTMLInputElement | null;


    const roleInput =

        document.getElementById(
            "userRoleInput"
        ) as HTMLSelectElement | null;


    const activeInput =

        document.getElementById(
            "userActiveInput"
        ) as HTMLInputElement | null;


    const activeField =

        document.getElementById(
            "userActiveField"
        );


    const passwordInput =

        document.getElementById(
            "userPasswordInput"
        ) as HTMLInputElement | null;


    const passwordConfirmInput =

        document.getElementById(
            "userPasswordConfirmInput"
        ) as HTMLInputElement | null;


    const passwordSectionTitle =

        document.getElementById(
            "userPasswordSectionTitle"
        );


    const passwordSectionDescription =

        document.getElementById(
            "userPasswordSectionDescription"
        );


    const credentialStatus =

        document.getElementById(
            "userCredentialStatus"
        );


    clearEditorMessage();


    if(

        !backdrop

        ||

        !displayNameInput

        ||

        !usernameInput

        ||

        !emailInput

        ||

        !roleInput

        ||

        !activeInput

        ||

        !passwordInput

        ||

        !passwordConfirmInput

    ){

        return;

    }


    if(userId){

        const user =

            getUsers().find(

                candidate =>
                    candidate.id === userId

            );


        if(!user){

            showPageMessage(
                "The selected user could not be found.",
                true
            );

            return;

        }


        if(title){

            title.textContent =
                "Edit User";

        }


        displayNameInput.value =
            user.displayName;


        usernameInput.value =
            user.username;


        emailInput.value =
            user.email;


        roleInput.value =
            user.role;


        activeInput.checked =
            user.active;


        if(activeField){

            activeField.hidden =
                false;

        }


        passwordInput.value =
            "";


        passwordConfirmInput.value =
            "";


        passwordInput.required =
            false;


        passwordConfirmInput.required =
            false;


        if(passwordSectionTitle){

            passwordSectionTitle.textContent =
                "Reset password";

        }


        if(passwordSectionDescription){

            passwordSectionDescription.textContent =
                "Leave both fields blank to keep the current password. A reset requires a change at next sign-in.";

        }


        if(credentialStatus){

            const configured =
                hasCredential(
                    user.id
                );


            const credentialState =
                getCredentialStatus(
                    user.id
                );


            credentialStatus.textContent =

                !configured
                    ? "No password configured"
                    : (
                        credentialState.mustChangePassword
                            ? "Change required"
                            : "Password configured"
                    );


            credentialStatus.className =

                `user-credential-inline-status ${
                    !configured
                        ? "user-credential-inline-missing"
                        : (
                            credentialState.mustChangePassword
                                ? "user-credential-inline-change-required"
                                : "user-credential-inline-configured"
                        )
                }`;

        }

    }

    else{

        if(title){

            title.textContent =
                "Add User";

        }


        displayNameInput.value =
            "";


        usernameInput.value =
            "";


        emailInput.value =
            "";


        roleInput.value =
            "viewer";


        activeInput.checked =
            true;


        /*
         * New users are always created active.
         */
        if(activeField){

            activeField.hidden =
                true;

        }


        passwordInput.value =
            "";


        passwordConfirmInput.value =
            "";


        passwordInput.required =
            true;


        passwordConfirmInput.required =
            true;


        if(passwordSectionTitle){

            passwordSectionTitle.textContent =
                "Initial password";

        }


        if(passwordSectionDescription){

            passwordSectionDescription.textContent =
                "Set a temporary password. The user must change it at first sign-in.";

        }


        if(credentialStatus){

            credentialStatus.textContent =
                "Required";


            credentialStatus.className =
                "user-credential-inline-status user-credential-inline-missing";

        }

    }


    updateRoleDescription();


    roleInput.onchange =

        () => {

            updateRoleDescription();

        };


    backdrop.removeAttribute(
        "hidden"
    );


    /*
     * Move keyboard focus into the dialog.
     */
    window.setTimeout(

        () => {

            displayNameInput.focus();

        },

        0

    );

}


/**
 * Close user editor.
 */
function closeUserEditor():void {

    const backdrop =

        document.getElementById(
            "userEditorBackdrop"
        );


    if(backdrop){

        backdrop.setAttribute(
            "hidden",
            ""
        );

    }


    editingUserId =
        null;


    clearEditorMessage();

}


/**
 * Save Add/Edit form.
 */
async function saveUserEditor():Promise<void> {

    if(

        !hasPermission(
            "users.manage"
        )

    ){

        showEditorMessage(
            "You do not have permission to manage users.",
            true
        );

        return;

    }


    const displayNameInput =

        document.getElementById(
            "userDisplayNameInput"
        ) as HTMLInputElement | null;


    const usernameInput =

        document.getElementById(
            "userUsernameInput"
        ) as HTMLInputElement | null;


    const emailInput =

        document.getElementById(
            "userEmailInput"
        ) as HTMLInputElement | null;


    const roleInput =

        document.getElementById(
            "userRoleInput"
        ) as HTMLSelectElement | null;


    const activeInput =

        document.getElementById(
            "userActiveInput"
        ) as HTMLInputElement | null;


    const passwordInput =

        document.getElementById(
            "userPasswordInput"
        ) as HTMLInputElement | null;


    const passwordConfirmInput =

        document.getElementById(
            "userPasswordConfirmInput"
        ) as HTMLInputElement | null;


    if(

        !displayNameInput

        ||

        !usernameInput

        ||

        !emailInput

        ||

        !roleInput

        ||

        !activeInput

        ||

        !passwordInput

        ||

        !passwordConfirmInput

    ){

        showEditorMessage(
            "The user form could not be read.",
            true
        );

        return;

    }


    const role =

        roleInput.value as RoleId;


    if(

        role !== "viewer"

        &&

        role !== "operator"

        &&

        role !== "administrator"

    ){

        showEditorMessage(
            "Select a valid EDORI role.",
            true
        );

        return;

    }


    const password =
        passwordInput.value;


    const passwordConfirmation =
        passwordConfirmInput.value;


    const passwordChangeRequested =

        password.length > 0

        ||

        passwordConfirmation.length > 0;


    if(
        !editingUserId
        &&
        !passwordChangeRequested
    ){

        showEditorMessage(
            "An initial password is required for a new user.",
            true
        );

        return;

    }


    if(passwordChangeRequested){

        if(password.length < 12){

            showEditorMessage(
                "Passwords must contain at least 12 characters.",
                true
            );

            return;

        }


        if(password.length > 128){

            showEditorMessage(
                "Passwords cannot exceed 128 characters.",
                true
            );

            return;

        }


        if(password !== passwordConfirmation){

            showEditorMessage(
                "The password and confirmation do not match.",
                true
            );

            return;

        }

    }


    setUserEditorSubmittingState(
        true
    );


    const actor =
        getCurrentUser();


    try {

        if(editingUserId){

            const existingUser =

                getUsers().find(

                    user =>
                        user.id
                        ===
                        editingUserId

                )

                ?? null;


            const updatedUser =

                updateUser(

                    editingUserId,

                    {
                        displayName:
                            displayNameInput.value,

                        username:
                            usernameInput.value,

                        email:
                            emailInput.value,

                        role,

                        active:
                            activeInput.checked
                    }

                );


            recordSecurityAuditEvent({

                eventType:
                    "user.updated",

                actor:
                    actor
                        ? {
                            userId:
                                actor.id,

                            username:
                                actor.username,

                            displayName:
                                actor.displayName
                        }
                        : null,

                target:{
                    userId:
                        updatedUser.id,

                    username:
                        updatedUser.username,

                    displayName:
                        updatedUser.displayName
                },

                success:
                    true,

                summary:
                    "Administrator updated an EDORI user account."

            });


            if(

                existingUser

                &&

                existingUser.role
                !==
                updatedUser.role

            ){

                recordSecurityAuditEvent({

                    eventType:
                        "user.role.changed",

                    actor:
                        actor
                            ? {
                                userId:
                                    actor.id,

                                username:
                                    actor.username,

                                displayName:
                                    actor.displayName
                            }
                            : null,

                    target:{
                        userId:
                            updatedUser.id,

                        username:
                            updatedUser.username,

                        displayName:
                            updatedUser.displayName
                    },

                    success:
                        true,

                    summary:
                        "Administrator changed an EDORI user role.",

                    details:{
                        previousRole:
                            existingUser.role,

                        newRole:
                            updatedUser.role
                    }

                });

            }


            if(

                existingUser

                &&

                existingUser.active
                !==
                updatedUser.active

            ){

                recordSecurityAuditEvent({

                    eventType:
                        "user.status.changed",

                    actor:
                        actor
                            ? {
                                userId:
                                    actor.id,

                                username:
                                    actor.username,

                                displayName:
                                    actor.displayName
                            }
                            : null,

                    target:{
                        userId:
                            updatedUser.id,

                        username:
                            updatedUser.username,

                        displayName:
                            updatedUser.displayName
                    },

                    success:
                        true,

                    summary:
                        updatedUser.active
                            ? "Administrator activated an EDORI user."
                            : "Administrator deactivated an EDORI user.",

                    details:{
                        active:
                            updatedUser.active
                    }

                });

            }


            if(passwordChangeRequested){

                await setPassword(

                    editingUserId,

                    password,

                    {
                        mustChangePassword:
                            true
                    }

                );


                recordSecurityAuditEvent({

                    eventType:
                        "authentication.password.reset",

                    actor:
                        actor
                            ? {
                                userId:
                                    actor.id,

                                username:
                                    actor.username,

                                displayName:
                                    actor.displayName
                            }
                            : null,

                    target:{
                        userId:
                            updatedUser.id,

                        username:
                            updatedUser.username,

                        displayName:
                            updatedUser.displayName
                    },

                    success:
                        true,

                    summary:
                        "Administrator reset an EDORI user password.",

                    details:{
                        mustChangePassword:
                            true
                    }

                });

            }


            showPageMessage(

                passwordChangeRequested
                    ? "User updated and password reset successfully."
                    : "User updated successfully.",

                false

            );

        }

        else{

            const createdUser =

                createUser({

                    displayName:
                        displayNameInput.value,

                    username:
                        usernameInput.value,

                    email:
                        emailInput.value,

                    role

                });


            await setPassword(

                createdUser.id,

                password,

                {
                    mustChangePassword:
                        true
                }

            );


            recordSecurityAuditEvent({

                eventType:
                    "user.created",

                actor:
                    actor
                        ? {
                            userId:
                                actor.id,

                            username:
                                actor.username,

                            displayName:
                                actor.displayName
                        }
                        : null,

                target:{
                    userId:
                        createdUser.id,

                    username:
                        createdUser.username,

                    displayName:
                        createdUser.displayName
                },

                success:
                    true,

                summary:
                    "Administrator created an EDORI user account.",

                details:{
                    role:
                        createdUser.role,

                    active:
                        createdUser.active
                }

            });


            recordSecurityAuditEvent({

                eventType:
                    "authentication.password.reset",

                actor:
                    actor
                        ? {
                            userId:
                                actor.id,

                            username:
                                actor.username,

                            displayName:
                                actor.displayName
                        }
                        : null,

                target:{
                    userId:
                        createdUser.id,

                    username:
                        createdUser.username,

                    displayName:
                        createdUser.displayName
                },

                success:
                    true,

                summary:
                    "Administrator configured a temporary password for a new EDORI user.",

                details:{
                    mustChangePassword:
                        true
                }

            });


            showPageMessage(
                "User created successfully. Login credentials are configured.",
                false
            );

        }


        closeUserEditor();

    }

    catch(error){

        const message =

            error instanceof Error

                ? error.message

                : "EDORI could not save the user.";


        showEditorMessage(
            message,
            true
        );

    }

    finally {

        setUserEditorSubmittingState(
            false
        );

    }

}


/**
 * Toggle user-editor submit controls.
 */
function setUserEditorSubmittingState(

    submitting:boolean

):void {

    const saveButton =

        document.getElementById(
            "saveUserButton"
        ) as HTMLButtonElement | null;


    const cancelButton =

        document.getElementById(
            "cancelUserEditorButton"
        ) as HTMLButtonElement | null;


    const closeButton =

        document.getElementById(
            "closeUserEditorButton"
        ) as HTMLButtonElement | null;


    if(saveButton){

        saveButton.disabled =
            submitting;


        saveButton.textContent =

            submitting
                ? "Saving..."
                : "Save User";

    }


    if(cancelButton){

        cancelButton.disabled =
            submitting;

    }


    if(closeButton){

        closeButton.disabled =
            submitting;

    }

}


/**
 * Update role-description help text.
 */
function updateRoleDescription():void {

    const roleInput =

        document.getElementById(
            "userRoleInput"
        ) as HTMLSelectElement | null;


    const description =

        document.getElementById(
            "userRoleDescription"
        );


    if(

        !roleInput

        ||

        !description

    ){

        return;

    }


    const role =

        roleInput.value as RoleId;


    const definition =

        ROLE_DEFINITIONS[
            role
        ];


    if(!definition){

        description.textContent =
            "";

        return;

    }


    description.textContent =

        definition.description;

}


/**
 * Show page-level feedback.
 */
function showPageMessage(

    message:string,

    error:boolean

):void {

    const element =

        document.getElementById(
            "userManagementMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        message;


    element.classList.toggle(
        "user-management-message-error",
        error
    );


    element.classList.toggle(
        "user-management-message-success",
        !error
    );

}


/**
 * Show editor validation/error feedback.
 */
function showEditorMessage(

    message:string,

    error:boolean

):void {

    const element =

        document.getElementById(
            "userEditorMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        message;


    element.classList.toggle(
        "user-editor-message-error",
        error
    );

}


/**
 * Clear modal message.
 */
function clearEditorMessage():void {

    const element =

        document.getElementById(
            "userEditorMessage"
        );


    if(!element){

        return;

    }


    element.textContent =
        "";


    element.classList.remove(
        "user-editor-message-error"
    );

}


/**
 * Render permission-denied page.
 */
function renderAccessDenied():string {

    return `

        <section class="user-management">

            <div class="user-management-header">

                <div>

                    <span class="application-page-eyebrow">
                        Administration
                    </span>

                    <h2>
                        User Management
                    </h2>

                </div>

            </div>


            <div class="user-management-access-denied">

                <h3>
                    Access Restricted
                </h3>

                <p>
                    Your EDORI role does not include permission
                    to manage application users.
                </p>

            </div>

        </section>

    `;

}


/**
 * Return initials for avatar rendering.
 */
function getUserInitials(

    displayName:string

):string {

    const parts =

        displayName
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if(parts.length === 0){

        return "?";

    }


    if(parts.length === 1){

        return parts[0]
            ?.substring(
                0,
                2
            )
            .toUpperCase()

            ?? "?";

    }


    const first =

        parts[0]?.charAt(0)

        ?? "";


    const last =

        parts[
            parts.length - 1
        ]?.charAt(0)

        ?? "";


    return (

        first
        +
        last

    ).toUpperCase();

}


/**
 * Human-readable date/time.
 */
function formatDateTime(

    value:string

):string {

    const date =

        new Date(
            value
        );


    if(

        Number.isNaN(
            date.getTime()
        )

    ){

        return "Unknown";

    }


    return date.toLocaleString(

        undefined,

        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }

    );

}


/**
 * Basic HTML encoding for persisted user-entered text.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            "\"",
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}