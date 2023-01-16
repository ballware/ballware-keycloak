<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "dxheader">
    <#elseif section = "dxform">
        <div class="col-md-auto" style="min-width: 500px;">            
            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                <input type="text" id="username" name="username" value="${username}" autocomplete="username"
                   readonly="readonly" style="display:none;"/>
                <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>                
                <div class="dx-fieldset">
                    <div class="dx-fieldset-header">${msg("updatePasswordTitle")}</div>
                        <div class="dx-field">
                            <div class="dx-field-label">${msg("password")}</div>
                            <div class="dx-field-value">
                                <div id="password-new">
                                </div>
                            </div>
                        </div>
                        <script>
                            $(function() {
                                $('#password-new').dxTextBox({
                                    name: 'password-new',
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
                                    isValid: <#if usernameHidden?? && messagesPerField.existsError('password-confirm')>false<#else>true</#if>,
                                    validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}' }]
                                });
                            });
                        </script>     
                        <#if isAppInitiatedAction??>
                        <div class="dx-field">          
                            <div class="dx-field-label">${msg("logoutOtherSessions")}</div>                  
                            <div class="dx-field-value">
                                <div id="logout-sessions">
                                </div>
                            </div>
                        </div>
                        <script>
                            $(function() {
                                $('#logout-sessions').dxCheckBox({
                                    name: 'logout-sessions',
                                    value: true
                                });
                            });
                        </script>
                        </#if>                        
                        <div class="dx-field d-flex">
                            <div class="me-auto" id="kc-submit"></div>
                            <script>
                                $(function() {
                                    $('#kc-submit').dxButton({
                                        text: '${msg("doSubmit")}',
                                        type: 'success',
                                        useSubmitBehavior: true
                                    });
                                });
                            </script>
                            <#if isAppInitiatedAction??>
                            <div id="kc-cancel"></div>
                            <button id="cancel-aia" type="submit" name="cancel-aia" value="true" style="display:none;" /></button>
                            <script>
                                $(function() {
                                    $('#kc-cancel').dxButton({
                                        text: '${msg("doCancel")}',
                                        type: 'normal',
                                        onClick: function(e) {
                                            $('#cancel-aia').click();
                                        }
                                    });                                    
                                });
                            </script>
                            </#if>
                        </div>             
                </div>                
            </form>
        </div>
    </#if>
</@layout.registrationLayout>