<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=!messagesPerField.existsError('totp','userLabel'); section>

    <#if section = "dxheader">
        ${msg("loginTotpTitle")}
    <#elseif section = "dxform">
        <ol id="kc-totp-settings">
            <li>
                <p>${msg("loginTotpStep1")}</p>

                <ul id="kc-totp-supported-apps">
                    <#list totp.supportedApplications as app>
                        <li>${msg(app)}</li>
                    </#list>
                </ul>
            </li>

            <#if mode?? && mode = "manual">
                <li>
                    <p>${msg("loginTotpManualStep2")}</p>
                    <p><span id="kc-totp-secret-key">${totp.totpSecretEncoded}</span></p>
                    <p><a href="${totp.qrUrl}" id="mode-barcode">${msg("loginTotpScanBarcode")}</a></p>
                </li>
                <li>
                    <p>${msg("loginTotpManualStep3")}</p>
                    <p>
                    <ul>
                        <li id="kc-totp-type">${msg("loginTotpType")}: ${msg("loginTotp." + totp.policy.type)}</li>
                        <li id="kc-totp-algorithm">${msg("loginTotpAlgorithm")}: ${totp.policy.getAlgorithmKey()}</li>
                        <li id="kc-totp-digits">${msg("loginTotpDigits")}: ${totp.policy.digits}</li>
                        <#if totp.policy.type = "totp">
                            <li id="kc-totp-period">${msg("loginTotpInterval")}: ${totp.policy.period}</li>
                        <#elseif totp.policy.type = "hotp">
                            <li id="kc-totp-counter">${msg("loginTotpCounter")}: ${totp.policy.initialCounter}</li>
                        </#if>
                    </ul>
                    </p>
                </li>
            <#else>
                <li>
                    <p>${msg("loginTotpStep2")}</p>
                    <img id="kc-totp-secret-qr-code" src="data:image/png;base64, ${totp.totpSecretQrCode}" alt="Figure: Barcode"><br/>
                    <p><a href="${totp.manualUrl}" id="mode-manual">${msg("loginTotpUnableToScan")}</a></p>
                </li>
            </#if>
            <li>
                <p>${msg("loginTotpStep3")}</p>
                <p>${msg("loginTotpStep3DeviceName")}</p>
            </li>
        </ol>        

        <form action="${url.loginAction}" class="${properties.kcFormClass!}" id="kc-totp-settings-form" method="post">
            <div class="dx-field">
                <div class="dx-field-label">${msg("authenticatorCode")}</div>
                <div class="dx-field-value">
                    <div id="totp">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#totp').dxTextBox({
                        name: 'totp',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('totp')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('totp'))?no_esc}' }]
                    }).dxValidator({
                        validationRules: [{
                            type: 'required'
                        }],
                    });
                });
            </script>
            <input type="hidden" id="totpSecret" name="totpSecret" value="${totp.totpSecret}" />
            <#if mode??><input type="hidden" id="mode" name="mode" value="${mode}"/></#if>

            <div class="dx-field">
                <div class="dx-field-label">${msg("loginTotpDeviceName")}</div>
                <div class="dx-field-value">
                    <div id="userLabel">
                    </div>
                </div>
            </div>
            <script>
                $(function() {
                    $('#userLabel').dxTextBox({
                        name: 'userLabel',
                        validationMessageMode: 'always',
                        isValid: <#if messagesPerField.existsError('userLabel')>false<#else>true</#if>,
                        validationErrors: [{ message: '${kcSanitize(messagesPerField.getFirstError('userLabel'))?no_esc}' }]
                    });
                });
            </script>

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
        </form>
    </#if>
</@layout.registrationLayout>