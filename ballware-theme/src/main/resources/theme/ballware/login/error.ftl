<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "dxheader">     
        ${kcSanitize(msg("errorTitle"))?no_esc}   
    <#elseif section = "dxform">
        <p class="instruction">${kcSanitize(message.summary)?no_esc}</p>        
        <#if skipLink??>
        <#else>
            <#if client?? && client.baseUrl?has_content>
            <div class="dx-field d-flex">
                <span class="me-auto align-self-center"><a id="backToApplication" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a></span>
            </div>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>