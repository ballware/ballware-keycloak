import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const REALM = "myrealm";
const CLIENT = "myclient";
const REDIRECT = "https://my-theme.keycloakify.dev/";
const AUTH_URL = `/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT}&response_type=code&scope=openid&redirect_uri=${REDIRECT}`;
const ACCOUNT_URL = `/realms/${REALM}/account/`;

const SHOTS_DIR = "e2e/screenshots";

const BALLWARE_INDIGO = "rgb(63, 81, 181)";
const WHITE = "rgb(255, 255, 255)";

type ConsoleCapture = { warnings: string[]; errors: string[] };

function captureConsole(page: Page, capture: ConsoleCapture) {
    page.on("console", message => {
        const text = message.text();

        if (message.type() === "error") {
            capture.errors.push(text);
        }

        if (/(W00\d\d|DevExtreme)/.test(text)) {
            capture.warnings.push(text.split("\n")[0]);
        }
    });

    page.on("pageerror", error => capture.errors.push(String(error)));
}

async function shot(page: Page, name: string) {
    mkdirSync(SHOTS_DIR, { recursive: true });
    await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
}

function assertNoPageErrors(capture: ConsoleCapture) {
    expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
}

async function loginThroughLoginTheme(page: Page, capture: ConsoleCapture) {
    captureConsole(page, capture);

    await page.goto(AUTH_URL, { waitUntil: "networkidle" });

    await expect(page.locator("form#kc-form-login")).toBeVisible();

    await page.locator('form#kc-form-login input[name="username"]').fill("testuser");
    await page.locator('form#kc-form-login input[name="password"]').fill("password123");
    await page.locator("#kc-login").click();

    await page.waitForURL(/code=/, { timeout: 30_000 });
}

async function openAccountPage(page: Page) {
    await page.goto(ACCOUNT_URL, { waitUntil: "networkidle" });

    // The account console is a SPA: oidc-spa reuses the Keycloak session, so we land directly on the masthead
    await expect(page.locator(".pf-v5-c-masthead")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".pf-v5-c-page__sidebar .pf-v5-c-nav__link").first()).toBeVisible();
}

test.describe("ballware-keycloakify account theme (Single-Page SPA)", () => {
    test("serves the account console from our theme with ballware favicon", async ({ page, request }) => {
        const response = await request.get(ACCOUNT_URL, { maxRedirects: 5 });
        const html = await response.text();

        expect(html).toContain('kcContext.themeType = "account"');
        expect(html).toContain('kcContext.themeName = "ballware-keycloakify"');
        expect(html).toMatch(/account\/ballware-keycloakify\/dist\/assets\/index-[\w-]+\.js/);

        const faviconHref = /<link rel="icon"[^>]*href="([^"]*favicon\.ico)"/.exec(html)?.[1];

        expect(faviconHref).toContain("account/ballware-keycloakify/dist/favicon.ico");

        const favicon = await request.get(faviconHref as string);

        expect(favicon.ok()).toBeTruthy();
        expect((await favicon.body()).length).toBe(5694);

        await page.goto(ACCOUNT_URL, { waitUntil: "networkidle" });

        await expect(page.locator("link[rel=icon]")).toHaveAttribute(
            "href",
            expect.stringContaining("account/ballware-keycloakify/dist/favicon.ico")
        );
    });

    test("renders the ballware branded account console", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await loginThroughLoginTheme(page, capture);
        await openAccountPage(page);

        const masthead = page.locator(".pf-v5-c-masthead");

        const mastheadStyles = await masthead.evaluate(element => {
            const style = getComputedStyle(element);

            return {
                backgroundColor: style.backgroundColor,
                color: style.color,
                boxShadow: style.boxShadow,
                minHeight: style.getPropertyValue("--pf-v5-c-masthead--m-display-inline__main--MinHeight").trim()
            };
        });

        expect(mastheadStyles.backgroundColor).toBe(BALLWARE_INDIGO);
        expect(mastheadStyles.color).toBe(WHITE);
        expect(mastheadStyles.boxShadow).toContain("rgba(0, 0, 0");
        expect(mastheadStyles.minHeight).toBe("56px");

        const toolbarBackgroundColor = await page
            .locator(".pf-v5-c-masthead .pf-v5-c-toolbar")
            .evaluate(element => getComputedStyle(element).backgroundColor);

        expect(toolbarBackgroundColor).toBe(BALLWARE_INDIGO);

        const brand = await page.locator(".pf-v5-c-masthead__brand img").evaluate(element => ({
            src: element.getAttribute("src") ?? "",
            naturalWidth: element.naturalWidth,
            naturalHeight: element.naturalHeight,
            height: getComputedStyle(element).height
        }));

        // logo192.png: either a ballware-logo-* asset or inlined as a data URI by vite
        expect(brand.src).toMatch(/ballware-logo|data:image\/png;base64,/);
        expect(brand.naturalWidth).toBe(192);
        expect(brand.naturalHeight).toBe(192);
        expect(brand.height).toBe("36px");

        const currentItem = page.locator(".pf-v5-c-page__sidebar .pf-v5-c-nav__link.pf-m-current").first();

        await expect(currentItem).toBeVisible();

        const currentItemStyles = await currentItem.evaluate(element => {
            const style = getComputedStyle(element);

            return { backgroundColor: style.backgroundColor, color: style.color };
        });

        expect(currentItemStyles.backgroundColor).toBe(BALLWARE_INDIGO);
        expect(currentItemStyles.color).toBe(WHITE);

        const accentTokens = await page.evaluate(() => {
            const style = getComputedStyle(document.documentElement);

            return {
                primaryColor100: style.getPropertyValue("--pf-v5-global--primary-color--100").trim(),
                linkColor: style.getPropertyValue("--pf-v5-global--link--Color").trim()
            };
        });

        expect(accentTokens.primaryColor100.toLowerCase()).toBe("#3f51b5");
        expect(accentTokens.linkColor.toLowerCase()).toBe("#3f51b5");

        expect(await page.title()).toBe("Ballware Account Management");

        await shot(page, "06-account-en");

        assertNoPageErrors(capture);
    });

    test("keeps the tab title in sync with the account messages (de)", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await loginThroughLoginTheme(page, capture);
        await openAccountPage(page);

        expect(await page.title()).toBe("Ballware Account Management");

        // The account SPA switches language through this window event (see src/account/i18n/i18n.ts)
        await page.evaluate(() =>
            window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: "de" } }))
        );

        await expect
            .poll(async () => await page.title(), { timeout: 30_000 })
            .toBe("Ballware Benutzerkontoverwaltung");

        await expect(page.locator(".pf-v5-c-page__sidebar .pf-v5-c-nav__link").first()).toContainText(
            /Persönliche Angaben/
        );

        await shot(page, "07-account-de");

        assertNoPageErrors(capture);
    });
});
