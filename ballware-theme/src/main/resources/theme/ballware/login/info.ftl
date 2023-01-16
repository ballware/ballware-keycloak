<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "dxheader">  
        <#if messageHeader??>
        ${messageHeader}
        <#else>
        ${message.summary}
        </#if>         
    <#elseif section = "dxform">
        <p class="instruction">${message.summary}<#if requiredActions??><#list requiredActions>: <b><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#items></b></#list><#else></#if></p>        
        <#if skipLink??>
        <#else>
            <#if pageRedirectUri?has_content>
                <span class="me-auto align-self-center"><a href="${pageRedirectUri}">${kcSanitize(msg("backToApplication"))?no_esc}</a></span>
            <#elseif actionUri?has_content>
                <span class="me-auto align-self-center"><a href="${actionUri}">${kcSanitize(msg("proceedWithAction"))?no_esc}</a></span>
            <#elseif (client.baseUrl)?has_content>
                <span class="me-auto align-self-center"><a href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a></span>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>