import { useState, useLayoutEffect, Fragment } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { useUserProfileForm, type FormAction, type FormFieldError } from "keycloakify/login/lib/useUserProfileForm";
import type { Attribute } from "keycloakify/login/KcContext";
import DxTextBox from "devextreme-react/text-box";
import DxTextArea from "devextreme-react/text-area";
import DxNumberBox from "devextreme-react/number-box";
import DxSelectBox from "devextreme-react/select-box";
import DxRadioGroup from "devextreme-react/radio-group";
import DxButton from "devextreme-react/button";
import { Field } from "../components/Field";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function Register(props: PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { url, messagesPerField, recaptchaRequired, recaptchaVisible, recaptchaSiteKey, recaptchaAction, termsAcceptanceRequired, messageHeader } =
        kcContext;

    const { msg, msgStr, advancedMsg } = i18n;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);
    const [areTermsAccepted, setAreTermsAccepted] = useState(false);

    const {
        formState: { formFieldStates, isFormSubmittable: isProfileFormSubmittable },
        dispatchFormAction
    } = useUserProfileForm({
        kcContext,
        i18n,
        doMakeUserConfirmPassword: true
    });

    useLayoutEffect(() => {
        setIsFormSubmittable(isProfileFormSubmittable);
    }, [isProfileFormSubmittable]);

    useLayoutEffect(() => {
        window.onSubmitRecaptcha = () => {
            const form = document.getElementById("kc-register-form");

            if (form instanceof HTMLFormElement) {
                form.requestSubmit();
            }
        };

        return () => {
            delete window.onSubmitRecaptcha;
        };
    }, []);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            headerNode={messageHeader !== undefined ? advancedMsg(messageHeader) : msg("registerTitle")}
            displayMessage={messagesPerField.exists("global")}
        >
            <form id="kc-register-form" action={url.registrationAction} method="post">
                {formFieldStates.map(({ attribute, displayableErrors, valueOrValues }) => (
                    <KcProfileField
                        key={attribute.name}
                        attribute={attribute}
                        valueOrValues={valueOrValues}
                        displayableErrors={displayableErrors}
                        dispatchFormAction={dispatchFormAction}
                        i18n={i18n}
                    />
                ))}
                {termsAcceptanceRequired && (
                    <TermsAcceptance
                        i18n={i18n}
                        messagesPerField={messagesPerField}
                        areTermsAccepted={areTermsAccepted}
                        onAreTermsAcceptedValueChange={setAreTermsAccepted}
                    />
                )}
                {recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined) && (
                    <div className="dx-field">
                        <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction}></div>
                    </div>
                )}
                <div className="dx-field kc-field-row">
                    <span className="kc-spacer align-self-center">
                        <a tabIndex={5} href={url.loginUrl}>
                            {msg("backToLogin")}
                        </a>
                    </span>
                    <DxButton
                        elementAttr={{ id: "kc-register", class: "kc-button-primary" }}
                        text={msgStr("doRegister")}
                        stylingMode="contained"
                        useSubmitBehavior
                        disabled={!isFormSubmittable || (termsAcceptanceRequired === true && !areTermsAccepted)}
                    />
                </div>
            </form>
        </Template>
    );
}

function KcProfileField(props: {
    attribute: Attribute;
    valueOrValues: string | string[];
    displayableErrors: FormFieldError[];
    dispatchFormAction: (action: FormAction) => void;
    i18n: I18n;
}) {
    const { attribute, valueOrValues, displayableErrors, dispatchFormAction, i18n } = props;

    const { advancedMsg, advancedMsgStr } = i18n;

    const isHidden = attribute.annotations.inputType === "hidden";

    const errors = displayableErrors.filter(error => error.fieldIndex === undefined);

    const onUpdate = (value: string | string[]) =>
        dispatchFormAction({
            action: "update",
            name: attribute.name,
            valueOrValues: value
        });

    const onFocusLost = () =>
        dispatchFormAction({
            action: "focus lost",
            name: attribute.name,
            fieldIndex: undefined
        });

    if (isHidden) {
        return <input type="hidden" name={attribute.name} value={typeof valueOrValues === "string" ? valueOrValues : valueOrValues[0]} />;
    }

    return (
        <Field label={<>{advancedMsg(attribute.displayName ?? "")}{attribute.required && " *"}</>}>
            {(() => {
                switch (attribute.annotations.inputType) {
                    case "textarea":
                        return (
                            <DxTextArea
                                elementAttr={{ id: attribute.name }}
                                name={attribute.name}
                                defaultValue={String(valueOrValues)}
                                disabled={attribute.readOnly}
                                onValueChanged={e => onUpdate(e.value)}
                                onFocusOut={onFocusLost}
                                isValid={errors.length === 0}
                                validationErrors={errors.map(({ errorMessageStr }) => ({ message: errorMessageStr }))}
                                validationMessageMode="always"
                            />
                        );
                    case "select":
                    case "multiselect":
                    case "select-radiobuttons":
                    case "multiselect-checkboxes": {
                        const options = getAttributeOptions(attribute, advancedMsgStr);

                        const items = options.map(({ value, label }) => ({ value, label }));

                        if (attribute.annotations.inputType === "select-radiobuttons" || attribute.annotations.inputType === "multiselect-checkboxes") {
                            return (
                                <DxRadioGroup
                                    elementAttr={{ id: attribute.name }}
                                    name={attribute.name}
                                    items={items}
                                    displayExpr="text"
                                    valueExpr="value"
                                    defaultValue={Array.isArray(valueOrValues) ? valueOrValues[0] : valueOrValues}
                                    disabled={attribute.readOnly}
                                    onValueChanged={e => onUpdate(e.value)}
                                />
                            );
                        }

                        return (
                            <DxSelectBox
                                elementAttr={{ id: attribute.name }}
                                name={attribute.name}
                                items={items}
                                displayExpr="label"
                                valueExpr="value"
                                defaultValue={Array.isArray(valueOrValues) ? valueOrValues[0] : valueOrValues}
                                disabled={attribute.readOnly}
                                onValueChanged={e => onUpdate(e.value)}
                            />
                        );
                    }
                    default: {
                        if (valueOrValues instanceof Array) {
                            return valueOrValues.map((value, fieldIndex) => {
                                const fieldErrors = displayableErrors.filter(error => error.fieldIndex === fieldIndex);

                                return (
                                    <Fragment key={fieldIndex}>
                                        <DxTextBox
                                            elementAttr={{ id: `${attribute.name}-${fieldIndex + 1}` }}
                                            name={attribute.name}
                                            defaultValue={value}
                                            disabled={attribute.readOnly}
                                            onValueChanged={e =>
                                                onUpdate(
                                                    valueOrValues.map((v, i) => (i === fieldIndex ? e.value : v))
                                                )
                                            }
                                            onFocusOut={() =>
                                                dispatchFormAction({
                                                    action: "focus lost",
                                                    name: attribute.name,
                                                    fieldIndex
                                                })
                                            }
                                            isValid={fieldErrors.length === 0}
                                            validationErrors={fieldErrors.map(({ errorMessageStr }) => ({ message: errorMessageStr }))}
                                            validationMessageMode="always"
                                        />
                                    </Fragment>
                                );
                            });
                        }

                        const isPassword = attribute.name === "password" || attribute.name === "password-confirm";

                        const isNumber = attribute.annotations.inputType === "number" || attribute.validators.integer !== undefined;

                        const html5Type = (() => {
                            const inputType = attribute.annotations.inputType;

                            if (inputType === undefined) {
                                return undefined;
                            }

                            return inputType.startsWith("html5-") ? inputType.slice(6) : inputType;
                        })();

                        if (isNumber) {
                            return (
                                <DxNumberBox
                                    elementAttr={{ id: attribute.name }}
                                    name={attribute.name}
                                    defaultValue={Number(valueOrValues) || undefined}
                                    showSpinButtons
                                    disabled={attribute.readOnly}
                                    onValueChanged={e => onUpdate(String(e.value))}
                                    onFocusOut={onFocusLost}
                                    isValid={errors.length === 0}
                                    validationErrors={errors.map(({ errorMessageStr }) => ({ message: errorMessageStr }))}
                                    validationMessageMode="always"
                                />
                            );
                        }

                        return (
                            <DxTextBox
                                elementAttr={{ id: attribute.name }}
                                name={attribute.name}
                                defaultValue={valueOrValues}
                                mode={isPassword ? "password" : html5Type === "email" ? "email" : html5Type === "tel" ? "tel" : html5Type === "url" ? "url" : "text"}
                                disabled={attribute.readOnly}
                                placeholder={
                                    attribute.annotations.inputTypePlaceholder === undefined
                                        ? undefined
                                        : advancedMsgStr(attribute.annotations.inputTypePlaceholder)
                                }
                                maxLength={
                                    attribute.annotations.inputTypeMaxlength === undefined
                                        ? undefined
                                        : parseInt(`${attribute.annotations.inputTypeMaxlength}`)
                                }
                                onValueChanged={e => onUpdate(e.value)}
                                onFocusOut={onFocusLost}
                                isValid={errors.length === 0}
                                validationErrors={errors.map(({ errorMessageStr }) => ({ message: errorMessageStr }))}
                                validationMessageMode="always"
                            />
                        );
                    }
                }
            })()}
        </Field>
    );
}

function getAttributeOptions(attribute: Attribute, advancedMsg: (key: string) => string): { value: string; label: string }[] {
    const values = attribute.validators.options?.options ?? [];

    const labels = attribute.annotations.inputOptionLabels;

    const prefix = attribute.annotations.inputOptionLabelsI18nPrefix;

    return values.map(value => ({
        value,
        label: labels?.[value] ?? (prefix !== undefined ? advancedMsg(`${prefix}.${value}`) : value)
    }));
}

function TermsAcceptance(props: {
    i18n: I18n;
    messagesPerField: Pick<KcContext["messagesPerField"], "existsError" | "get">;
    areTermsAccepted: boolean;
    onAreTermsAcceptedValueChange: (areTermsAccepted: boolean) => void;
}) {
    const { i18n, messagesPerField, areTermsAccepted, onAreTermsAcceptedValueChange } = props;

    const { msg } = i18n;

    return (
        <>
            <div className="dx-field">
                <div className="dx-field-value-static">
                    {msg("termsTitle")}
                    <div id="kc-registration-terms-text">{msg("termsText")}</div>
                </div>
            </div>
            <Field label={msg("acceptTerms")}>
                <input
                    type="checkbox"
                    id="termsAccepted"
                    name="termsAccepted"
                    checked={areTermsAccepted}
                    onChange={event => onAreTermsAcceptedValueChange(event.target.checked)}
                    aria-invalid={messagesPerField.existsError("termsAccepted")}
                />
            </Field>
            {messagesPerField.existsError("termsAccepted") && (
                <span
                    id="input-error-terms-accepted"
                    aria-live="polite"
                    dangerouslySetInnerHTML={{ __html: kcSanitize(messagesPerField.get("termsAccepted")) }}
                />
            )}
        </>
    );
}
