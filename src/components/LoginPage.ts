/**
 * LoginPage
 *
 * Username/password entry screen for EDORI.
 *
 * Authentication mechanics are delegated to
 * AuthenticationService so this component remains
 * presentation-focused.
 */

import {

    login

}

from "../services/AuthenticationService";


/**
 * Render the signed-out EDORI experience.
 */
export function LoginPage():string {

    return `

        <main
            class="edori-login-page"
            aria-labelledby="edoriLoginTitle"
        >

            <div class="edori-login-shell">

                <section class="edori-login-brand-panel">

                    <div class="edori-login-brand-mark">
                        HRI
                    </div>


                    <span class="edori-login-eyebrow">
                        Hospital Operations
                    </span>


                    <h1>
                        Hospital Readiness Index
                    </h1>


                    <p>
                        Operational decision support for emergency department
                        and hospital readiness.
                    </p>


                    <div class="edori-login-security-note">

                        <strong>
                            Authorized access only
                        </strong>

                        <span>
                            Sign in with your assigned EDORI username and password.
                        </span>

                    </div>

                </section>


                <section class="edori-login-card">

                    <div class="edori-login-card-header">

                        <span class="edori-login-card-eyebrow">
                            EDORI
                        </span>


                        <h2 id="edoriLoginTitle">
                            Sign in
                        </h2>


                        <p>
                            Enter your account credentials to continue.
                        </p>

                    </div>


                    <form
                        id="edoriLoginForm"
                        class="edori-login-form"
                        novalidate
                    >

                        <div class="edori-login-field">

                            <label for="edoriLoginUsername">
                                Username
                            </label>


                            <input
                                id="edoriLoginUsername"
                                name="username"
                                type="text"
                                autocomplete="username"
                                autocapitalize="none"
                                spellcheck="false"
                                maxlength="100"
                                required
                            />

                        </div>


                        <div class="edori-login-field">

                            <label for="edoriLoginPassword">
                                Password
                            </label>


                            <div class="edori-login-password-control">

                                <input
                                    id="edoriLoginPassword"
                                    name="password"
                                    type="password"
                                    autocomplete="current-password"
                                    maxlength="128"
                                    required
                                />


                                <button
                                    id="edoriTogglePasswordButton"
                                    class="edori-login-password-toggle"
                                    type="button"
                                    aria-pressed="false"
                                >
                                    Show
                                </button>

                            </div>

                        </div>


                        <div
                            id="edoriLoginMessage"
                            class="edori-login-message"
                            aria-live="polite"
                            hidden
                        >
                        </div>


                        <button
                            id="edoriLoginButton"
                            class="edori-login-submit"
                            type="submit"
                        >
                            Sign in
                        </button>

                    </form>


                    <div class="edori-login-footer">

                        <span>
                            EDORI · Hospital Readiness Index
                        </span>

                        <small>
                            Access is role-based and activity may be audited.
                        </small>

                    </div>

                </section>

            </div>

        </main>

    `;

}


/**
 * Initialize login-page behavior.
 */
export function initializeLoginPage():void {

    const form =

        document.getElementById(

            "edoriLoginForm"

        ) as HTMLFormElement | null;


    const usernameInput =

        document.getElementById(

            "edoriLoginUsername"

        ) as HTMLInputElement | null;


    const passwordInput =

        document.getElementById(

            "edoriLoginPassword"

        ) as HTMLInputElement | null;


    const togglePasswordButton =

        document.getElementById(

            "edoriTogglePasswordButton"

        ) as HTMLButtonElement | null;


    if(

        !form

        ||

        !usernameInput

        ||

        !passwordInput

    ){

        console.error(

            "EDORI login controls could not be initialized."

        );


        return;

    }


    form.addEventListener(

        "submit",

        event => {

            event.preventDefault();


            void handleLoginSubmission(

                usernameInput,

                passwordInput

            );

        }

    );


    togglePasswordButton?.addEventListener(

        "click",

        () => {

            const showing =

                passwordInput.type
                ===
                "text";


            passwordInput.type =

                showing
                    ? "password"
                    : "text";


            togglePasswordButton.textContent =

                showing
                    ? "Show"
                    : "Hide";


            togglePasswordButton.setAttribute(

                "aria-pressed",

                showing
                    ? "false"
                    : "true"

            );

        }

    );


    window.setTimeout(

        () => {

            usernameInput.focus();

        },

        0

    );

}


/**
 * Attempt username/password authentication.
 */
async function handleLoginSubmission(

    usernameInput:HTMLInputElement,

    passwordInput:HTMLInputElement

):Promise<void> {

    const username =

        usernameInput.value.trim();


    const password =

        passwordInput.value;


    if(

        username.length === 0

        ||

        password.length === 0

    ){

        showLoginMessage(

            "Enter both your username and password.",

            "error"

        );


        return;

    }


    setLoginSubmittingState(
        true
    );


    clearLoginMessage();


    try {

        const result =

            await login(

                username,

                password

            );


        if(!result.success){

            passwordInput.value = "";


            showLoginMessage(

                result.error
                ??
                "The username or password is incorrect.",

                "error"

            );


            passwordInput.focus();


            return;

        }


        /*
         * Successful login updates the authenticated
         * session and emits USERS_CHANGED. main.ts
         * responds by revealing the application.
         */

    }
    finally {

        setLoginSubmittingState(
            false
        );

    }

}


/**
 * Toggle login submit state.
 */
function setLoginSubmittingState(

    submitting:boolean

):void {

    const button =

        document.getElementById(

            "edoriLoginButton"

        ) as HTMLButtonElement | null;


    const usernameInput =

        document.getElementById(

            "edoriLoginUsername"

        ) as HTMLInputElement | null;


    const passwordInput =

        document.getElementById(

            "edoriLoginPassword"

        ) as HTMLInputElement | null;


    if(button){

        button.disabled =
            submitting;


        button.textContent =

            submitting
                ? "Signing in..."
                : "Sign in";

    }


    if(usernameInput){

        usernameInput.disabled =
            submitting;

    }


    if(passwordInput){

        passwordInput.disabled =
            submitting;

    }

}


/**
 * Show login feedback.
 */
function showLoginMessage(

    message:string,

    type:"error" | "information"

):void {

    const element =

        document.getElementById(

            "edoriLoginMessage"

        );


    if(!element){

        return;

    }


    element.hidden =
        false;


    element.className =

        `edori-login-message edori-login-message-${type}`;


    element.textContent =
        message;

}


/**
 * Clear login feedback.
 */
function clearLoginMessage():void {

    const element =

        document.getElementById(

            "edoriLoginMessage"

        );


    if(!element){

        return;

    }


    element.hidden =
        true;


    element.textContent =
        "";


    element.className =

        "edori-login-message";

}