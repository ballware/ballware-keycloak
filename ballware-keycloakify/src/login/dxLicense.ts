import type { KcContext } from "./KcContext";

/**
 * DevExtreme's license key must never be part of the bundle or the jar.
 * It is provided at runtime by the Keycloak server environment (Keycloakify
 * "environmentVariables") and lands in kcContext.properties.DEVEXTREME_LICENSE.
 *
 * This module MUST be imported before any devextreme* import: DevExtreme reads
 * the global DevExpress.config while its config module is initialized.
 */

const LICENSE_ENV_NAME = "DEVEXTREME_LICENSE";

type DxGlobalConfig = { licenseKey?: string };

declare global {
    interface Window {
        DevExpress?: { config?: DxGlobalConfig };
    }
}

function readLicenseKey(kcContext: KcContext | undefined): string {
    const properties = (kcContext?.properties ?? {}) as Record<string, string | undefined>;

    return properties[LICENSE_ENV_NAME] ?? "";
}

export function applyDxLicense(kcContext: KcContext | undefined): void {
    const licenseKey = readLicenseKey(kcContext);

    const devExtreme = window.DevExpress ?? {};

    if (licenseKey === "") {
        // No key on purpose: DevExtreme must show its trial notice (W0019), not an invalid-key error (W0021).
        window.DevExpress = { ...devExtreme, config: { ...devExtreme.config } };

        return;
    }

    window.DevExpress = {
        ...devExtreme,
        config: { ...devExtreme.config, licenseKey }
    };
}

applyDxLicense(window.kcContext?.themeType === "login" ? window.kcContext : undefined);
