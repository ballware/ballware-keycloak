import "./dxLicense";
import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/login/DefaultPage";
import Template from "./Template";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Error = lazy(() => import("./pages/Error"));
const Info = lazy(() => import("./pages/Info"));
const LoginOtp = lazy(() => import("./pages/LoginOtp"));
const LoginConfigTotp = lazy(() => import("./pages/LoginConfigTotp"));
const LoginResetPassword = lazy(() => import("./pages/LoginResetPassword"));
const LoginUpdatePassword = lazy(() => import("./pages/LoginUpdatePassword"));
const LoginVerifyEmail = lazy(() => import("./pages/LoginVerifyEmail"));
const UserProfileFormFields = lazy(() => import("keycloakify/login/UserProfileFormFields"));

const doMakeUserConfirmPassword = true;

export default function KcPage(props: { kcContext: KcContext }) {
    const { kcContext } = props;

    const { i18n } = useI18n({ kcContext });

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    case "login.ftl":
                        return <Login {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "register.ftl":
                        return <Register {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "error.ftl":
                        return <Error {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "info.ftl":
                        return <Info {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "login-otp.ftl":
                        return <LoginOtp {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "login-config-totp.ftl":
                        return <LoginConfigTotp {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "login-reset-password.ftl":
                        return <LoginResetPassword {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "login-update-password.ftl":
                        return <LoginUpdatePassword {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    case "login-verify-email.ftl":
                        return <LoginVerifyEmail {...{ kcContext, i18n, classes, Template, doUseDefaultCss: false }} />;
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                classes={classes}
                                Template={Template}
                                doUseDefaultCss={false}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

const classes = {} satisfies { [key in ClassKey]?: string };
