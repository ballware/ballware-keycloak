import { loadMessages, locale } from "devextreme/localization";
import deMessages from "devextreme/localization/messages/de.json";
import enMessages from "devextreme/localization/messages/en.json";

const SUPPORTED_DX_LOCALES = ["de", "en"];

/**
 * DevExtreme widget texts (validation messages, built-in buttons) follow the
 * Keycloak language selected through kcContext.locale.
 */
export function applyDxLocalization(languageTag: string | undefined): void {
    loadMessages(deMessages);
    loadMessages(enMessages);

    const dxLocale = SUPPORTED_DX_LOCALES.find(dx => languageTag === dx || languageTag?.startsWith(`${dx}-`));

    if (dxLocale !== undefined) {
        locale(dxLocale);
    }
}
