import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import DxTextBox from "devextreme-react/text-box";
import DxButton from "devextreme-react/button";
import DxRadioGroup from "devextreme-react/radio-group";
import { Field, FieldRow, Spacer } from "../components/Field";
import { kcHtmlToText } from "../lib/kcText";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function LoginOtp(props: PageProps<Extract<KcContext, { pageId: "login-otp.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { otpLogin, url, messagesPerField } = kcContext;

    const { msg, msgStr } = i18n;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const existsError = messagesPerField.existsError("totp");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!existsError}
            headerNode={msg("doLogIn")}
        >
            <form
                id="kc-otp-login-form"
                action={url.loginAction}
                onSubmit={() => {
                    setIsSubmitting(true);
                    return true;
                }}
                method="post"
            >
                {otpLogin.userOtpCredentials.length > 1 && (
                    <Field>
                        <DxRadioGroup
                            elementAttr={{ id: "otp-credential" }}
                            name="selectedCredentialId"
                            items={otpLogin.userOtpCredentials.map(otpCredential => ({
                                text: otpCredential.userLabel,
                                value: otpCredential.id
                            }))}
                            displayExpr="text"
                            valueExpr="value"
                            defaultValue={otpLogin.selectedCredentialId}
                        />
                    </Field>
                )}

                <Field label={msg("loginOtpOneTime")}>
                    <DxTextBox
                        elementAttr={{ id: "otp" }}
                        name="otp"
                        validationMessageMode="always"
                        isValid={!existsError}
                        validationErrors={existsError ? [{ message: kcHtmlToText(messagesPerField.getFirstError("totp")) }] : null}
                    />
                </Field>

                <FieldRow>
                    <Spacer />
                    <DxButton
                        elementAttr={{ id: "kc-login", class: "kc-button-primary" }}
                        text={msgStr("doLogIn")}
                        stylingMode="contained"
                        useSubmitBehavior
                        disabled={isSubmitting}
                    />
                </FieldRow>
            </form>
        </Template>
    );
}
