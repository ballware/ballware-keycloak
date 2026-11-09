import type { PageProps } from "keycloakify/login/pages/PageProps";
import DxTextBox from "devextreme-react/text-box";
import DxButton from "devextreme-react/button";
import DxCheckBox from "devextreme-react/check-box";
import { Field, FieldRow } from "../components/Field";
import { CancelAiaButton } from "../components/CancelAiaButton";
import { kcHtmlToText } from "../lib/kcText";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function LoginUpdatePassword(props: PageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { msg, msgStr } = i18n;

    const { url, messagesPerField, isAppInitiatedAction } = kcContext;

    const existsErrorPassword = messagesPerField.existsError("password");
    const existsErrorPasswordConfirm = messagesPerField.existsError("password-confirm");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("password", "password-confirm")}
            headerNode={msg("updatePasswordTitle")}
        >
            <form id="kc-passwd-update-form" action={url.loginAction} method="post">
                <Field label={msg("passwordNew")}>
                    <DxTextBox
                        elementAttr={{ id: "password-new" }}
                        name="password-new"
                        mode="password"
                        validationMessageMode="always"
                        isValid={!existsErrorPassword}
                        validationErrors={existsErrorPassword ? [{ message: kcHtmlToText(messagesPerField.getFirstError("password")) }] : null}
                    />
                </Field>

                <Field label={msg("passwordConfirm")}>
                    <DxTextBox
                        elementAttr={{ id: "password-confirm" }}
                        name="password-confirm"
                        mode="password"
                        validationMessageMode="always"
                        isValid={!existsErrorPasswordConfirm}
                        validationErrors={existsErrorPasswordConfirm ? [{ message: kcHtmlToText(messagesPerField.getFirstError("password-confirm")) }] : null}
                    />
                </Field>

                <Field label={msg("logoutOtherSessions")}>
                    <DxCheckBox name="logout-sessions" defaultValue={true} />
                </Field>

                <FieldRow>
                    <DxButton
                        elementAttr={{ id: "kc-submit", class: "kc-button-primary" }}
                        text={msgStr("doSubmit")}
                        stylingMode="contained"
                        useSubmitBehavior
                    />
                    {isAppInitiatedAction && <CancelAiaButton i18n={i18n} buttonId="kc-cancel" />}
                </FieldRow>
            </form>
        </Template>
    );
}
