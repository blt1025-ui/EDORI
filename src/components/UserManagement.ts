/**
 * UserManagement
 *
 * PostgreSQL-backed Administrator user-management UI.
 */

import {

    ROLE_DEFINITIONS

}

from "../types/RoleDefinitions";


import type {

    RoleId

}

from "../types/Role";


import type {

    User

}

from "../types/User";


import {

    getCurrentUser

}

from "../services/UserService";


import {

    createServerUser,
    loadServerUsers,
    resetServerUserPassword,
    updateServerUser

}

from "../services/UserDirectoryApiService";


let users:User[] = [];

let editingUserId:string | null = null;

let initialized = false;


export function UserManagement():string {

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
                        Manage centralized EDORI user accounts, roles, access status, and temporary passwords.
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
                    Centralized authentication
                </strong>

                <span>
                    Users and credentials are stored in PostgreSQL. New users receive a temporary password and must change it after signing in.
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


            <div
                id="userDirectoryTableContainer"
                class="user-directory-table-container"
            >
                <div class="user-management-empty">
                    Loading users...
                </div>
            </div>


            ${createEditorModal()}


            ${createPasswordResetModal()}

        </section>

    `;

}


export function initializeUserManagement():void {

    if(initialized){

        void refreshUsers();

        return;

    }


    initialized =
        true;


    document
        .getElementById(
            "addUserButton"
        )
        ?.addEventListener(
            "click",
            openCreateEditor
        );


    document
        .getElementById(
            "userSearchInput"
        )
        ?.addEventListener(
            "input",
            renderUsers
        );


    document
        .getElementById(
            "userRoleFilter"
        )
        ?.addEventListener(
            "change",
            renderUsers
        );


    document
        .getElementById(
            "userStatusFilter"
        )
        ?.addEventListener(
            "change",
            renderUsers
        );


    document
        .getElementById(
            "userEditorCancelButton"
        )
        ?.addEventListener(
            "click",
            closeEditor
        );


    document
        .getElementById(
            "userEditorSaveButton"
        )
        ?.addEventListener(

            "click",

            () => {

                void saveEditor();

            }

        );


    document
        .getElementById(
            "passwordResetCancelButton"
        )
        ?.addEventListener(
            "click",
            closePasswordReset
        );


    document
        .getElementById(
            "passwordResetSaveButton"
        )
        ?.addEventListener(

            "click",

            () => {

                void savePasswordReset();

            }

        );


    void refreshUsers();

}


async function refreshUsers():Promise<void> {

    try {

        users =
            await loadServerUsers();


        renderUsers();

    }
    catch(error){

        showPageMessage(
            getErrorMessage(
                error,
                "EDORI could not load users."
            ),
            true
        );

    }

}


function renderUsers():void {

    const container =

        document.getElementById(
            "userDirectoryTableContainer"
        );


    if(!container){

        return;

    }


    const filtered =
        getFilteredUsers();


    const activeCount =
        users.filter(
            user => user.active
        ).length;


    const adminCount =
        users.filter(
            user =>
                user.active
                &&
                user.role === "administrator"
        ).length;


    const summary =

        document.getElementById(
            "userDirectorySummary"
        );


    if(summary){

        summary.textContent =

            `${users.length} users · ${activeCount} active · ${adminCount} active Administrator${adminCount === 1 ? "" : "s"}`;

    }


    if(filtered.length === 0){

        container.innerHTML = `

            <div class="user-management-empty">
                No users match the selected filters.
            </div>

        `;


        return;

    }


    const currentUser =
        getCurrentUser();


    container.innerHTML = `

        <table class="user-directory-table">

            <thead>

                <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>

            </thead>

            <tbody>

                ${filtered
                    .map(
                        user =>
                            createUserRow(
                                user,
                                currentUser?.id === user.id
                            )
                    )
                    .join("")
                }

            </tbody>

        </table>

    `;


    container
        .querySelectorAll<HTMLButtonElement>(
            "[data-edit-user]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        openEditEditor(
                            button.dataset.editUser
                            ?? ""
                        );

                    }

                );

            }

        );


    container
        .querySelectorAll<HTMLButtonElement>(
            "[data-reset-user-password]"
        )
        .forEach(

            button => {

                button.addEventListener(

                    "click",

                    () => {

                        openPasswordReset(
                            button.dataset.resetUserPassword
                            ?? ""
                        );

                    }

                );

            }

        );

}


function createUserRow(

    user:User,

    current:boolean

):string {

    const role =

        ROLE_DEFINITIONS[
            user.role
        ];


    return `

        <tr>

            <td>

                <div class="user-directory-identity">

                    <strong>
                        ${escapeHtml(
                            user.displayName
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            user.email
                            || "No email"
                        )}
                    </span>

                    ${current
                        ? `
                            <small>
                                Current session
                            </small>
                        `
                        : ""
                    }

                </div>

            </td>

            <td>
                ${escapeHtml(
                    user.username
                )}
            </td>

            <td>
                ${escapeHtml(
                    role.title
                )}
            </td>

            <td>

                <span class="
                    user-status-badge
                    ${
                        user.active
                            ? "user-status-active"
                            : "user-status-inactive"
                    }
                ">
                    ${user.active
                        ? "Active"
                        : "Inactive"
                    }
                </span>

            </td>

            <td>

                <div class="user-directory-actions">

                    <button
                        type="button"
                        class="button button-secondary"
                        data-edit-user="${escapeAttribute(user.id)}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="button button-secondary"
                        data-reset-user-password="${escapeAttribute(user.id)}"
                    >
                        Reset Password
                    </button>

                </div>

            </td>

        </tr>

    `;

}


function getFilteredUsers():User[] {

    const search =

        (
            document.getElementById(
                "userSearchInput"
            ) as HTMLInputElement | null
        )?.value
            .trim()
            .toLowerCase()
        ?? "";


    const role =

        (
            document.getElementById(
                "userRoleFilter"
            ) as HTMLSelectElement | null
        )?.value
        ?? "all";


    const status =

        (
            document.getElementById(
                "userStatusFilter"
            ) as HTMLSelectElement | null
        )?.value
        ?? "all";


    return users.filter(

        user => {

            if(

                search

                &&

                ![
                    user.displayName,
                    user.username,
                    user.email
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(
                        search
                    )

            ){

                return false;

            }


            if(

                role !== "all"

                &&

                user.role !== role

            ){

                return false;

            }


            if(

                status === "active"

                &&

                !user.active

            ){

                return false;

            }


            if(

                status === "inactive"

                &&

                user.active

            ){

                return false;

            }


            return true;

        }

    );

}


function openCreateEditor():void {

    editingUserId =
        null;


    setText(
        "userEditorTitle",
        "Add User"
    );


    setInput(
        "userDisplayNameInput",
        ""
    );

    setInput(
        "userUsernameInput",
        ""
    );

    setInput(
        "userEmailInput",
        ""
    );

    setSelect(
        "userRoleInput",
        "viewer"
    );

    setCheckbox(
        "userActiveInput",
        true
    );


    const temporaryGroup =

        document.getElementById(
            "userTemporaryPasswordGroup"
        );


    if(temporaryGroup){

        temporaryGroup.hidden =
            false;

    }


    setInput(
        "userTemporaryPasswordInput",
        ""
    );


    showEditorMessage(
        "",
        false
    );


    showModal(
        "userEditorModal"
    );

}


function openEditEditor(

    userId:string

):void {

    const user =

        users.find(
            candidate =>
                candidate.id === userId
        );


    if(!user){

        return;

    }


    editingUserId =
        user.id;


    setText(
        "userEditorTitle",
        "Edit User"
    );


    setInput(
        "userDisplayNameInput",
        user.displayName
    );

    setInput(
        "userUsernameInput",
        user.username
    );

    setInput(
        "userEmailInput",
        user.email
    );

    setSelect(
        "userRoleInput",
        user.role
    );

    setCheckbox(
        "userActiveInput",
        user.active
    );


    const temporaryGroup =

        document.getElementById(
            "userTemporaryPasswordGroup"
        );


    if(temporaryGroup){

        temporaryGroup.hidden =
            true;

    }


    showEditorMessage(
        "",
        false
    );


    showModal(
        "userEditorModal"
    );

}


async function saveEditor():Promise<void> {

    const displayName =
        getInputValue(
            "userDisplayNameInput"
        );

    const username =
        getInputValue(
            "userUsernameInput"
        );

    const email =
        getInputValue(
            "userEmailInput"
        );

    const role =
        getRoleValue(
            "userRoleInput"
        );

    const active =
        getCheckboxValue(
            "userActiveInput"
        );


    if(

        !displayName

        ||

        !username

    ){

        showEditorMessage(
            "Display name and username are required.",
            true
        );

        return;

    }


    try {

        if(editingUserId){

            await updateServerUser(

                editingUserId,

                {
                    displayName,
                    username,
                    email,
                    role,
                    active
                }

            );


            showPageMessage(
                "User updated successfully.",
                false
            );

        }
        else {

            const temporaryPassword =

                getInputValue(
                    "userTemporaryPasswordInput"
                );


            if(!temporaryPassword){

                showEditorMessage(
                    "A temporary password is required.",
                    true
                );

                return;

            }


            await createServerUser({

                displayName,
                username,
                email,
                role,
                temporaryPassword

            });


            showPageMessage(
                "User created successfully. The user must change the temporary password after signing in.",
                false
            );

        }


        closeEditor();

        await refreshUsers();

    }
    catch(error){

        showEditorMessage(
            getErrorMessage(
                error,
                "EDORI could not save the user."
            ),
            true
        );

    }

}


function openPasswordReset(

    userId:string

):void {

    const user =

        users.find(
            candidate =>
                candidate.id === userId
        );


    if(!user){

        return;

    }


    const modal =

        document.getElementById(
            "passwordResetModal"
        );


    if(!modal){

        return;

    }


    modal.dataset.userId =
        user.id;


    setText(
        "passwordResetUserName",
        `${user.displayName} (${user.username})`
    );


    setInput(
        "passwordResetTemporaryInput",
        ""
    );


    setText(
        "passwordResetMessage",
        ""
    );


    showModal(
        "passwordResetModal"
    );

}


async function savePasswordReset():Promise<void> {

    const modal =

        document.getElementById(
            "passwordResetModal"
        );


    const userId =

        modal?.dataset.userId
        ?? "";


    const temporaryPassword =

        getInputValue(
            "passwordResetTemporaryInput"
        );


    if(

        !userId

        ||

        !temporaryPassword

    ){

        setText(
            "passwordResetMessage",
            "Enter a temporary password."
        );

        return;

    }


    try {

        await resetServerUserPassword(

            userId,

            temporaryPassword

        );


        closePasswordReset();


        showPageMessage(
            "Password reset successfully. Existing sessions were revoked and the user must change the temporary password after signing in.",
            false
        );

    }
    catch(error){

        setText(
            "passwordResetMessage",
            getErrorMessage(
                error,
                "EDORI could not reset the password."
            )
        );

    }

}


function closeEditor():void {

    editingUserId =
        null;


    hideModal(
        "userEditorModal"
    );

}


function closePasswordReset():void {

    hideModal(
        "passwordResetModal"
    );

}


function createEditorModal():string {

    return `

        <div
            id="userEditorModal"
            class="user-editor-modal"
            hidden
        >

            <div class="user-editor-dialog">

                <h3 id="userEditorTitle">
                    Add User
                </h3>


                <div class="user-editor-grid">

                    ${inputField(
                        "userDisplayNameInput",
                        "Display Name",
                        "text"
                    )}

                    ${inputField(
                        "userUsernameInput",
                        "Username",
                        "text"
                    )}

                    ${inputField(
                        "userEmailInput",
                        "Email",
                        "email"
                    )}


                    <label class="user-editor-field">

                        <span>
                            Role
                        </span>

                        <select id="userRoleInput">

                            <option value="viewer">
                                Viewer
                            </option>

                            <option value="operator">
                                Operator
                            </option>

                            <option value="administrator">
                                Administrator
                            </option>

                        </select>

                    </label>


                    <label class="user-editor-checkbox">

                        <input
                            id="userActiveInput"
                            type="checkbox"
                            checked
                        />

                        <span>
                            Active account
                        </span>

                    </label>


                    <label
                        id="userTemporaryPasswordGroup"
                        class="user-editor-field"
                    >

                        <span>
                            Temporary Password
                        </span>

                        <input
                            id="userTemporaryPasswordInput"
                            type="password"
                            autocomplete="new-password"
                        />

                        <small>
                            Minimum 12 characters. The user must change this password after first sign-in.
                        </small>

                    </label>

                </div>


                <div
                    id="userEditorMessage"
                    class="user-management-message"
                ></div>


                <div class="user-editor-actions">

                    <button
                        id="userEditorCancelButton"
                        class="button button-secondary"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        id="userEditorSaveButton"
                        class="button button-primary"
                        type="button"
                    >
                        Save User
                    </button>

                </div>

            </div>

        </div>

    `;

}


function createPasswordResetModal():string {

    return `

        <div
            id="passwordResetModal"
            class="user-editor-modal"
            hidden
        >

            <div class="user-editor-dialog">

                <h3>
                    Reset Password
                </h3>

                <p id="passwordResetUserName"></p>


                <label class="user-editor-field">

                    <span>
                        Temporary Password
                    </span>

                    <input
                        id="passwordResetTemporaryInput"
                        type="password"
                        autocomplete="new-password"
                    />

                    <small>
                        Minimum 12 characters. All current sessions for this user will be revoked.
                    </small>

                </label>


                <div
                    id="passwordResetMessage"
                    class="user-management-message"
                ></div>


                <div class="user-editor-actions">

                    <button
                        id="passwordResetCancelButton"
                        class="button button-secondary"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        id="passwordResetSaveButton"
                        class="button button-primary"
                        type="button"
                    >
                        Reset Password
                    </button>

                </div>

            </div>

        </div>

    `;

}


function inputField(

    id:string,

    label:string,

    type:string

):string {

    return `

        <label class="user-editor-field">

            <span>
                ${escapeHtml(label)}
            </span>

            <input
                id="${escapeAttribute(id)}"
                type="${escapeAttribute(type)}"
            />

        </label>

    `;

}


function showModal(

    id:string

):void {

    const modal =
        document.getElementById(
            id
        );


    if(modal){

        modal.hidden =
            false;

    }

}


function hideModal(

    id:string

):void {

    const modal =
        document.getElementById(
            id
        );


    if(modal){

        modal.hidden =
            true;

    }

}


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
        "user-management-message-error",
        error
    );

}


function getInputValue(

    id:string

):string {

    return (

        document.getElementById(
            id
        ) as HTMLInputElement | null

    )?.value.trim()
    ?? "";

}


function getCheckboxValue(

    id:string

):boolean {

    return (

        document.getElementById(
            id
        ) as HTMLInputElement | null

    )?.checked
    ?? false;

}


function getRoleValue(

    id:string

):RoleId {

    const value =

        (
            document.getElementById(
                id
            ) as HTMLSelectElement | null
        )?.value;


    if(

        value === "administrator"

        ||

        value === "operator"

        ||

        value === "viewer"

    ){

        return value;

    }


    return "viewer";

}


function setInput(

    id:string,

    value:string

):void {

    const element =

        document.getElementById(
            id
        ) as HTMLInputElement | null;


    if(element){

        element.value =
            value;

    }

}


function setSelect(

    id:string,

    value:string

):void {

    const element =

        document.getElementById(
            id
        ) as HTMLSelectElement | null;


    if(element){

        element.value =
            value;

    }

}


function setCheckbox(

    id:string,

    value:boolean

):void {

    const element =

        document.getElementById(
            id
        ) as HTMLInputElement | null;


    if(element){

        element.checked =
            value;

    }

}


function setText(

    id:string,

    value:string

):void {

    const element =

        document.getElementById(
            id
        );


    if(element){

        element.textContent =
            value;

    }

}


function getErrorMessage(

    error:unknown,

    fallback:string

):string {

    return error instanceof Error

        ? error.message

        : fallback;

}


function escapeHtml(

    value:string

):string {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(

    value:string

):string {

    return escapeHtml(
        value
    );

}