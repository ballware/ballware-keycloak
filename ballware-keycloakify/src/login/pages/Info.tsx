import type { PageProps } from "keycloakify/login/pages/PageProps";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { Instruction, FieldRow } from "../components/Field";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function Info(props: PageProps<Extract<KcContext, { pageId: "info.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { advancedMsgStr, msg } = i18n;

    const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={false}
            headerNode={
                <span
                    dangerouslySetInnerHTML={{
                        __html: kcSanitize(messageHeader !== undefined ? advancedMsgStr(messageHeader) : message.summary)
                    }}
                />
            }
        >
            <div id="kc-info-message">
                <Instruction>
                    <span
                        dangerouslySetInnerHTML={{
                            __html: kcSanitize(
                                (() => {
                                    let html = message.summary?.trim() ?? "";

                                    if (requiredActions !== undefined) {
                                        html += " <b>";
                                        html += requiredActions.map(requiredAction => advancedMsgStr(`requiredAction.${requiredAction}`)).join(", ");
                                        html += "</b>";
                                    }

                                    return html;
                                })()
                            )
                        }}
                    />
                </Instruction>
                {!skipLink && (
                    <FieldRow>
                        {(() => {
                            if (pageRedirectUri !== undefined && pageRedirectUri !== "") {
                                return (
                                    <span className="kc-spacer align-self-center">
                                        <a href={pageRedirectUri}>{msg("backToApplication")}</a>
                                    </span>
                                );
                            }
                            if (actionUri !== undefined && actionUri !== "") {
                                return (
                                    <span className="kc-spacer align-self-center">
                                        <a href={actionUri}>{msg("proceedWithAction")}</a>
                                    </span>
                                );
                            }
                            if (client.baseUrl !== undefined && client.baseUrl !== "") {
                                return (
                                    <span className="kc-spacer align-self-center">
                                        <a href={client.baseUrl}>{msg("backToApplication")}</a>
                                    </span>
                                );
                            }
                            return null;
                        })()}
                    </FieldRow>
                )}
            </div>
        </Template>
    );
}
