# Plan: `ballware-keycloakify` – Keycloakify-Login-Theme parallel zu `ballware-theme`

## 1. Kontext (ist im Repo verifiziert)

Bestehendes Theme (`ballware-theme/`):
- Klassisches FreeMarker-Theme: `src/main/resources/META-INF/keycloak-themes.json` → Theme-Name `ballware`, Typen `login|account|common`.
- `login/theme.properties`: `parent=base`, `import=common/ballware`, lädt `node_modules/bootstrap/dist/css/bootstrap.css` + `node_modules/devextreme/dist/css/dx.material.blue.light.css`, `jquery.js` + `devextreme/dist/js/dx.all.js` (ballware-theme/src/main/resources/theme/ballware/login/theme.properties:1-4).
- DevExtreme 22.2.3 + Bootstrap 5 + jQuery, imperativ in den FTL-Templates aufgerufen. Genutzte Widgets: `dxTextBox` (14), `dxButton` (9), `dxCheckBox` (2), `dxValidator` (1), `dxToolbar` (1), `dxToast` (1), `dxRadioGroup` (1), `dxDropDownButton` (Locale im Toolbar).
- überschriebene Login-Seiten (genau 9): `login`, `register`, `error`, `info`, `login-otp`, `login-config-totp`, `login-reset-password`, `login-update-password`, `login-verify-email`. `template.ftl` stellt das gemeinsame Shell-Layout (`dx-viewport`, `#appbar` Toolbar, `dx-fieldset`/`dx-field`, `dxToast` für `message`, Inline-`.dx-toolbar`-Branding `#0d6efd`).
- `account`-Theme existiert nur aus `theme.properties` (`parent=keycloak.v3`) + `resources/css/ballware.css` + `messages/messages_{de,en}.properties`.
- Build: Maven + frontend-maven-plugin (Node v18.18.2, `installDirectory: ../` → Repo-Ordner `node/`), npm ci in `common/resources`, Jar → `Dockerfile` Stage `themebuilder` → `/opt/keycloak/providers`.
- Deployment: `Dockerfile` (Keycloak 26.6), `.devcontainer/docker-compose.yml` (Keycloak + Azure-SQL-Edge, Port 8080/8443, `--hostname-strict=false`), CI `.github/workflows/docker-image.yml` (GitVersion → ghcr.io).
- Realm (`import/ballware-realm.json`): `loginTheme=ballware`, `accountTheme=ballware`, `adminTheme=keycloak.v2`, `internationalizationEnabled=true`, `supportedLocales=[de,en]`, `defaultLocale=de`, `registrationAllowed=false`, **0 Identity-Provider** (Social-Providers-Block ist de facto ungenutzt), keine Client-seitigen `loginTheme`-Override, keine Realm-seitigen Login-Message-Overrides.

Keycloakify-Fakten (verifiziert gegen docs.keycloakify.dev + npm):
- Keycloakify 11 (`keycloakify@^11.16`), Vite-Plugin `keycloakify/vite-plugin`, CLI `npx keycloakify …`, `npm run build-keycloak-theme` → `dist_keycloak/keycloak-theme-for-kc-*.jar`. Keycloak 26 nutzt `keycloak-theme-for-kc-all-other-versions.jar`, Ablage in `/opt/keycloak/providers` (Jar braucht lokale Maven+JDK-Installation beim Build).
- Theme-Name im Admin-Dropdown = `themeName` im Vite-Plugin (Default: `package.json.name`).
- Seiteneigene Komponenten via `npx keycloakify eject-page`; Default-Seiten rendern ein echtes `<form action={url.loginAction} method="post">` → `useSubmitBehavior`-Buttons von DevExtreme funktionieren.
- `doUseDefaultCss={false}` entfernt PatternFly komplett; `classes` (`ClassKey`) zum Umschreiben der `kc*`-Klassen.
- `devextreme-react@26.1.x` hat Wrapper für genau die benötigten Widgets (`text-box`, `button`, `check-box`, `radio-group`, `number-box`, `toolbar`, `toast`, `validator`, `drop-down-button`, `validation-group/summary`), peer `devextreme` gleiche Version, React 16–19. `dx.material.blue.light.css` ist in DevExtreme 25/26 weiterhin enthalten.
- DevExtreme-Lizenzprüfung (Code von `devextreme@26.1.6` verifiziert): `devextreme/core/config` enthält Option `licenseKey` mit Platzhalter `/* ___$$$$$___devextreme___lcp___placeholder____$$$$$ */`; beim Initialisieren des Config-Moduls wird ein vorhandenes Globales `DevExpress.config` übernommen (`if (typeof DevExpress !== "undefined" && DevExpress.config) configMethod(DevExpress.config)`). `validateLicense()` prüft den Key offline (RSA/LCP) und meldet: `W0019` = kein Key, `W0021` = ungültig/`LCX`- oder Alt-Format (`ewog…`), `W0020` = `version-mismatch` wegen `maxVersionAllowed` im Key; zusätzlich wird ein Trial-Panel (Banner) angezeigt. npm-Install und Vite-Build brauchen **keinen** Key – die Prüfung läuft ausschließlich im Browser.
- Keycloakify "Environment Variables": `keycloakify({ environmentVariables: [{ name: "…", default: "…" }] })` → Wert der Keycloak-Server-Env wird zur Laufzeit unter `kcContext.properties.<NAME>` bereitgestellt (kein Rebuild nötig; lokal: `NAME=… npx keycloakify start-keycloak`, in Stories via `kcContext.properties`).

## 2. Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Ordner | `ballware-keycloakify/` (Korrektur der Schreibweise) |
| Keycloak-Theme-Name | `ballware-keycloakify` (`themeName` im Vite-Plugin) |
| Framework / Anbindung | React + `devextreme-react`-Wrapper-Komponenten (kein jQuery, kein `dx.all.js`) |
| DevExtreme-Version | aktuell: `devextreme` + `devextreme-react` 26.1.x (LCP-Key deckt 26.1 ab) |
| DevExtreme-Lizenzkey | **nie** zur Build-Zeit ins Bundle/Image; Laufzeit-Injektion über die Keycloak-Env-Variable `DEVEXTREME_LICENSE` |
| Seitenumfang | alle 9 Login-Seiten; **kein** Account-/Email-/Admin-Theme |
| Deployment | beide Theme-Jars im selben Keycloak-Image (neue Docker-Build-Stufe); kein separates Jar-Artefakt in der CI |
| Branding-CSS | Kopie in `ballware-keycloakify` (eigene `main.css`, unabhängig gepflegt; kein geteiltes CSS-Asset) |
| Aktivierung für Vergleichstest | manuell im lokalen Devcontainer: Client `ballwareweb` → `loginTheme=ballware-keycloakify`; `import/ballware-realm.json` bleibt unverändert |

## 3. Zielstruktur

```
ballware-keycloakify/
  package.json               # name: ballware-keycloakify; scripts dev/build/build-keycloak-theme/storybook
  vite.config.ts             # keycloakify({ themeName: "ballware-keycloakify", accountThemeImplementation: "none",
                             #   environmentVariables: [{ name: "DEVEXTREME_LICENSE", default: "" }] })
  tsconfig.json  index.html  .gitignore   # node_modules, dist, dist_keycloak, .keycloakify
  public/keycloakify-dev-resources/        # aus dem Starter (nur Storybook)
  src/
    KcContext.ts  (bzw. login/KcContext.ts)
    login/
      dxLicense.ts           # setzt window.DevExpress.config.licenseKey aus kcContext.properties.DEVEXTREME_LICENSE
      KcPage.tsx             # Router über kcContext.pageId, doUseDefaultCss={false}, classes; import "./dxLicense" zuerst
      Template.tsx           # ejected: dx-viewport + DxToolbar-Shell + DxToast
      main.css               # dx.common.css + dx.material.blue.light.css + kopiertes ballware-Branding
      i18n/                  # messages_customSet/{de,en}.ts falls needed
      pages/                 # 9 ejected Seiten: Login, Register, WebAuthn..., Error, Info,
                             # LoginOtp, LoginConfigTotp, LoginResetPassword, LoginUpdatePassword, LoginVerifyEmail
      components/
        KcToolbar.tsx        # DxToolbar: Realm-Titel (before) + DxDropDownButton Locale (after)
        Field.tsx            # dx-field / dx-field-label / dx-field-value(-static) Wrapper
        KcToast.tsx          # DxToast statt PatternFly-Alert
```

## 4. Aufgaben (Reihenfolge)

1. **Scaffold**: Starter `keycloakify/keycloakify-starter` nach `ballware-keycloakify/` klonen, `.yarn.lock` löschen, npm-`name` = `ballware-keycloakify`, `accountThemeImplementation: "none"`, `.gitignore` (auch in Root-`.gitignore` ergänzen: `ballware-keycloakify/node_modules`, `dist`, `dist_keycloak`, `.keycloakify`).
2. **Dependencies**: `devextreme@^26.1`, `devextreme-react@^26.1`, `bootstrap@^5.3` (Layout-Parität: `container-fluid/row/col-lg-6/pt-2` wie in `template.ftl`), `devextreme`-Localization; Lockfile committen.
2a. **Lizenzkey-Verkabelung** (Details in Abschnitt 6): `environmentVariables: [{ name: "DEVEXTREME_LICENSE", default: "" }]` im Keycloakify-Plugin, `src/login/dxLicense.ts` als erster Import in `KcPage.tsx`/`main.tsx`, `DEVEXTREME_LICENSE` in `.devcontainer/docker-compose.yml` aus der Host-Env.
3. **Shell portieren**: `npx keycloakify eject-page` → `Template.tsx` + die 9 Seiten. `Template.tsx` so anpassen, dass es liefert: `body class="dx-viewport"`, `#appbar` mit `KcToolbar`, Bootstrap-Grid, `div.dx-fieldset` + `div.dx-fieldset-header` (Header = `headerNode`), `div.dx-field` für Info, `socialProvidersNode` unverändert (0 Provider im Realm, Markup-Parität halten), `KcToast` für `message` (`displayTime: 20000`, Typ aus `message.type`, `kcSanitize`).
4. **CSS portieren**: Inline-`<style>` aus `login/template.ftl:37-44` (`.dx-toolbar` `#0d6efd`, Schatten, Padding) + Bootstrap-Klassen nach `src/login/main.css`; DevExtreme-CSS per `import "devextreme/dist/css/dx.common.css"` und `dx.material.blue.light.css"` im Entry; `doUseDefaultCss={false}` + `classes`-Overrides, damit PatternFly gar nicht geladen wird.
5. **Login-Seite** (`login.ftl` → `Login.tsx`) als Referenzseite komplett auf DevExtreme umstellen (Mapping unten), inklusive `usernameHidden`/`auth.showUsername()`-Fallback-Zweig (`#resetloginbutton` → `DxButton icon="revert" stylingMode="text"` → `url.loginRestartFlowUrl`).
6. **Restliche 8 Seiten** nach demselben Muster portieren; IDs beibehalten (`kc-form-login`, `kc-login`, `kc-form-options`, `kc-social-providers`, `input-error`), damit CSS-Parität und Testbarkeit gleich bleiben.
7. **i18n**: de/en über Keycloakify-`i18n` (`msg`/`msgStr`); DevExtreme-Lokalisierung: `import localization from "devextreme/localization"; localization.load(deMessages); localization.locale(kcContext.locale.current)`. Prüfen, dass `register`/`login-update-password` das Feld `password-confirm` genau dann senden, wenn Keycloak es erwartet (`doMakeUserConfirmPassword` empirisch testen; Realm hat `registrationAllowed=false` → geringes Risiko).
8. **Storybook**: `npx keycloakify add-story` für alle 9 Seiten inkl. Fehlerfällen (`messagesPerField.existsError`, `message.type=warning|error`, `usernameHidden`, OTP mit mehreren Credentials, TOTP-Setup).
9. **Lokaler Keycloak-Test**: `npx keycloakify start-keycloak` (KC 26, Realm `myrealm`, `testuser/password123`) – benötigt Docker **und** Maven+JDK lokal.
10. **Jar-Build**: `npm run build-keycloak-theme` → `dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar`; Namen/Anzahl der Jars prüfen und ggf. `keycloakVersionTargets` auf KC 26 eingrenzen.
11. **Dockerfile-Integration** (neue Stage vor `builder`):
    ```dockerfile
    FROM node:22-alpine AS keycloakifybuilder
    RUN apk add --no-cache openjdk21 maven
    WORKDIR /home/app
    COPY ballware-keycloakify/package*.json ./
    RUN npm ci
    COPY ballware-keycloakify/ ./
    RUN npm run build-keycloak-theme

    # in Stage builder ergänzen:
    COPY --from=keycloakifybuilder /home/app/dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar /opt/keycloak/providers/
    ```
    `.dockerignore` (neu, Repo-Root) anlegen: `node_modules`, `**/node_modules`, `dist`, `dist_keycloak`, `.keycloakify`, `ballware-theme/target`, `**/target`, `.devcontainer/data`, `keycloak-export`, `export` — **nicht** `.git` ignorieren. `.github/workflows/docker-image.yml` bleibt unverändert. **Kein `ENV`/`ARG` für `DEVEXTREME_LICENSE` im Dockerfile und kein Build-Secret in der Stage** – der Key kommt ausschließlich zur Laufzeit des Keycloak-Containers (siehe Abschnitt 6).
12. **Vergleichstest im Devcontainer**: `docker compose build` + `up`, Admin-Console → Clients → `ballwareweb` → `Login Theme = ballware-keycloakify`; A/B direkt gegen `ballware` (FTL) vergleichen; beide Themes müssen parallel lauffähig bleiben (kein Name-Collision, zwei Jars in `providers/`).

## 5. Markup-/Widget-Mapping (FTL → React)

| FTL / jQuery | devextreme-react |
|---|---|
| `$('#appbar').dxToolbar({items})` | `<DxToolbar items={...}>` in `KcToolbar`; Realm-Titel `location:'before'`, Locale `location:'after', widget:'dxDropDownButton'` bzw. `<DxItem component={DxDropDownButton} …>`; `onItemClick` → `window.location.href = url` |
| Locale-Daten `${l.url}` / `${l.label}` | `kcContext.locale.supported` (`{ url, label }`), `kcContext.locale.current`; `&amp;`-Dekodierung entfällt (React/JSON statt FTL-String) |
| `dxTextBox({name, value, validationMessageMode:'always', isValid, validationErrors:[{message}]})` | `<DxTextBox name="username" defaultValue={login.username ?? ""} validationMessageMode="always" isValid={!messagesPerField.existsError("username","password")} validationErrors={[{ message: messagesPerField.getFirstError("username","password") }]} />` — Keycloak-Fehlermeldungen enthalten HTML → `dangerouslySetInnerHTML` nicht möglich in DevExtreme-Optionen: Text via `kcSanitize(msgStr…)`-String verwenden und DOM-Ausgabe prüfen |
| `dxTextBox({mode:'password'})` | `<DxTextBox mode="password" name="password" />` (DevExtreme-Visibility-Eye; nicht zusätzlich Keycloakify-Reveal einbauen) |
| `dxButton({text, type:'success', useSubmitBehavior:true})` | `<DxButton text={msgStr("doLogIn")} type="success" useSubmitBehavior />` – **muss** Kind des `<form action={url.loginAction} method="post">` sein |
| `dxButton({icon:'revert', stylingMode:'text', onClick})` | identisch als React-Props |
| `dxCheckBox({name:'rememberMe'})` | `<DxCheckBox name="rememberMe" defaultValue={!!kcContext.login.rememberMe} />` (bessere Parität als FTL) |
| `dxRadioGroup({items, dataSource})` (`login-otp`) | `<DxRadioGroup items={otpCredentials} />`, `name="otpCredential"` |
| `dxValidator({...})` (`login-config-totp`) | `<DxValidator><DxRequiredRule …/></DxValidator>` als Nested-Option im jeweiligen Editor |
| `dxToast({type,message,displayTime:20000,visible:true})` | `<DxToast … >` bzw. `notify(message, type)` – Verhalten (20 s, persistent) gegen FTL-Verhalten validieren |
| `dx-field`/`dx-field-label`/`dx-field-value(-static)` | eigene `Field.tsx`-Wrapper; kein `kcClsx` nötig, wenn `doUseDefaultCss={false}` |
| Hidden `credentialId` | `<input type="hidden" name="credentialId" defaultValue={auth.selectedCredential} />` beibehalten |

## 6. DevExtreme-Lizenzkey zur Laufzeit (`DEVEXTREME_LICENSE`)

**Harte Regel:** Der Key darf nicht im Jar, nicht im JS-Bundle, nicht im Docker-Image und nicht im Repo landen. Er wird beim Keycloak-Start als Umgebungsvariable gesetzt und von Keycloakify zur Laufzeit in `kcContext.properties` gereicht.

1. `vite.config.ts`:
   ```ts
   keycloakify({
       themeName: "ballware-keycloakify",
       accountThemeImplementation: "none",
       environmentVariables: [{ name: "DEVEXTREME_LICENSE", default: "" }]
   })
   ```
2. `src/login/dxLicense.ts` – muss **vor** jedem `devextreme*`-Import ausgewertet werden (Import-Reihenfolge in `KcPage.tsx`/`main.tsx` ist maßgeblich; Modul hat Side-Effects, darf also nicht tree-shaked/hoisted werden):
   ```ts
   const licenseKey = (window.kcContext?.properties ?? {}).DEVEXTREME_LICENSE ?? "";
   (window as any).DevExpress = {
       ...(window as any).DevExpress,
       config: { ...(window as any).DevExpress?.config, licenseKey }
   };
   ```
   DevExtreme liest genau dieses Globale beim Init des Config-Moduls. Fallback/Redundanz: zusätzlich `import config from "devextreme/core/config"; config({ licenseKey });` in `KcPage.tsx` – beide Wege setzen `config().licenseKey`, der Globale ist der zuverlässigere, weil er vor der Modul-Initialisierung greift.
3. **Verboten** (Prüfpunkt im Code-Review): `ENV`/`ARG` für den Key im `Dockerfile`, `define`/`import.meta.env.VITE_*`/`.env`-Dateien mit Key-Wert in `ballware-keycloakify/`, Key in `keycloak-theme`-Assets, Key in `import.meta`-Konstanten. Der Key darf im gebauten Bundle nicht per `grep` im Jar auffindbar sein.
4. Betrieb (Keycloak-Container, **nicht** Build-Argument):
   - Docker: `docker run -e DEVEXTREME_LICENSE=… ` (bzw. Compose `environment: [ "DEVEXTREME_LICENSE=${DEVEXTREME_LICENSE}" ]`)
   - Helm: `extraEnvVars: [{ name: DEVEXTREME_LICENSE, value: … }]` / Secret-referenziert
   - Keycloak liest die Variable beim Server-Start → Key-Wechsel erfordert Keycloak-Neustart, kein Theme-Rebuild.
5. `.devcontainer/docker-compose.yml`: `DEVEXTREME_LICENSE: ${DEVEXTREME_LICENSE}` aus der Host-Shell ergänzen; Wert **nicht** in die bereits committete Repo-`.env` schreiben (die enthält produktive DB-Zugangsdaten und ist eingecheckt). Empfehlung: lokale Shell-Env oder gitignored `.devcontainer/.env` und `.gitignore`-Eintrag. Fehlt die Variable → Theme läuft weiter, DevExtreme zeigt Trial-Banner + `W0019`.
6. Dev-Workflows: `DEVEXTREME_LICENSE="<key>" npx keycloakify start-keycloak`; Storybook-Stories setzen `kcContext.properties.DEVEXTREME_LICENSE` explizit (eine Story mit Key, eine ohne Key für den Banner-Fall).

## 7. Build-/Toolchain-Voraussetzungen (Doku nötig)

- Lokales Node **≥ 20 (empfohlen 22)**; der im Repo mitgebrachte `node/`-Ordner (v18.18.2, frontend-maven-plugin des FTL-Themes) ist **nicht** für Keycloakify zu verwenden.
- `keycloakify build` und `npx keycloakify start-keycloak` brauchen Docker + Maven + JDK ≥ 17 lokal.
- Bundle: ausschließlich einzelne `devextreme-react`-Imports (Paket ist `sideEffects: false`), niemals `devextreme/dist/js/dx.all.js` (≈ 7 MB) — Jar-Größe nach Build messen (Zielgröße dokumentieren).
- `npm ci`/Vite-Build/Docker-Build benötigen **keinen** DevExtreme-Lizenzkey (Prüfung läuft nur im Browser); `devextreme-react` und `devextreme` immer auf identische Version pinnen (exakte peer-Dependency).

## 8. Validierung

1. `npm run build` (tsc + vite) und `npm run build-keycloak-theme` fehlerfrei; Jar-Name/-inhalt prüfen (statische Assets inkl. `dxiconsmaterial.woff2` und `Roboto-*.woff2` müssen im Jar landen, sonst fehlen DevExtreme-Icons/Fonts).
2. **Kein Key im Artefakt:** `grep -r "LCP\|licenseKey\|DEVEXTREME_LICENSE" dist_keycloak/` darf nur den Variablennamen aus der Keycloakify-Umgebungskonfiguration zeigen, nie einen Key-Wert.
3. **Lizenz-Laufzeitcheck** im Browser (DevTools Console) mit gesetzter Env-Variable: keine `W0019`/`W0020`/`W0021`, kein Trial-/Not-Licensed-Panel auf allen 9 Seiten.
4. Negativtest: Keycloak **ohne** `DEVEXTREME_LICENSE` starten → Theme ist voll bedienbar, DevExtreme zeigt Hinweis/Banner; dokumentiertes erwartetes Verhalten für OPS.
5. Storybook: alle 9 Seiten × de/en × Fehlerfälle (invalid username/password, `usernameHidden`, OTP mit 2 Credentials, TOTP-Setup, `message.type` info/warning/error) × Story mit/ohne Key.
6. `npx keycloakify start-keycloak` (mit `DEVEXTREME_LICENSE` in der Shell): Login success/fail, `rememberMe`, Reset-Password-Flow, Update-Password-Flow (nach Reset-Link), Verify-Email, OTP-Seite, Locale-Wechsel über `?ui_locales=de|en` und über Toolbar-Dropdown.
7. Devcontainer mit echtem ballware-Realm: `ballwareweb` auf `ballware-keycloakify` stellen, beide Themes im Vergleich; prüfen: Toolbar-Branding, Feld-Layout, Toast, Fokusreihenfolge/Tabindex, Submit funktioniert (Keycloak-Log: kein 400 durch fehlende Felder wie `credentialId`/`password-confirm`).
8. Regression: Realm mit `loginTheme=ballware` (FTL) muss unverändert funktionieren (DevExtreme 22.2 braucht keinen Key), beide Jars koexistieren.

## 9. Risiken / Fallstricke

- **Lizenz-Key im Client sichtbar**: `kcContext.properties.DEVEXTREME_LICENSE` steht im ausgelieferten HTML – für DevExtreme zulässig (Key ist client-seitig gedacht), aber bewusst: kein Secret, das nur Server-seitig wirken soll; Key-Rotation = Keycloak-Neustart.
- **Key-Version passt nicht zur Paketversion** (`W0020`, `maxVersionAllowed`): dann `devextreme`/`devextreme-react` auf die höchste abgedeckte Version umstellen (beide Pakete immer gleich pinnen, peer-Dependency ist exakt versioniert).
- **Falsches Key-Format** (`LCX…` oder `ewog…` → `W0021`): nur LCP-Produktkeys aus dem DevExpress Download Manager akzeptieren; Altkeys müssen konvertiert werden (`devextreme-license`-Tooling im Paket `devextreme/license/`).
- **Import-Reihenfolge**: wird `dxLicense.ts` nach den DevExtreme-Modulen ausgewertet, ist die Config zu spät gesetzt und der Trial-Banner erscheint trotz Key → Import-Reihenfolge in `KcPage.tsx`/`main.tsx` explizit testen.
- **Env-Variable fehlt im Deploy**: Stille Degradation (Banner statt Fehler) → in OPS-Doku und im Devcontainer-Kommentar explizit benennen.
- **DevExtreme 26 vs 22.2**: Material-Theme-Markup/Abstände können leicht abweichen → bewusste Abweichung, visuell A/B prüfen (Entscheidung: aktuelle Version).
- **Keycloakify ignoriert Realm-/Admin-Console-Message-Overrides** für Login-Seiten: etwaige Textanpassungen müssen künftig in `src/login/i18n/messages_customSet/{de,en}.ts` gepflegt werden (aktuell nicht betroffen, aber künftig wirksam).
- **Mixed-Theming**: Login = `ballware-keycloakify`, Account bleibt `ballware` (FTL) → Account-Seiten sehen anders aus; bewusst außer Scope.
- **Keycloakify-Validierung vs DevExtreme-Validierung**: doppelte Fehleranzeigen vermeiden (DevExtreme `validationMessageMode:'always'` beibehalten, Keycloakify-eigene Live-Validierung nicht parallel aktivieren).
- **Keycloak-Sanitized-HTML in Fehlermeldungen** (`kcSanitize` im FTL): in React nicht blind als HTML einsetzen; DevExtreme erwartet Strings → Text extrahieren bzw. `kcSanitize`-String verwenden und Darstellung prüfen.
- **Hidden-Fields/Authenticator-Parität**: `credentialId`, OTP-Credential-Auswahl, ggf. WebAuthn-Felder müssen erhalten bleiben, sonst brechen Flows.
- **Jar-Größe/Asset-URLs**: relative Font-/Icon-Pfade des DevExtreme-CSS müssen von Vite korrekt in das Theme-Bundle geschrieben werden.
- **Node-Major-Konflikt**: zwei Node-Toolchains im Repo (18 für Maven-Plugin, ≥20 für Keycloakify) – sauber dokumentieren, sonst Build-Fehler im Devcontainer.
- Hinweis außerhalb dieses Plans: `.env` enthält produktive DB-Zugangsdaten im Repo; nicht Teil der Aufgabe, sollte separat bereinigt werden.

## 10. Out of Scope

- Account-, Email- und Admin-Theme (Keycloakify-Support vorhanden, aber nicht Teil dieses Schnitts).
- Abschalten/Ersetzen des bestehenden `ballware`-FTL-Themes; Realm-Import und CI-Workflow bleiben unverändert.
- Geteiltes Branding-CSS über beide Themes hinweg (bewusst: CSS-Kopie).
- Separate Jar-Auslieferung in der CI (Release-Asset/Artifakt).

## 11. Offene Punkte (nicht blockierend)

1. Exakte `keycloakVersionTargets`-Konfiguration: Defaults belassen und nur den KC-26-Jar kopieren, oder auf KC 26 eingrenzen (weniger Build-Zeit) – beim ersten Build anhand der generierten Jar-Namen entscheiden.
2. Ob Bootstrap 5 im Keycloakify-Theme erhalten bleibt (Layout-Parität) oder durch `main.css`-eigene Grid-Regeln ersetzt wird – Empfehlung: erst behalten, später aufräumen.
