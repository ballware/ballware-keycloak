import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useScript } from "keycloakify/login/pages/Login.useScript";
import DxTextBox from "devextreme-react/text-box";
import DxButton from "devextreme-react/button";
import DxCheckBox from "devextreme-react/check-box";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { clsx } from "keycloakify/tools/clsx";
import { Field, FieldRow, Spacer } from "../components/Field";
import { kcHtmlToText } from "../lib/kcText";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { social, realm, url, usernameHidden, login, auth, registrationDisabled, messagesPerField, enableWebAuthnConditionalUI, authenticators } =
        kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const webAuthnButtonId = "authenticateWebAuthnButton";

    useScript({
        webAuthnButtonId,
        kcContext,
        i18n
    });

    const existsError = messagesPerField.existsError("username", "password");

    const validationErrors = [{ message: kcHtmlToText(messagesPerField.getFirstError("username", "password")) }];

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!existsError}
            headerNode={msg("loginAccountTitle")}
            displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled}
            infoNode={
                <span>
                    {msg("noAccount")}{" "}
                    <a tabIndex={6} id="kc-registration" href={url.registrationUrl}>
                        {msg("doRegister")}
                    </a>
                </span>
            }
            socialProvidersNode={
                realm.password && social?.providers !== undefined && social.providers.length !== 0 ? (
                    <div id="kc-social-providers">
                        <hr />
                        <div className="dx-fieldset-header">{msg("identity-provider-login-label")}</div>
                        <ul>
                            {social.providers.map(p => (
                                <li key={p.alias}>
                                    <a id={`social-${p.alias}`} type="button" href={p.loginUrl}>
                                        {p.iconClasses && <i className={clsx("kc-logo-idp", p.iconClasses)} aria-hidden="true"></i>}
                                        <span dangerouslySetInnerHTML={{ __html: kcSanitize(p.displayName) }}></span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null
            }
        >
            {realm.password && (
                <form
                    id="kc-form-login"
                    onSubmit={() => {
                        setIsLoginButtonDisabled(true);
                        return true;
                    }}
                    action={url.loginAction}
                    method="post"
                >
                    {!usernameHidden && (
                        <Field
                            label={!realm.loginWithEmailAllowed ? msg("username") : !realm.registrationEmailAsUsername ? msg("usernameOrEmail") : msg("email")}
                        >
                            <DxTextBox
                                name="username"
                                defaultValue={login.username ?? ""}
                                validationMessageMode="always"
                                isValid={!existsError}
                                validationErrors={existsError ? validationErrors : null}
                            />
                        </Field>
                    )}

                    <Field label={msg("password")}>
                        <DxTextBox
                            name="password"
                            mode="password"
                            validationMessageMode="always"
                            isValid={!(usernameHidden && existsError)}
                            validationErrors={usernameHidden && existsError ? validationErrors : null}
                        />
                    </Field>

                    {realm.rememberMe && !usernameHidden && (
                        <Field label={msg("rememberMe")}>
                            <DxCheckBox name="rememberMe" defaultValue={!!login.rememberMe} />
                        </Field>
                    )}

                    <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential} />

                    <FieldRow>
                        {realm.resetPasswordAllowed && (
                            <span className="kc-spacer align-self-center">
                                <a tabIndex={5} id="kc-forgot-pw-link" href={url.loginResetCredentialsUrl}>
                                    {msg("doForgotPassword")}
                                </a>
                            </span>
                        )}
                        {!realm.resetPasswordAllowed && <Spacer />}
                        <DxButton
                            elementAttr={{ id: "kc-login", class: "kc-button-primary" }}
                            text={msgStr("doLogIn")}
                            stylingMode="contained"
                            useSubmitBehavior
                            disabled={isLoginButtonDisabled}
                        />
                    </FieldRow>
                </form>
            )}
            {enableWebAuthnConditionalUI && (
                <>
                    <form id="webauth" action={url.loginAction} method="post">
                        <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                        <input type="hidden" id="authenticatorData" name="authenticatorData" />
                        <input type="hidden" id="signature" name="signature" />
                        <input type="hidden" id="credentialId" name="credentialId" />
                        <input type="hidden" id="userHandle" name="userHandle" />
                        <input type="hidden" id="error" name="error" />
                    </form>
                    {authenticators?.authenticators.length !== undefined && authenticators.authenticators.length > 0 && (
                        <form id="authn_select">
                            {authenticators.authenticators.map((authenticator, i) => (
                                <input key={i} type="hidden" name="authn_use_chk" readOnly value={authenticator.credentialId} />
                            ))}
                        </form>
                    )}
                    <button id={webAuthnButtonId} type="button" className="kc-webauthn-button">
                        {msg("passkey-doAuthenticate")}
                    </button>
                </>
            )}
        </Template>
    );
}
