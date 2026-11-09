import type { PageProps } from "keycloakify/login/pages/PageProps";
import DxTextBox from "devextreme-react/text-box";
import DxButton from "devextreme-react/button";
import DxCheckBox from "devextreme-react/check-box";
import DxValidator, { RequiredRule as DxRequiredRule } from "devextreme-react/validator";
import { Field, FieldRow } from "../components/Field";
import { CancelAiaButton } from "../components/CancelAiaButton";
import { kcHtmlToText } from "../lib/kcText";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function LoginConfigTotp(props: PageProps<Extract<KcContext, { pageId: "login-config-totp.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { url, isAppInitiatedAction, totp, mode, messagesPerField } = kcContext;

    const { msg, msgStr, advancedMsg } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={msg("loginTotpTitle")}
            displayMessage={!messagesPerField.existsError("totp", "userLabel")}
        >
            <>
                <ol id="kc-totp-settings">
                    <li>
                        <p>{msg("loginTotpStep1")}</p>
                        <ul id="kc-totp-supported-apps">
                            {totp.supportedApplications.map(app => (
                                <li key={app}>{advancedMsg(app)}</li>
                            ))}
                        </ul>
                    </li>
                    {mode === "manual" ? (
                        <>
                            <li>
                                <p>{msg("loginTotpManualStep2")}</p>
                                <p>
                                    <span id="kc-totp-secret-key">{totp.totpSecretEncoded}</span>
                                </p>
                                <p>
                                    <a href={totp.qrUrl} id="mode-barcode">
                                        {msg("loginTotpScanBarcode")}
                                    </a>
                                </p>
                            </li>
                            <li>
                                <p>{msg("loginTotpManualStep3")}</p>
                                <ul>
                                    <li id="kc-totp-type">
                                        {msg("loginTotpType")}: {msg(`loginTotp.${totp.policy.type}`)}
                                    </li>
                                    <li id="kc-totp-algorithm">
                                        {msg("loginTotpAlgorithm")}: {totp.policy.getAlgorithmKey()}
                                    </li>
                                    <li id="kc-totp-digits">
                                        {msg("loginTotpDigits")}: {totp.policy.digits}
                                    </li>
                                    {totp.policy.type === "totp" ? (
                                        <li id="kc-totp-period">
                                            {msg("loginTotpInterval")}: {totp.policy.period}
                                        </li>
                                    ) : (
                                        <li id="kc-totp-counter">
                                            {msg("loginTotpCounter")}: {totp.policy.initialCounter}
                                        </li>
                                    )}
                                </ul>
                            </li>
                        </>
                    ) : (
                        <li>
                            <p>{msg("loginTotpStep2")}</p>
                            <img id="kc-totp-secret-qr-code" src={`data:image/png;base64, ${totp.totpSecretQrCode}`} alt="Figure: Barcode" />
                            <br />
                            <p>
                                <a href={totp.manualUrl} id="mode-manual">
                                    {msg("loginTotpUnableToScan")}
                                </a>
                            </p>
                        </li>
                    )}
                    <li>
                        <p>{msg("loginTotpStep3")}</p>
                        <p>{msg("loginTotpStep3DeviceName")}</p>
                    </li>
                </ol>

                <form action={url.loginAction} id="kc-totp-settings-form" method="post">
                    <Field label={<>{msg("authenticatorCode")} <span className="required">*</span></>}>
                        <DxTextBox
                            elementAttr={{ id: "totp" }}
                            name="totp"
                            validationMessageMode="always"
                            isValid={!messagesPerField.existsError("totp")}
                            validationErrors={
                                messagesPerField.existsError("totp")
                                    ? [{ message: kcHtmlToText(messagesPerField.getFirstError("totp")) }]
                                    : null
                            }
                        >
                            <DxValidator>
                                <DxRequiredRule />
                            </DxValidator>
                        </DxTextBox>
                    </Field>

                    <input type="hidden" id="totpSecret" name="totpSecret" value={totp.totpSecret} />
                    {mode !== undefined && <input type="hidden" id="mode" name="mode" value={mode ?? ""} />}

                    <Field label={<>{msg("loginTotpDeviceName")}{totp.otpCredentials.length >= 1 && <span className="required"> *</span>}</>}>
                        <DxTextBox
                            elementAttr={{ id: "userLabel" }}
                            name="userLabel"
                            validationMessageMode="always"
                            isValid={!messagesPerField.existsError("userLabel")}
                            validationErrors={
                                messagesPerField.existsError("userLabel")
                                    ? [{ message: kcHtmlToText(messagesPerField.getFirstError("userLabel")) }]
                                    : null
                            }
                        />
                    </Field>

                    <Field label={msg("logoutOtherSessions")}>
                        <DxCheckBox name="logout-sessions" defaultValue={false} />
                    </Field>

                    <FieldRow>
                        <DxButton
                            elementAttr={{ id: "saveTOTPBtn", class: "kc-button-primary" }}
                            text={msgStr("doSubmit")}
                            stylingMode="contained"
                            useSubmitBehavior
                        />
                        {isAppInitiatedAction && <CancelAiaButton i18n={i18n} buttonId="cancelTOTPBtn" />}
                    </FieldRow>
                </form>
            </>
        </Template>
    );
}
