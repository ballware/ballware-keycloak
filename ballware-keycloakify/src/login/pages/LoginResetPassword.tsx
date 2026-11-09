import type { PageProps } from "keycloakify/login/pages/PageProps";
import DxTextBox from "devextreme-react/text-box";
import DxButton from "devextreme-react/button";
import { Field, FieldRow } from "../components/Field";
import { kcHtmlToText } from "../lib/kcText";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function LoginResetPassword(props: PageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { url, realm, auth, messagesPerField } = kcContext;

    const { msg, msgStr } = i18n;

    const existsError = messagesPerField.existsError("username");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo
            displayMessage={!existsError}
            infoNode={realm.duplicateEmailsAllowed ? msg("emailInstructionUsername") : msg("emailInstruction")}
            headerNode={msg("emailForgotTitle")}
        >
            <form id="kc-reset-password-form" action={url.loginAction} method="post">
                <Field label={!realm.loginWithEmailAllowed ? msg("username") : !realm.registrationEmailAsUsername ? msg("usernameOrEmail") : msg("email")}>
                    <DxTextBox
                        elementAttr={{ id: "username" }}
                        name="username"
                        defaultValue={auth.attemptedUsername ?? ""}
                        validationMessageMode="always"
                        isValid={!existsError}
                        validationErrors={existsError ? [{ message: kcHtmlToText(messagesPerField.getFirstError("username")) }] : null}
                    />
                </Field>
                <FieldRow>
                    <span className="kc-spacer align-self-center">
                        <a tabIndex={5} href={url.loginUrl}>
                            {msg("backToLogin")}
                        </a>
                    </span>
                    <DxButton
                        elementAttr={{ id: "kc-submit", class: "kc-button-primary" }}
                        text={msgStr("doSubmit")}
                        stylingMode="contained"
                        useSubmitBehavior
                    />
                </FieldRow>
            </form>
        </Template>
    );
}
