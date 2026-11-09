# ballware-keycloakify

Keycloakify v11 login theme (`ballware-keycloakify`) that ports the classic FreeMarker theme
`ballware-theme` (DevExtreme 22.2 + Bootstrap + jQuery) to React + `devextreme-react` 26.1.
Both themes coexist in the same Keycloak image; the realm keeps `loginTheme=ballware` until a
client is switched explicitly.

Scope: the 9 overridden login pages only (`login`, `register`, `error`, `info`, `login-otp`,
`login-config-totp`, `login-reset-password`, `login-update-password`, `login-verify-email`).
No account / email / admin theme. Other pages fall back to Keycloakify's `DefaultPage` with our
shell (unstyled widgets).

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
```

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

`Dockerfile` stage `keycloakifybuilder` builds the jar and copies it next to the FTL theme jar
into `/opt/keycloak/providers` (theme name `ballware-keycloakify`, no name collision).
`.github/workflows/docker-image.yml` and `import/ballware-realm.json` are unchanged.

Comparison test in the devcontainer: `docker compose build && docker compose up`, then
Admin Console → Clients → `ballwareweb` → *Login Theme* = `ballware-keycloakify`.

## E2E (Playwright)

```bash
npx keycloakify start-keycloak --keycloak-version 26 --port=4000   # keeps running in a second shell
npm run e2e
```

`playwright.config.ts` uses the installed desktop Chrome (`channel: "chrome"`), so no browser
download is needed (`npx playwright install` is not required). Setup expectations of `e2e/login.spec.ts`:

- Keycloak 26 reachable at `http://localhost:4000` with realm `myrealm`, client `myclient` and user
  `testuser` / `password123` (that is exactly what `start-keycloak` imports).
- `myrealm` must offer `de` and `en` (the imported realm ships en/fr/es; enable it via Admin Console
  or the REST API `PUT /admin/realms/myrealm` with `internationalizationEnabled: true`,
  `supportedLocales: ["de","en"]`).

Coverage: theme identity (`kcContext.themeName = "ballware-keycloakify"`, React root only, **no**
server-rendered `#kc-form-login`, no jQuery/Bootstrap assets – i.e. provably not the FTL theme),
DevExtreme shell (`body.dx-viewport`, `#kc-form-login`, toolbar, 2 `dx-texteditor`, `#kc-login` in
the FTL success green `rgb(139,195,74)`), successful login through `useSubmitBehavior` (redirect with
`code=`), server errors as DevExtreme validation bubbles (`.dx-invalid-message-content`), language
switch through the toolbar `DxDropDownButton` (Keycloak 26 navigates with `kc_locale=de`) and the
German page via `ui_locales`.
Screenshots land in `e2e/screenshots/` (gitignored); console output is asserted to contain only the
DevExtreme license warnings (`W0019`/`W0021` without a key) and no page errors.

Findings that came out of the e2e run and are now implemented:

- DevExtreme 26 toolbar items no longer support `widget: 'dxDropDownButton'`; `component` + `options`
  yields an empty list ("No data to display") – the item needs `render={() => <DxDropDownButton … />}`.
- `stylingMode` values are `text | outlined | contained` – primary buttons use `contained`
  (`type="success"` is not a DevExtreme style).

## Side-by-side against the FTL theme

Both themes ship in one image (`/opt/keycloak/providers`: `keycloak-ballware-theme-1.0.jar` +
`keycloak-theme-for-kc-all-other-versions.jar`), so the same realm/client can be rendered with both:

```bash
docker build -t ballware-keycloak:cmp .
docker run -d --name bw-cmp -p 4001:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v /path/to/import-dir:/opt/keycloak/data/import ballware-keycloak:cmp start-dev --import-realm
# loginTheme=ballware  -> raw HTML has a server-rendered <form id="kc-form-login"> + jQuery assets
# loginTheme=ballware-keycloakify -> raw HTML has only <div id="root"> + the kcContext.themeName stamp
```

Discriminators that are visible even though the markup parity makes the pages look almost identical:
the FTL theme loads `login/ballware/node_modules/jquery/...` and `bootstrap.css` and renders the form
server-side (jQuery `$('#username').dxTextBox({...})`); the Keycloakify theme serves
`login/ballware-keycloakify/dist/assets/index-*.js`, renders client-side and shows the DevExtreme
26.1 trial banner (`v26.1.6`) while no license key is set – DevExtreme 22.2 in the FTL theme has no
license check. Both use the same `#0d6efd` toolbar and `dx-field`/`dx-fieldset` markup by design.

Parity fix found during the comparison: the FTL submit buttons used DevExtreme 22.2 `type: 'success'`
(green `#8bc34a`). DevExtreme 26 only has `text | outlined | contained`, so the primary buttons carry
`elementAttr.class = "kc-button-primary"` and `src/login/main.css` restores `#8bc34a`
(hover `#7cb342`); the e2e suite asserts `rgb(139,195,74)` on `#kc-login`.

## Verified

- `npm run build`, `npm run build-keycloak-theme`, storybook build, `tsc`, eslint: clean.
- Jar: single `keycloak-theme-for-kc-all-other-versions.jar` (~3.8 MB), contains
  `dxiconsmaterial.woff2`, `Roboto-*.woff2` and the DevExtreme material CSS (~1 MB) with
  Bootstrap + branding rules last in the cascade; no PatternFly CSS is linked
  (`doUseDefaultCss={false}`, `classes = {}`).
- Login POST round trip against KC 26 with exactly our fields (`username`, `password`,
  `credentialId`) → 302 with authorization code.
- Headless render checks (Chrome): login page renders `dx-viewport` + `kc-form-login`, toolbar with
  locale `DxDropDownButton`, German error text shown as DevExtreme `dx-invalid-message`;
  no uncaught JS errors.
- Playwright e2e (`npm run e2e`): 5/5 green against KC 26.8.2 – shell render, successful login,
  DevExtreme error bubbles, toolbar language switch (`kc_locale=de`), German `ui_locales`.
  Screenshots show the `#0d6efd` toolbar with `ENGLISH`/`DEUTSCH` drop-down, DevExtreme material
  editors and the DevExtreme trial banner while `DEVEXTREME_LICENSE` is empty.

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
