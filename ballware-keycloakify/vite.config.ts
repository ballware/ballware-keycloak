import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        keycloakify({
            themeName: "ballware-keycloakify",
            accountThemeImplementation: "Single-Page",
            // Only the Keycloak 26 jar ("all-other-versions") is needed, skip the KC 22..25 build
            keycloakVersionTargets: {
                "22-to-25": false,
                "all-other-versions": true
            },
            // Runtime-only env var: value comes from the Keycloak server environment, never from the bundle.
            environmentVariables: [{ name: "DEVEXTREME_LICENSE", default: "" }]
        })
    ]
});
