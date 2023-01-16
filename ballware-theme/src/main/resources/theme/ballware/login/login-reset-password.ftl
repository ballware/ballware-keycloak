<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "dxheader">
    <#elseif section = "dxform">
        <div class="col-md-auto" style="min-width: 500px;">            
            <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
                <div class="dx-fieldset">
                    <div class="dx-fieldset-header">${msg("emailForgotTitle")}</div>
                        <div class="dx-field">
                            <div class="dx-field-label"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></div>
                            <div class="dx-field-value">
                                <div id="username">
                                </div>
                            </div>
                        </div>
                        <script>
                            $(function() {
                                $('#username').dxTextBox({
                                    name: 'username',
                                    validationMessageMode: 'always',
                                    isValid: <#if messagesPerField.existsError('username')>false<#else>true</#if>,
                                    validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}' }]
                                });
                            });
                        </script>                        
                        <div class="dx-field d-flex">
                            <span class="me-auto align-self-center"><a tabindex="5" href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                            <div id="kc-submit"></div>
                            <script>
                                $(function() {
                                    $('#kc-submit').dxButton({
                                        text: '${msg("doSubmit")}',
                                        type: 'success',
                                        useSubmitBehavior: true
                                    });
                                });
                            </script>
                        </div>             
                </div>                
            </form>
        </div>
    <#elseif section = "dxinfo" >
    <div class="col-md-auto">
        <#if realm.duplicateEmailsAllowed>
            ${msg("emailInstructionUsername")}
        <#else>
            ${msg("emailInstruction")}
        </#if>
    </div>
    </#if>
</@layout.registrationLayout>