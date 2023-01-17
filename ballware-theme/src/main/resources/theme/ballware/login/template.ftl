<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <style>
        .dx-toolbar {
            background-color: #3f51b5;
            color: #fff;
            padding: 0px 10px;
            box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%), 0 4px 5px 0 rgb(0 0 0 / 14%), 0 1px 10px 0 rgb(0 0 0 / 12%);
        }
    </style>
    <script>
        var realm = '${kcSanitize(msg("loginTitleHtml",(realm.displayNameHtml!'')))?no_esc}';

        var toolbar_items = [];

        toolbar_items.push({
            location: 'before',
            locateInMenu: 'never',
            text: realm
        });        

        <#if realm.internationalizationEnabled  && locale.supported?size gt 1>
        var locales = [
            <#list locale.supported as l>
                {
                    url: '${l.url}'.replaceAll(/&amp;/g,'&'), label: '${l.label}'
                },
            </#list>
        ];
        
        var current_locale = '${locale.current}';

        toolbar_items.push({
            location: 'after',
            widget: 'dxDropDownButton',
            options: {
                stylingMode: 'filled',
                text: current_locale,
                items: locales,
                displayExpr: 'label',                            
                onItemClick(item) {
                    window.location.href = item.itemData.url;
                }
            }
        })
        </#if>

        $(function() {
            $('#appbar').dxToolbar({
                items: toolbar_items
            });
        });
    </script>
</head>

<body class="dx-viewport">
    <main>
        <div id="appbar"></div>
        <div class="pt-2 container-fluid">
            <div class="row justify-content-md-center">            
                <div class="col-lg-auto" style="min-width: 500px;">                        
                    <div class="dx-fieldset">
                        <div class="dx-fieldset-header"><#nested "dxheader"></div>
                        <#if (auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                        <#nested "dxshow-username">
                        <div class="dx-field">
                            <div class="dx-field-label"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></div>
                            <div class="dx-field-value-static">
                                <span>${auth.attemptedUsername}</span>                    
                                <div id="resetloginbutton"></div>
                            </div>
                        </div>
                        <script>
                            $(function() {
                                $('#resetloginbutton').dxButton({
                                    hint: '${msg("restartLoginTooltip")}',
                                    stylingMode: 'text',
                                    icon: 'revert',
                                    onClick: function(e) {
                                        window.location.href = '${url.loginRestartFlowUrl}'.replaceAll(/&amp;/g,'&')
                                    }
                                });
                            });
                        </script>
                        </#if>
                        <#nested "dxform">
                        <#if displayInfo> 
                            <div class="dx-field pt-2">
                            <#nested "dxinfo">
                            </div>
                        </#if>
                        <#nested "socialProviders">
                    </div>
                </div>
            </div>    
        </div>
        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div id="toast"></div>
        <script>                
            var notification_message = '${kcSanitize(message.summary)?no_esc}';
            var notification_type = '${message.type}';

            $(function() {
                if (notification_message && notification_type) {
                    $('#toast').dxToast({
                        type: notification_type,
                        message: notification_message,
                        displayTime: 20000,
                        visible: true
                    });
                }                    
            });
        </script>
        </#if>
    </main>
<main>
<div class="${properties.kcLoginClass!}">    
    <div class="${properties.kcFormCardClass!}">
        <header class="${properties.kcFormHeaderClass!}">        
        <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                    </div>
                    <div class="col-lg-10">
                        <h1 id="kc-page-title"><#nested "header"></h1>
                    </div>
                </div>
            <#else>
                <h1 id="kc-page-title"><#nested "header"></h1>
            </#if>
        <#else>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                    </div>        
                </div>
            <#else>
                
            </#if>
        </#if>
      </header>
      <div id="kc-content">
        <div id="kc-content-wrapper">

          <#nested "form">

          <#if auth?has_content && auth.showTryAnotherWayLink()>
              <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                  <div class="${properties.kcFormGroupClass!}">
                      <input type="hidden" name="tryAnotherWay" value="on"/>
                      <a href="#" id="try-another-way"
                         onclick="document.forms['kc-select-try-another-way-form'].submit();return false;">${msg("doTryAnotherWay")}</a>
                  </div>
              </form>
          </#if>
        </div>
      </div>

    </div>
  </div>
</main>
</body>
</html>
</#macro>