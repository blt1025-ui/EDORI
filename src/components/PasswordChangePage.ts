/**
 * PasswordChangePage
 *
 * Self-service password change for authenticated EDORI
 * users. Forced temporary-password changes use the same
 * interface but cannot be cancelled.
 */

import {

    cancelPasswordChange,
    changeCurrentPassword,
    isPasswordChangeForced

}

from "../services/AuthenticationService";


import {

    getCurrentUser

}

from "../services/UserService";


export function PasswordChangePage():string {

    const user =
        getCurrentUser();


    const forced =
        isPasswordChangeForced();


    return `

        <main
            class="edori-password-change-page"
            aria-labelledby="edoriPasswordChangeTitle"
        >

            <section class="edori-password-change-card">

                <div class="edori-password-change-icon">
                    🔐
                </div>


                <span class="edori-login-card-eyebrow">
                    Account Security
                </span>


                <h1 id="edoriPasswordChangeTitle">

                    ${forced
                        ? "Change your temporary password"
                        : "Change your password"
                    }

                </h1>


                <p>

                    ${forced
                        ? "Before continuing to EDORI, create a new password known only to you."
                        : "Update the password for your EDORI account."
                    }

                </p>


                <div class="edori-password-change-user">

                    <strong>
                        ${escapeHtml(
                            user?.displayName
                            ?? "EDORI User"
                        )}
                    </strong>

                    <span>
                        @${escapeHtml(
                            user?.username
                            ?? ""
                        )}
                    </span>

                </div>


                <form
                    id="edoriPasswordChangeForm"
                    class="edori-password-change-form"
                    novalidate
                >

                    <div class="edori-login-field">

                        <label for="edoriCurrentPassword">
                            Current password
                        </label>

                        <input
                            id="edoriCurrentPassword"
                            type="password"
                            autocomplete="current-password"
                            maxlength="128"
                            required
                        />

                    </div>


                    <div class="edori-login-field">

                        <label for="edoriNewPassword">
                            New password
                        </label>

                        <input
                            id="edoriNewPassword"
                            type="password"
                            autocomplete="new-password"
                            minlength="12"
                            maxlength="128"
                            required
                        />

                        <small>
                            Minimum 12 characters.
                        </small>

                    </div>


                    <div class="edori-login-field">

                        <label for="edoriConfirmNewPassword">
                            Confirm new password
                        </label>

                        <input
                            id="edoriConfirmNewPassword"
                            type="password"
                            autocomplete="new-password"
                            minlength="12"
                            maxlength="128"
                            required
                        />

                    </div>


                    <div
                        id="edoriPasswordChangeMessage"
                        class="edori-login-message"
                        aria-live="polite"
                        hidden
                    >
                    </div>


                    <div class="edori-password-change-actions">

                        ${forced
                            ? ""
                            : `
                                <button
                                    id="edoriCancelPasswordChangeButton"
                                    class="button button-secondary"
                                    type="button"
                                >
                                    Cancel
                                </button>
                            `
                        }


                        <button
                            id="edoriSavePasswordButton"
                            class="edori-login-submit"
                            type="submit"
                        >
                            Save New Password
                        </button>

                    </div>

                </form>

            </section>

        </main>

    `;

}


export function initializePasswordChangePage(

    onStateChanged:() => void

):void {

    const form =

        document.getElementById(

            "edoriPasswordChangeForm"

        ) as HTMLFormElement | null;


    const cancelButton =

        document.getElementById(

            "edoriCancelPasswordChangeButton"

        ) as HTMLButtonElement | null;


    form?.addEventListener(

        "submit",

        event => {

            event.preventDefault();

            void submitPasswordChange(
                onStateChanged
            );

        }

    );


    cancelButton?.addEventListener(

        "click",

        () => {

            if(cancelPasswordChange()){

                onStateChanged();

            }

        }

    );


    window.setTimeout(

        () => {

            const currentPassword =

                document.getElementById(

                    "edoriCurrentPassword"

                ) as HTMLInputElement | null;


            currentPassword?.focus();

        },

        0

    );

}


async function submitPasswordChange(

    onStateChanged:() => void

):Promise<void> {

    const currentPasswordInput =

        document.getElementById(

            "edoriCurrentPassword"

        ) as HTMLInputElement | null;


    const newPasswordInput =

        document.getElementById(

            "edoriNewPassword"

        ) as HTMLInputElement | null;


    const confirmPasswordInput =

        document.getElementById(

            "edoriConfirmNewPassword"

        ) as HTMLInputElement | null;


    if(

        !currentPasswordInput

        ||

        !newPasswordInput

        ||

        !confirmPasswordInput

    ){

        return;

    }


    const currentPassword =
        currentPasswordInput.value;


    const newPassword =
        newPasswordInput.value;


    const confirmation =
        confirmPasswordInput.value;


    if(

        !currentPassword

        ||

        !newPassword

        ||

        !confirmation

    ){

        showMessage(
            "Complete all password fields."
        );

        return;

    }


    if(newPassword.length < 12){

        showMessage(
            "The new password must contain at least 12 characters."
        );

        return;

    }


    if(newPassword !== confirmation){

        showMessage(
            "The new password and confirmation do not match."
        );

        return;

    }


    setSubmitting(
        true
    );


    try {

        const result =

            await changeCurrentPassword(

                currentPassword,

                newPassword

            );


        if(!result.success){

            showMessage(

                result.error
                ??
                "EDORI could not change the password."

            );

            currentPasswordInput.value = "";

            currentPasswordInput.focus();

            return;

        }


        onStateChanged();

    }
    finally {

        setSubmitting(
            false
        );

    }

}


function showMessage(

    message:string

):void {

    const element =

        document.getElementById(

            "edoriPasswordChangeMessage"

        );


    if(!element){

        return;

    }


    element.hidden =
        false;


    element.className =
        "edori-login-message edori-login-message-error";


    element.textContent =
        message;

}


function setSubmitting(

    submitting:boolean

):void {

    const button =

        document.getElementById(

            "edoriSavePasswordButton"

        ) as HTMLButtonElement | null;


    if(button){

        button.disabled =
            submitting;


        button.textContent =

            submitting
                ? "Saving..."
                : "Save New Password";

    }

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