import { kcSanitize } from "keycloakify/lib/kcSanitize";

/**
 * Keycloak error messages and message summaries can contain markup
 * (kcSanitize() output). DevExtreme editors and toasts expect plain strings.
 */
export function kcHtmlToText(html: string | undefined): string {
    if (html === undefined || html === "") {
        return "";
    }

    const element = document.createElement("div");

    element.innerHTML = kcSanitize(html);

    return (element.textContent ?? "").trim();
}
