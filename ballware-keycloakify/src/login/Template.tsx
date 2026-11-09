import { useEffect } from "react";
import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import DxButton from "devextreme-react/button";
import "bootstrap/dist/css/bootstrap.css";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.material.blue.light.css";
import "./main.css";
import { KcToolbar } from "./components/KcToolbar";
import { KcToast } from "./components/KcToast";
import { FieldStatic, FieldRow } from "./components/Field";
import { applyDxLocalization } from "./lib/dxLocalization";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";

type CommonAuth = {
    showUsername?: boolean;
    showResetCredentials?: boolean;
    showTryAnotherWayLink?: boolean;
    attemptedUsername?: string;
};

export default function Template(props: TemplateProps<KcContext, I18n>) {
    const {
        displayInfo = false,
        displayMessage = true,
        headerNode,
        socialProvidersNode = null,
        infoNode = null,
        documentTitle,
        bodyClassName,
        kcContext,
        i18n,
        doUseDefaultCss,
        children
    } = props;

    const { msg, msgStr } = i18n;

    const { realm, url, message, isAppInitiatedAction } = kcContext;

    const auth = kcContext.auth as CommonAuth | undefined;

    useEffect(() => {
        document.title = documentTitle ?? msgStr("loginTitle", realm.displayName || realm.name);
    }, []);

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? "dx-viewport"
    });

    useEffect(() => {
        applyDxLocalization(kcContext.locale?.currentLanguageTag);
    }, []);

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

    if (!isReadyToRender) {
        return null;
    }

    return (
        <main>
            <KcToolbar kcContext={kcContext} i18n={i18n} />
            <div className="pt-2 container-fluid">
                <div className="row justify-content-md-center">
                    <div className="col-lg-6">
                        <div className="dx-fieldset">
                            <div className="dx-fieldset-header" id="kc-page-title">
                                {headerNode}
                            </div>
                            {auth?.showUsername === true && auth?.showResetCredentials !== true && (
                                <FieldStatic label={msg("username")}>
                                    <span id="kc-attempted-username">{auth?.attemptedUsername}</span>
                                    <DxButton
                                        hint={msgStr("restartLoginTooltip")}
                                        stylingMode="text"
                                        icon="revert"
                                        onClick={() => {
                                            window.location.href = url.loginRestartFlowUrl;
                                        }}
                                    />
                                </FieldStatic>
                            )}
                            {children}
                            {displayInfo && (
                                <div className="dx-field pt-2" id="kc-info">
                                    {infoNode}
                                </div>
                            )}
                            {auth?.showTryAnotherWayLink === true && (
                                <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                                    <input type="hidden" name="tryAnotherWay" value="on" />
                                    <FieldRow>
                                        <a
                                            href="#"
                                            id="try-another-way"
                                            onClick={event => {
                                                event.preventDefault();
                                                document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                            }}
                                        >
                                            {msg("doTryAnotherWay")}
                                        </a>
                                    </FieldRow>
                                </form>
                            )}
                            {socialProvidersNode}
                        </div>
                    </div>
                </div>
            </div>
            {displayMessage && message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && <KcToast message={message} />}
        </main>
    );
}
