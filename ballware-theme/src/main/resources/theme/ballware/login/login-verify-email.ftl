<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "dxheader">
        ${msg("emailVerifyTitle")}
    <#elseif section = "dxform">
        <p class="instruction">${msg("emailVerifyInstruction1",user.email)}</p> 
    <#elseif section = "dxinfo">
        <p class="instruction">
            ${msg("emailVerifyInstruction2")}
            <br/>
            <a href="${url.loginAction}">${msg("doClickHere")}</a> ${msg("emailVerifyInstruction3")}
        </p>
    </#if>
</@layout.registrationLayout>