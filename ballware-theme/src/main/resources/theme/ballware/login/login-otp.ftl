<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('totp'); section>
    <#if section = "dxheader">
        ${msg("doLogIn")}
    <#elseif section = "dxform">
        <form id="kc-otp-login-form" action="${url.loginAction}" method="post">
            <#if otpLogin.userOtpCredentials?size gt 1>                        
            <div class="dx-field">                            
                <div class="dx-field-value">
                    <div id="otp-credential">
                    </div>
                </div>
            </div>
            <script>
                var otp_credentials = [];

                <#list otpLogin.userOtpCredentials as otpCredential>
                otp_credentials.push({
                    text: '${otpCredential.userLabel}',
                    value: '${otpCredential.id}'
                });
                </#list>

                $(function() {
                    $('#otp-credential}').dxRadioGroup({
                        name: 'selectedCredentialId,
                        dataSource: otp_credentials,
                        displayExpr: 'text',
                        valueExpr: 'value',
                        value: '${otpLogin.selectedCredentialId}'
                    });
                });
            </script>
            </#if>
            <div class="dx-field">
                <div class="dx-field-label">${msg("loginOtpOneTime")}</div>
                <div class="dx-field-value">
                    <div id="otp">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#otp').dxTextBox({
                        name: 'otp',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('totp')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('totp'))?no_esc}' }]
                    });
                });
            </script>                        
            <div class="dx-field d-flex">
                <div class="me-auto"></div>
                <div id="kc-login"></div>
                <script>
                    $(function() {
                        $('#kc-login').dxButton({
                            text: '${msg("doLogIn")}',
                            type: 'success',
                            useSubmitBehavior: true
                        });
                    });
                </script>                        
            </div>         
        </form>
    </#if>
</@layout.registrationLayout>