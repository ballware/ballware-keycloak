<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "dxheader">
        ${msg("loginAccountTitle")}
    <#elseif section = "dxform">    
        <#if realm.password>
        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
            <#if !usernameHidden??>
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
                        value: '${(login.username!'')}',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('username','password')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}' }]
                    });
                });
            </script>
            </#if>
            <div class="dx-field">
                <div class="dx-field-label">${msg("password")}</div>
                <div class="dx-field-value">
                    <div id="password">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#password').dxTextBox({
                        name: 'password',
                        mode: 'password',
                        validationMessageMode: 'always',
                        isValid: <#if usernameHidden?? && messagesPerField.existsError('username','password')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}' }]
                    });
                });
            </script>
            <#if realm.rememberMe && !usernameHidden??>
            <div class="dx-field">          
                <div class="dx-field-label">${msg("rememberMe")}</div>                  
                <div class="dx-field-value">
                    <div id="rememberMe">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#rememberMe').dxCheckBox({
                        name: 'rememberMe'
                    });
                });
            </script>
            </#if>
            <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
            <div class="dx-field d-flex">                
                <#if realm.resetPasswordAllowed>
                <span class="me-auto align-self-center"><a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                </#if>
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
    <#elseif section = "dxinfo">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <span>${msg("noAccount")} <a tabindex="6" href="${url.registrationUrl}">${msg("doRegister")}</a></span>
        </#if>
    <#elseif section = "socialProviders" >
        <#if realm.password && social.providers??>
            <hr/>
            <div class="dx-fieldset-header">${msg("identity-provider-login-label")}</div>
            <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
                <#list social.providers as p>
                    <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                            type="button" href="${p.loginUrl}">
                        <#if p.iconClasses?has_content>
                            <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                            <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                        <#else>
                            <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                        </#if>
                    </a>
                </#list>
            </ul>
        </#if>
    </#if>

</@layout.registrationLayout>