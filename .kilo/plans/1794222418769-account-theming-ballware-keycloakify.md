# Plan: Account-Theming aus `ballware-theme` in `ballware-keycloakify` überführen

## 1. Kontext (gegen Repo/`node_modules` verifiziert)

**Was das entfernte `ballware`-Theme am Account hatte** (4 Artefakte, alle in `git show HEAD:…` noch vorhanden):

| Artefakt | Inhalt |
|---|---|
| `account/theme.properties` | `parent=keycloak.v3`, `import=common/ballware`, `logo=/public/logo192.png`, `favIcon=/public/favicon.ico`, `styles=css/ballware.css` |
| `account/resources/css/ballware.css` | `.pf-v5-c-masthead` → `#3f51b5`, weiße Schrift, `min-height: 56px`, Material-Shadow; `.pf-v5-c-masthead .pf-v5-c-toolbar` → `#3f51b5` |
| `account/messages/messages_de.properties` | `accountManagementTitle=Ballware Benutzerkontoverwaltung`, `accountManagementWelcomeMessage=Willkommen bei der ballware Kontoverwaltung` |
| `account/messages/messages_en.properties` | `accountManagementTitle=Ballware Account Management`, `accountManagementWelcomeMessage=Welcome to ballware account management` |
| Assets kamen aus `common/ballware/resources/public/` | `logo192.png` (Blob `6bc3d12`, 2690 B), `favicon.ico` (Blob `d19a409`, 5694 B) |

**Heutiger Stand im Keycloakify-Modul** (pending Changes):

- `ballware-keycloakify/vite.config.ts:11` → `accountThemeImplementation: "Single-Page"`, `src/kc.gen.tsx` routed `themeType: "account"` → `src/account/KcPage.tsx`. Das Account-SPA ist also **bereits im Code**, stammt aber unverändert von `@keycloakify/keycloak-account-ui@260700.0.4` (Keycloak-Logo, PatternFly-Standardfarben, englisches `document.title`).
- Beide Realm-Dateien aktivieren es nicht: `import/ballware-realm.json:1604` und `keycloak-export/ballware-realm.json:3848` setzen `"accountTheme": "keycloak.v3"`.
- `ballware-keycloakify/dist_keycloak/` ist ein stale Artefakt (nur `login/`) und kein Maßstab.
- `theme.properties` wird von Keycloakify erzeugt: `parent=base`, `darkMode=true`, `deprecatedMode=false`, `locales=…` (`node_modules/keycloakify/src/bin/keycloakify/generateResources/generateResources.ts:682-718`). Für Single-Page wird **nur `account/index.ftl`** erzeugt (Zeilen 241-267); `styles`, `import`, `logo`, `favIcon` werden nicht geschrieben und von der generierten FTL auch nicht gelesen. **Die alten `theme.properties`-Zeilen lassen sich also nicht 1:1 portieren** – Branding läuft über CSS, Assets und i18n.
- **Ownership-Regel (kritisch):** `postinstall: keycloakify sync-extensions` (`package.json`) überschreibt jede geänderte Datei unter `src/account/**` und `src/shared/**`, sofern sie nicht beansprucht ist. Beanspruchung: `npx keycloakify own --path "account/…"`; owned Dateien stehen im Abschnitt `# === Owned files start ===` von `ballware-keycloakify/src/.gitignore` (aktuell nur `account/root/header.module.css`). Neu angelegte Dateien (eigene CSS-/Asset-/Override-Dateien) werden nie angefasst.
- **i18n-Override:** `src/account/i18n/messages_<lng>_override.properties` werden **zur Build-Zeit** mit der Basis mergeiert und als `theme/ballware-keycloakify/account/messages/messages_<lng>.properties` ins Jar geschrieben (`generateResources.ts:461-575`); `de` ist korrekt unterstützt. Der Mechanismus ist in den vendierten Dateien dokumentiert (`src/account/i18n/messages_en.properties:8-14`).
- **PatternFly-Ankerpunkte** ( SPA rendert exakt die Klassen des alten CSS): `KeycloakMasthead` (`src/shared/keycloak-ui-shared/masthead/Masthead.tsx:102-168`) → `.pf-v5-c-masthead` / `.pf-v5-c-toolbar` in `.pf-v5-c-page__header`; Sidebar `PageSidebar` → `.pf-v5-c-page__sidebar .pf-v5-c-nav`. Tokens: `--pf-v5-c-masthead--BackgroundColor` (scope `.pf-v5-c-masthead`, masthead.css:31), `--pf-v5-c-toolbar--BackgroundColor` (toolbar.css), `--pf-v5-global--primary-color--100/-200`, `--pf-v5-global--link--Color`, `--pf-v5-c-nav__link--m-current--BackgroundColor/-Color` (nav.css). PF-Masthead-Default-Min-Height ist `4.375rem` (70 px), nicht 56 px.
- `.pf-v5-c-masthead` setzt `--pf-v5-global--primary-color--100` / `--pf-v5-global--link--Color` selbst auf „light“ (masthead.css:16-27) → `:root`-Akzente färben den Masthead **nicht** kaputt.
- Dark Mode: `:where(.pf-v5-theme-dark)` (PatternFly, zero specificity) und `src/account/colorScheme.ts` – `:root`-Override gewinnt, Kontrast muss geprüft werden.
- `account`-Client im Realm ist bereits `publicClient: true`, `standardFlowEnabled: true`, `redirectUris: ["/realms/ballware/account/*"]` (`import/ballware-realm.json:555-579`) → passt zum `oidc-spa`-Login des Account-SPAs, keine Client-Änderung nötig.

## 2. Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Realm-Aktivierung | `accountTheme: "ballware-keycloakify"` in **beiden** Realm-Dateien |
| Branding-Umfang | Masthead `#3f51b5` **plus** Akzentfarbe (Links, Primary-Buttons, Sidebar-Current-Item) im Account-SPA |
| Assets | `logo192.png` + `favicon.ico` aus `git show HEAD:` wiederherstellen; Logo = Masthead-Brand, Favicon global (`index.html`) |
| i18n | `messages_de/en_override.properties` **und** `document.title` aus `t("accountManagementTitle")`; Welcome-Message wird nur ins Bundle geschrieben, nicht zusätzlich gerendert |
| Port von `theme.properties` (`parent`/`import`/`logo`/`favIcon`/`styles`) | **entfällt** – Single-Page-FTL konsumiert diese Zeilen nicht |
| Ownership | genau 2 neue Claims: `account/KcAccountUi.tsx`, `account/root/Header.tsx` (plus bereits owned `account/root/header.module.css`) |
| Login-Theme | unverändert (DevExtreme, `#0d6efd`); Branding-CSS liegt im Account-Chunk, nicht im Login-Chunk |

## 3. Aufgaben

1. **Assets wiederherstellen**
   ```bash
   git show HEAD:ballware-theme/src/main/resources/theme/ballware/common/resources/public/logo192.png \
     > ballware-keycloakify/src/account/assets/ballware-logo.png
   git show HEAD:ballware-theme/src/main/resources/theme/ballware/common/resources/public/favicon.ico \
     > ballware-keycloakify/public/favicon.ico
   ```
   `ballware-keycloakify/index.html:7` → `<link rel="icon" href="/favicon.ico" />` (Keycloakify rewriting auf `${resourcesPath}/dist/favicon.ico` funktioniert für beliebige `href`s, `generateFtl.ts:91-115`). `public/favicon-32x32.png` löschen (Referenz ist dann weg; `src/account/assets/favicon.svg` bleibt untouched – nur Passkey-Fallback).

2. **Ownership claims anlegen** (vor jeder Edit-Datei unter `src/account/`):
   ```bash
   cd ballware-keycloakify
   npx keycloakify own --path "account/KcAccountUi.tsx"
   npx keycloakify own --path "account/root/Header.tsx"
   ```
   Ergebnis prüfen: `src/.gitignore` listet beide Zeilen im „Owned files“-Abschnitt.

3. **Branding-CSS (neue, app-eigene Datei)** `ballware-keycloakify/src/account/branding/ballware-account.css`
   ```css
   :global(:root) {
       --pf-v5-global--primary-color--100: #3f51b5;
       --pf-v5-global--primary-color--200: #303f9f;
       --pf-v5-global--primary-color--300: #7986cb;
       --pf-v5-global--link--Color: #3f51b5;
       --pf-v5-global--link--Color--hover: #303f9f;
   }

   /* (0,2,0) -> gewinnt unabhängig von der CSS-Importreihenfolge */
   :global(.pf-v5-c-page__header .pf-v5-c-masthead) {
       --pf-v5-c-masthead--BackgroundColor: #3f51b5;
       --pf-v5-c-masthead--m-display-inline__main--MinHeight: 56px;
       --pf-v5-c-masthead--m-display-inline__content--MinHeight: 56px;
       --pf-v5-c-masthead--m-display-stack__main--MinHeight: 56px;
       color: #fff;
       box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%), 0 4px 5px 0 rgb(0 0 0 / 14%), 0 1px 10px 0 rgb(0 0 0 / 12%);
   }

   :global(.pf-v5-c-masthead .pf-v5-c-toolbar) {
       --pf-v5-c-toolbar--BackgroundColor: #3f51b5;
   }

   :global(.pf-v5-c-page__sidebar .pf-v5-c-nav) {
       --pf-v5-c-nav__link--m-current--BackgroundColor: #3f51b5;
       --pf-v5-c-nav__link--m-current--Color: #fff;
   }
   ```
   Import **nur** aus dem Account-Chunk heraus, d. h. in `src/account/KcAccountUi.tsx` direkt nach den beiden PatternFly-Imports (Zeilen 12-13), **nicht** in `src/main.tsx` (sonst landet das CSS im Login-Chunk).

4. **Masthead-Logo austauschen** (`src/account/root/Header.tsx`, owned): `import logoSvgUrl from "../assets/logo.svg"` → `import logoUrl from "../assets/ballware-logo.png"`; `brand.src` entsprechend setzen, `alt: t("logo")` bleibt. In `src/account/root/header.module.css` (bereits owned) `.brand`-Höhe an `logo192.png` anpassen (Ausgangswert 35 px, ggf. 32-40 px nach Screenshot).

5. **Titel-Parität** (`src/account/KcAccountUi.tsx`, owned): das module-level `document.title = "Account Management"` (Zeile 23) ersetzen; Titel erst nach i18n-Init setzen und bei Sprachwechsel aktualisieren, z. B.
   ```ts
   useEffect(() => {
       const setTitle = () => (document.title = i18n.t("accountManagementTitle"));
       setTitle();
       i18n.on("languageChanged", setTitle);
       return () => i18n.off("languageChanged", setTitle);
   }, [isI18nInitialized]);
   ```
   Fallback: leerer/Key-Wert → `"Account Management"`. (`TFuncKey` ist `any`, `i18next.d.ts` lockert das Typing – keine Typarbeit nötig.)

6. **i18n-Overrides anlegen**
   - `ballware-keycloakify/src/account/i18n/messages_de_override.properties`
     `accountManagementTitle=Ballware Benutzerkontoverwaltung`
     `accountManagementWelcomeMessage=Willkommen bei der ballware Kontoverwaltung`
   - `ballware-keycloakify/src/account/i18n/messages_en_override.properties`
     `accountManagementTitle=Ballware Account Management`
     `accountManagementWelcomeMessage=Welcome to ballware account management`

7. **Realm verdrahten**: in `import/ballware-realm.json` und `keycloak-export/ballware-realm.json` `"accountTheme": "keycloak.v3"` → `"ballware-keycloakify"`. `loginTheme`, `adminTheme`, `emailTheme`, Client `account` unverändert.

8. **E2E absichern**: neue `ballware-keycloakify/e2e/account.spec.ts` analog `e2e/login.spec.ts` (testDir `./e2e`, baseURL `http://localhost:4000`): Login über das Login-Theme (`testuser`/`password123`), danach `/realms/myrealm/account/`; Asserts: Masthead-`backgroundColor === "rgb(63, 81, 181)"`, Brand-`img`-`src` enthält `ballware-logo`, `document.title` enthält `Ballware` (de) bzw. `Ballware Account Management` (en), Sidebar-Current-Item nicht PatternFly-Standardgrau, keine Console-Errors (favicon-/`net::ERR`-Filter wie in `login.spec.ts:95` übernehmen), Screenshot nach `e2e/screenshots/`.

9. **README aktualisieren** (`ballware-keycloakify/README.md`): „No account theme“-Aussage (Zeilen 10-11, 100) ersetzen; neuer Abschnitt *Account-Theme (Single-Page SPA)* mit: Branding-Umfang, `accountTheme` im Realm, Liste der owned Dateien + Prozedur nach Upstream-Updates (`npx keycloakify own --path "…" --revert`, Update einspielen, Änderungen erneut anwenden, `git diff`-Review), Hinweis dass `src/.gitignore`/`public/keycloak-theme/.gitignore` committet sein müssen.

10. **Commits/Repo-Hygiene**: `ballware-keycloakify/src/.gitignore` und `ballware-keycloakify/public/keycloak-theme/.gitignore` **vor** dem Staging committen (aktuell untracked – sonst landet der komplette vendierte `src/account/**`-Baum im Commit). Der vorgemerkte Delete von `ballware-theme/**` bleibt wie beantragt bestehen.

## 4. Out of scope

- Multi-Page-Account-Theme (`account-v1`), Admin-/Email-Theme.
- Neue Login-Branding-Änderungen, DevExtreme-Lizenzwiring, CI-Workflow `.github/workflows/docker-image.yml`, `Dockerfile` (Stage `keycloakifybuilder` liefert das Account-Theme automatisch mit aus).
- `common/ballware`-Nachbau (`package.json` mit PatternFly/jQuery/devextreme) – im SPA nicht nötig.

## 5. Risiken

- **Upstream-Churn:** `KcAccountUi.tsx` und `Header.tsx` sind owned; jedes `@keycloakify/*`-Update erfordert manuelles Nachziehen (Schritt 9 dokumentiert es). Alternative ohne `own` = keine Titel-Parität.
- **Kaskadenreihenfolge:** PatternFly-Component-CSS kommt aus JS-Imports (`@patternfly/react-styles`), `base.css` enthält den Masthead nicht. Deshalb höher spezifische Selektoren (`.pf-v5-c-page__header .pf-v5-c-masthead`) statt Load-Order-Vertrauen.
- **Dark Mode:** PF setzt Dark-Tokens unter `:where(.pf-v5-theme-dark)`; `:root`-Override gewinnt, aber Kontrast von `#fff` auf `#3f51b5` (Sidebar/Buttons) in Dark Mode prüfen; sonst Akzente auf Light beschränken oder Fallback-Ton `#7986cb` nutzen.
- **Bundle-Größe:** Login- und Account-`dist` werden identisch ins Jar geschrieben (`generateResources.ts:137-156`) → Jar wächst deutlich; Account-Chunk (PatternFly + oidc-spa) ist lazy, darf im Login-CSS-Chunk nicht erscheinen (in Validierung prüfen).
- **Keycloak 26.6 vs. `@keycloakify/*@260700.x` (26.7-Linie):** Single-Page setzt die neue Account-Konsole (26.2+) voraus; Fallszenario, falls 26.6 die SPA nicht ausliefert: `accountThemeImplementation: "Multi-Page"` – erst nachweislich nötig, nicht vorbeugend umstellen.
- `logo192.png` ist eine 192-px-Rasterdatei; ggf. weich – späteres SVG optional.

## 6. Validierung

1. `cd ballware-keycloakify && npm ci && npm run build-keycloak-theme`
   - Jar-Check: `unzip -l dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` muss `theme/ballware-keycloakify/account/index.ftl`, `…/account/theme.properties`, `…/account/messages/messages_de.properties`, `…/account/resources/dist/**` enthalten.
   - `unzip -p … theme/ballware-keycloakify/account/messages/messages_de.properties | grep -E "accountManagement"` → beide Ballware-Zeilen (merge wirksam).
   - Login-CSS-Chunk frei von `.pf-v5-c-masthead`: `grep -rl "pf-v5-c-masthead" dist/assets/*.css` darf nur Account-Chunk-Treffer zeigen.
2. `npx keycloakify start-keycloak --keycloak-version 26 --port=4000` → `http://localhost:4000/realms/myrealm/account/` (de/en wechseln): Masthead `rgb(63, 81, 181)`, Ballware-Logo, Tab-Titel „Ballware Benutzerkontoverwaltung“, Buttons/Links/Sidebar in `#3f51b5`, keine Console-Errors (DPoP/oidc-spa beachten).
3. `npm run e2e` (Login-Suite muss unverändert grün bleiben, inkl. `rgb(139, 195, 74)`-Assert) plus neue `account.spec.ts`.
4. `npm run build` (tsc) und `npm run lint` fehlerfrei.
5. `npm ci`-Wiederholbarkeit: Nach Fresh-Install sind die owned Dateien und alle neuen Dateien (Branding-CSS, Override-Properties, Assets) unverändert; `git status` zeigt keine vendierten `src/account/**`-Dateien.
6. Devcontainer-Smoke: `docker compose build && docker compose up`, Account-Seite des Realms `ballware` öffnen, Masthead-Farbe + Favicon prüfen; Realm-Import akzeptiert `accountTheme: "ballware-keycloakify"`.

## 7. Offene Punkte (nicht blockierend)

- Exakte `.brand`-Höhe für `logo192.png` (Screenshot-Feinschliff).
- Ob `min-height: 56px` (Alt-Parität) oder PatternFly-Standard `70px` im neuen SPA bevorzugt wird – Plan geht von 56 px aus.
- Künftige SVG-Version des Ballware-Logos (optional, löst Schärfeproblem).
