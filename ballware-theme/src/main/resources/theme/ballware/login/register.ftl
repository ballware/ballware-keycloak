<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "dxheader">
        ${msg("registerTitle")}
    <#elseif section = "dxform">    
        <form id="kc-register-login" action="${url.registrationAction}" method="post">
            <div class="dx-field">
                <div class="dx-field-label">${msg("firstName")}</div>
                <div class="dx-field-value">
                    <div id="firstName">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#firstName').dxTextBox({
                        name: 'firstName',
                        value: '${(register.formData.firstName!'')}',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('firstName')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('firstName'))?no_esc}' }]
                    });
                });
            </script>
            <div class="dx-field">
                <div class="dx-field-label">${msg("lastName")}</div>
                <div class="dx-field-value">
                    <div id="lastName">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#lastName').dxTextBox({
                        name: 'lastName',
                        value: '${(register.formData.lastName!'')}',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('lastName')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('lastName'))?no_esc}' }]
                    });
                });
            </script>
            <div class="dx-field">
                <div class="dx-field-label">${msg("email")}</div>
                <div class="dx-field-value">
                    <div id="email">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#email').dxTextBox({
                        name: 'email',
                        value: '${(register.formData.email!'')}',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('email')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('email'))?no_esc}' }]
                    });
                });
            </script>
            <#if !realm.registrationEmailAsUsername>
            <div class="dx-field">
                <div class="dx-field-label">${msg("username")}</div>
                <div class="dx-field-value">
                    <div id="username">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#username').dxTextBox({
                        name: 'username',
                        value: '${(register.formData.username!'')}',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('username')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}' }]
                    });
                });
            </script>
            </#if>
            <#if passwordRequired??>
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
                        isValid: <#if messagesPerField.existsError('password')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}' }]
                    });
                });
            </script>
            <div class="dx-field">
                <div class="dx-field-label">${msg("passwordConfirm")}</div>
                <div class="dx-field-value">
                    <div id="password-confirm">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#password-confirm').dxTextBox({
                        name: 'password-confirm',
                        mode: 'password',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('password-confirm')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}' }]
                    });
                });
            </script>
            </#if>
            <#if recaptchaRequired??>
            <div class="dx-field">                        
                <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
            </div>
            </#if>                
            
            <div class="dx-field d-flex">
                <span class="me-auto align-self-center"><a tabindex="5" href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                <div id="kc-register"></div>
                <script>
                    $(function() {
                        $('#kc-register').dxButton({
                            text: '${msg("doRegister")}',
                            type: 'success',
                            useSubmitBehavior: true
                        });
                    });
                </script>
            </div>                
        </form>
    <#elseif section = "dxinfo">        
    </#if>
</@layout.registrationLayout>