# ballware-keycloakify

Keycloakify v11 login **and** account theme (`ballware-keycloakify`) – the React + `devextreme-react`
26.1 port of the classic FreeMarker theme `ballware` (DevExtreme 22.2 + Bootstrap + jQuery) for login,
plus the Keycloakify account SPA (Single-Page) for the account console. The FreeMarker theme project
`ballware-theme` has been removed from this repository; this theme is the only login and account theme
in the image, and `import/ballware-realm.json` sets `loginTheme: "ballware-keycloakify"` and
`accountTheme: "ballware-keycloakify"`.

Scope: the 9 login pages that the old theme overrode (`login`, `register`, `error`, `info`,
`login-otp`, `login-config-totp`, `login-reset-password`, `login-update-password`, `login-verify-email`)
plus the account console as a Single-Page SPA (see *Account-Theme*). No email / admin theme –
those still use Keycloak's built-ins. Other login pages fall back to Keycloakify's `DefaultPage`
with our shell (unstyled widgets).

## Layout

```
src/login/
  KcPage.tsx          page router (imports ./dxLicense first)
  Template.tsx        shell: dx-viewport body, #appbar toolbar, dx-fieldset, toast
  main.css            branding (.dx-toolbar #0d6efd, shadows) – DevExtreme/Bootstrap CSS is
                      imported from Template.tsx
  dxLicense.ts        runtime DevExtreme license wiring
  components/         KcToolbar, KcToast, Field, CancelAiaButton
  lib/                kcText (Keycloak HTML -> text for DevExtreme), dxLocalization
  pages/              the 9 ported pages + *.stories.tsx
src/account/          vendored @keycloakify/keycloak-account-ui (see Account-Theme)
  branding/           ballware-account.css – imported only from KcAccountUi.tsx
  assets/             ballware-logo.png (ours) + the vendored keycloak assets
  i18n/               messages_<lng>.properties + messages_<lng>_override.properties
  KcAccountUi.tsx     owned: branding import + i18n-driven document.title
  root/Header.tsx     owned: ballware masthead brand
  root/header.module.css  owned: .brand height
src/shared/           vendored @keycloakify/keycloak-ui-shared
```

## Account-Theme (Single-Page SPA)

`vite.config.ts` sets `accountThemeImplementation: "Single-Page"`, so `import/ballware-realm.json`
and `keycloak-export/ballware-realm.json` both set `accountTheme: "ballware-keycloakify"`. The SPA
(`@keycloakify/keycloak-account-ui` + `oidc-spa`) is what Keycloak 26.2+ ships as the new account
console; Keycloakify generates only `account/index.ftl` for it, so the old FreeMarker
`theme.properties` keys (`parent`, `import`, `logo`, `favIcon`, `styles`) have no equivalent — branding
runs through CSS, assets and i18n instead.

Branding scope (all of it inside the **account** chunk only, never the login chunk):

| Piece | Where |
|---|---|
| Masthead `#3f51b5`, white text, Material shadow, `min-height: 56px` | `src/account/branding/ballware-account.css` |
| Accent tokens (`--pf-v5-global--primary-color--100/-200/-300`, link colors) | same file (`:root`; dark mode lifts links to `#7986cb`) |
| Sidebar current item `#3f51b5` / white | same file |
| Masthead logo = `logo192.png` (192 px, restored from the old theme) | `src/account/assets/ballware-logo.png`, used in `src/account/root/Header.tsx`, `.brand { height: 36px }` |
| Favicon = `favicon.ico` (restored from the old theme) | `public/favicon.ico` + `<link rel="icon" href="/favicon.ico">` in `index.html`; Keycloakify rewrites it to `${resourcesPath}/dist/favicon.ico` |
| `accountManagementTitle` / `accountManagementWelcomeMessage` (de/en) | `src/account/i18n/messages_de_override.properties`, `messages_en_override.properties` (merged at build time into `theme/ballware-keycloakify/account/messages/messages_<lng>.properties`) |
| Tab title follows `accountManagementTitle`, incl. on language change | `src/account/KcAccountUi.tsx` (replaces the upstream `document.title = "Account Management"`) |

`#3f51b5` is the old account masthead color; the login theme stays on DevExtreme `#0d6efd`.
Vite inlines the 2.7 kB logo as a data URI (below `assetsInlineLimit`), so the jar carries it inside
the account JS chunk instead of as a separate asset file.

### Owned files

`postinstall: keycloakify sync-extensions` re-copies every vendored file under `src/account/**` and
`src/shared/**` unless it is claimed. Claims live in the `# === Owned files start ===` block of
`src/.gitignore`; currently:

```
account/KcAccountUi.tsx
account/root/Header.tsx
account/root/header.module.css
```

After an `@keycloakify/keycloak-account-ui` / `@keycloakify/keycloak-ui-shared` update:

```bash
npx keycloakify own --path "account/KcAccountUi.tsx" --revert
npx keycloakify own --path "account/root/Header.tsx" --revert
npm ci                                  # vendor the new upstream version
npx keycloakify own --path "account/KcAccountUi.tsx"
npx keycloakify own --path "account/root/Header.tsx"
# re-apply: branding import + title effect (KcAccountUi.tsx), ballware-logo import (Header.tsx)
git diff src/account                    # review that the branding survived the update
```

Never edit the vendored base translations directly — overrides belong in
`src/account/i18n/messages_<lng>_override.properties`.
`src/.gitignore` and `public/keycloak-theme/.gitignore` are generated by Keycloakify and **must be
committed**: without them the whole vendored `src/account/**` tree shows up as untracked/modified.

## Commands

```bash
npm ci
npm run dev                  # vite dev; uncomment the mock block in src/main.tsx to preview a page
npm run build                # tsc + vite build
npm run build-keycloak-theme # -> dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar
npm run storybook            # 9 pages x de/en x error variants
npx keycloakify start-keycloak --keycloak-version 26   # local KC 26 + realm myrealm (testuser/password123)
npm run e2e                  # Playwright e2e against http://localhost:4000 (see below)
```

Prerequisites for the jar build: Node >= 20 (22 recommended), Maven and JDK >= 17.
`npm run build-keycloak-theme` is executed inside `node:22-alpine` in the `keycloakifybuilder`
Docker stage, which installs `openjdk21` + `maven`.

**Do not use the repo's `node/` folder** (v18.18.2, downloaded by the FTL theme's
frontend-maven-plugin) for this theme – it is a separate toolchain.

## DevExtreme license key (`DEVEXTREME_LICENSE`)

The LCP key is a **runtime** value. It is never in the repo, the JS bundle, the jar or the image:

- `vite.config.ts` declares `environmentVariables: [{ name: "DEVEXTREME_LICENSE", default: "" }]`,
  which Keycloakify renders into `theme.properties` as `DEVEXTREME_LICENSE=${env.DEVEXTREME_LICENSE:}`
  and exposes as `kcContext.properties.DEVEXTREME_LICENSE`.
- `src/login/dxLicense.ts` (imported first in `KcPage.tsx`) copies that value into
  `window.DevExpress.config.licenseKey` before any `devextreme*` module initialises.
- Set it on the Keycloak container, not as a build argument:
  `docker run -e DEVEXTREME_LICENSE=...`, compose `DEVEXTREME_LICENSE: ${DEVEXTREME_LICENSE}`
  (already present in `.devcontainer/docker-compose.yml`; put the value in your shell or a
  gitignored `.devcontainer/.env`), Helm `extraEnvVars` / secret. Changing the key requires a
  Keycloak restart, not a theme rebuild.

Expected console output per state:

| State | Behaviour |
|---|---|
| valid LCP key | no warnings, no trial panel |
| no key (`W0019` + `W0021` install line) | theme fully usable, DevExtreme trial panel/banner is shown – this is the documented degraded mode for OPS |
| `LCX…` / `ewog…` key (`W0021`) | wrong key format, convert with `devextreme-license` |
| `W0020` | `maxVersionAllowed` of the key is below the package version – pin `devextreme`/`devextreme-react` to the highest covered version (both always identical) |

### LCX → LCP (existing DevExpress keys)

DevExtreme 26 only accepts **LCP** keys; a classic `LCX…` product key is rejected with `W0021` and the
trial panel stays visible. The converter ships inside the `devextreme` package (`node_modules/.bin/devextreme-license`)
and works offline – it reads the LCX key from the `DevExpress_License` environment variable (or
`DevExpress_License.txt` / `DevExpress_LicensePath`):

```bash
DevExpress_License='<LCX…key…>' npm run license:lcp
# -> license-key.local.txt (gitignored): export const licenseKey = 'LCPv…';
```

Put that `LCPv…` value into the Keycloak environment (`DEVEXTREME_LICENSE=…`) and restart Keycloak.
Verified with this theme: `kcContext.properties.DEVEXTREME_LICENSE` → `window.DevExpress.config.licenseKey`,
`dx-license` / `dx-license-trigger` elements absent, zero `W00xx` console warnings, login page renders
without the orange trial banner. With the unconverted `LCX…` key the same run shows
`trialPanelPresent: true` plus `W0019`/`W0021` – i.e. the wiring is correct, only the key format was wrong.
Regenerate the LCP key after every `devextreme`/`devextreme-react` version bump (`W0020` when the key's
`maxVersionAllowed` is lower than the package version).

Checks: `grep -r "DEVEXTREME_LICENSE" dist_keycloak/` shows only the variable name; no
`LCP…` value is present in the jar. `devextreme` and `devextreme-react` are pinned to the same
version (exact peer dependency).

## Deployment

`Dockerfile` stage `keycloakifybuilder` builds the theme jar into `/opt/keycloak/providers` (theme name
`ballware-keycloakify`); the removed `themebuilder` stage is gone, the mappers (`token-mapper`,
`user-role-api`) are unchanged. The same jar now carries both theme types (`login/` and `account/`),
so the account console ships with it. `import/ballware-realm.json` is imported by the image and
points at `loginTheme: "ballware-keycloakify"` / `accountTheme: "ballware-keycloakify"`.

Jar size grows with the account chunk (PatternFly + oidc-spa, ~1 MB CSS + ~1.4 MB JS are written
identically under `login/resources/dist` and `account/resources/dist` by Keycloakify). The account
CSS is a lazy chunk – no `.pf-v5-c-masthead` rule is present in any login entry CSS.

The `keycloakifybuilder` stage installs dependencies with `npm ci --ignore-scripts` and runs
`npx keycloakify sync-extensions` **after** `COPY ballware-keycloakify/ ./`: the `postinstall` hook
crawls `src/` for the theme context and would abort with `ENOENT: scandir '/home/app/src'` when it runs
during the `package*.json`-only layer. The same applies to the account theme – without the vendored
`src/account/**` and `src/shared/**` (gitignored, recreated by `sync-extensions`) there is nothing to
build.

Devcontainer smoke test: `docker compose build && docker compose up`, then open the login page of
`ballwareweb` – the raw HTML must contain `kcContext.themeName = "ballware-keycloakify"` – and
`/realms/ballware/account/` for the branded account console (`accountTheme` must import cleanly,
masthead `rgb(63, 81, 181)`, favicon `…/account/dist/favicon.ico`).

## E2E (Playwright)

```bash
npx keycloakify start-keycloak --keycloak-version 26 --port=4000   # keeps running in a second shell
npm run e2e
```

`playwright.config.ts` uses the installed desktop Chrome (`channel: "chrome"`), so no browser
download is needed (`npx playwright install` is not required). Setup expectations of
`e2e/login.spec.ts` / `e2e/account.spec.ts`:

- Keycloak 26 reachable at `http://localhost:4000` with realm `myrealm`, client `myclient` and user
  `testuser` / `password123` (that is exactly what `start-keycloak` imports; it also flips
  `loginTheme`/`accountTheme` to `ballware-keycloakify` and ships `supportedLocales: ["de","en"]`).
- `start-keycloak` serves the SPA through the Keycloakify dev server (hot reload); to test the
  production path serve the built jar alone, e.g.
  `docker run -p 4100:8080 -v "$PWD/dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar:/opt/keycloak/providers/keycloak-theme.jar:ro" -v "$PWD/.keycloakify/realm-kc-26.json:/opt/keycloak/data/import/myrealm-realm.json:ro" quay.io/keycloak/keycloak:26.8.2 start-dev --import-realm`.

Coverage: theme identity (`kcContext.themeName = "ballware-keycloakify"`, React root only, **no**
server-rendered `#kc-form-login`, no jQuery/Bootstrap assets – i.e. provably not the FTL theme),
DevExtreme shell (`body.dx-viewport`, `#kc-form-login`, toolbar, 2 `dx-texteditor`, `#kc-login` in
the FTL success green `rgb(139,195,74)`), successful login through `useSubmitBehavior` (redirect with
`code=`), server errors as DevExtreme validation bubbles (`.dx-invalid-message-content`), language
switch through the toolbar `DxDropDownButton` (Keycloak 26 navigates with `kc_locale=de`) and the
German page via `ui_locales`.

`e2e/account.spec.ts` logs in through the login theme first, then checks the account SPA:
`kcContext.themeType = "account"`, `account/ballware-keycloakify/dist/assets/index-*.js`, the favicon
served from `…/account/dist/favicon.ico` (5694 B), masthead `rgb(63, 81, 181)` with white text and
`--pf-v5-c-masthead--m-display-inline__main--MinHeight: 56px`, the 192 px ballware brand at 36 px,
`rgb(63, 81, 181)` on the toolbar and on the current sidebar item, `#3f51b5` accent tokens, and the
tab title `Ballware Account Management` / `Ballware Benutzerkontoverwaltung` after the SPA's
`languageChanged` event. Screenshots: `e2e/screenshots/06-account-en.png`, `07-account-de.png`.

Findings that came out of the e2e run and are now implemented:

- DevExtreme 26 toolbar items no longer support `widget: 'dxDropDownButton'`; `component` + `options`
  yields an empty list ("No data to display") – the item needs `render={() => <DxDropDownButton … />}`.
- `stylingMode` values are `text | outlined | contained` – primary buttons use `contained`
  (`type="success"` is not a DevExtreme style).
- Keycloakify's account SPA renders the masthead directly inside `.pf-v5-c-page` (no
  `.pf-v5-c-page__header` wrapper), so the branding selector covers both shapes.

## Parity notes (old `ballware` FreeMarker theme, removed)

Parity was verified while both themes were still in the image (`/opt/keycloak/providers` held
`keycloak-ballware-theme-1.0.jar` + `keycloak-theme-for-kc-all-other-versions.jar`): the same realm and
client were rendered with `loginTheme=ballware` and `loginTheme=ballware-keycloakify`. Discriminators,
even though the markup parity makes the pages look nearly identical: the FTL theme rendered the form
server-side (`<form id="kc-form-login">` plus jQuery `$('#username').dxTextBox({...})`) and loaded
`login/ballware/node_modules/jquery/...`; this theme serves
`login/ballware-keycloakify/dist/assets/index-*.js`, renders client-side from `<div id="root">` and
stamps `kcContext.themeName`. Both use the same `#0d6efd` toolbar and `dx-field`/`dx-fieldset` markup
by design.

Parity fix taken from that comparison: the FTL submit buttons used DevExtreme 22.2 `type: 'success'`
(green `#8bc34a`). DevExtreme 26 only has `text | outlined | contained`, so the primary buttons carry
`elementAttr.class = "kc-button-primary"` and `src/login/main.css` restores `#8bc34a`
(hover `#7cb342`); the e2e suite asserts `rgb(139,195,74)` on `#kc-login`.

Parity fix found during the comparison: the FTL submit buttons used DevExtreme 22.2 `type: 'success'`
(green `#8bc34a`). DevExtreme 26 only has `text | outlined | contained`, so the primary buttons carry
`elementAttr.class = "kc-button-primary"` and `src/login/main.css` restores `#8bc34a`
(hover `#7cb342`); the e2e suite asserts `rgb(139,195,74)` on `#kc-login`.

## Verified

- `npm run build`, `npm run build-keycloak-theme`, storybook build, `tsc`, eslint: clean (eslint
  reports only the 13 pre-existing `eslint-disable` warnings in the vendored `src/shared/**` files).
- Jar: single `keycloak-theme-for-kc-all-other-versions.jar` (~7.5 MB, was ~3.8 MB without the
  account theme), contains `dxiconsmaterial.woff2`, `Roboto-*.woff2` and the DevExtreme material CSS
  (~1 MB) with Bootstrap + branding rules last in the cascade; no PatternFly CSS is linked
  (`doUseDefaultCss={false}`, `classes = {}`). Account side: `account/index.ftl`,
  `account/theme.properties` (`parent=base`, `locales=…`), merged `account/messages/messages_de.properties`
  (`accountManagementTitle=Ballware Benutzerkontoverwaltung`), `account/resources/dist/**` incl.
  `dist/favicon.ico`. Login entry CSS chunks contain no `pf-v5-c-masthead` rule (the masthead CSS is
  the lazy account chunk only).
- Login POST round trip against KC 26 with exactly our fields (`username`, `password`,
  `credentialId`) → 302 with authorization code.
- Headless render checks (Chrome): login page renders `dx-viewport` + `kc-form-login`, toolbar with
  locale `DxDropDownButton`, German error text shown as DevExtreme `dx-invalid-message`;
  no uncaught JS errors.
- Playwright e2e (`npm run e2e`): 9/9 green against KC 26.8.2 – 6 login tests (shell render,
  successful login, DevExtreme error bubbles, toolbar language switch (`kc_locale=de`), German
  `ui_locales`) + 3 account tests (theme/favicon identity, masthead + sidebar branding, German title).
  Screenshots show the `#0d6efd` toolbar with `ENGLISH`/`DEUTSCH` drop-down, DevExtreme material
  editors and the DevExtreme trial banner while `DEVEXTREME_LICENSE` is empty, and the `#3f51b5`
  account masthead with the 192 px ballware brand.
- Account branding verified twice: against `start-keycloak` (dev server) and against a plain
  `quay.io/keycloak/keycloak:26.8.2` container that only has the built jar in `/opt/keycloak/providers`
  (masthead/toolbar/current nav item `rgb(63, 81, 181)`, masthead text white, 56 px masthead, brand
  192×192 at 36 px, `document.title` from `accountManagementTitle`). In dark mode the masthead/sidebar
  stay `#3f51b5` and links use `#7986cb`.

## Notes / deviations from the plan

- OTP credential field name is `selectedCredentialId` (Keycloak's actual field; the FTL file had a
  broken `name: 'selectedCredentialId,` literal).
- DevExtreme 26 removed the toolbar item `widget: 'dxDropDownButton'` option; the locale switcher is
  rendered through `DxItem render={() => <DxDropDownButton … />}` (see the e2e section).
- Password visibility uses DevExtreme's own eye (`mode="password"`); Keycloakify's reveal button is
  not used.
- `register.ftl` renders Keycloak 26 user-profile attributes through `useUserProfileForm`
  (not the fixed FTL field list). Multivalued attributes render one editor per value; select-type
  options are single-select only.
- Keycloak error HTML is converted to plain text (`lib/kcText.ts`) before being handed to
  DevExtreme editors/toasts.
- Realm/admin message overrides are ignored by Keycloakify; future text changes belong in
  `src/login/i18n` via `i18nBuilder` (not needed today – no overrides in `ballware-realm.json`).
- Account theme: the masthead has no `.pf-v5-c-page__header` wrapper in the Keycloakify SPA, so
  `ballware-account.css` matches `.pf-v5-c-page .pf-v5-c-masthead` (plus the `__header` shape) to get
  `(0,2,0)` specificity against `@patternfly/react-styles`, which is injected after our chunk.
- Account theme: the welcome message override is only written into the message bundle (Keycloakify's
  Single-Page `index.ftl` does not render it) – the observable parity is `document.title`, which is set
  from `accountManagementTitle` in `KcAccountUi.tsx` instead of the upstream literal
  `"Account Management"`.
- Account theme: `logo192.png` (2.7 kB) stays below Vite's `assetsInlineLimit`, so it ships as a data
  URI inside the account JS chunk (`?url` does not change that in Vite 5). A future SVG logo would
  both sharpen it and make it a separate asset.
- `src/login/dxLicense.ts` reads `window.kcContext` only when `themeType === "login"`: enabling the
  account theme widens the `kcContext` union in `src/kc.gen.tsx` and the account variant has no
  `properties` of the login `KcContext`.
