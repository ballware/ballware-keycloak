import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const REALM = "myrealm";
const CLIENT = "myclient";
const REDIRECT = "https://my-theme.keycloakify.dev/";
const AUTH_URL = `/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT}&response_type=code&scope=openid&redirect_uri=${REDIRECT}`;

const SHOTS_DIR = "e2e/screenshots";

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

async function openLoginPage(page: Page, capture: ConsoleCapture, query = "") {
    captureConsole(page, capture);

    await page.goto(`${AUTH_URL}${query}`, { waitUntil: "networkidle" });

    await expect(page.locator("body.dx-viewport")).toBeAttached();
    await expect(page.locator("form#kc-form-login")).toBeVisible();
    await expect(page.locator("div.dx-toolbar")).toBeVisible();

    const editors = page.locator("form#kc-form-login .dx-texteditor");
    expect(await editors.count()).toBe(2);

        await expect(page.locator("#kc-login")).toBeVisible();

        // Parity with the FTL theme: primary submit button in DevExtreme 22.2 success green
        const submitColor = await page.locator("#kc-login").evaluate(element => getComputedStyle(element).backgroundColor);

        expect(submitColor).toBe("rgb(139, 195, 74)");

        captureConsole(page, capture);
}

test.describe("ballware-keycloakify login theme", () => {
    test("proves the page is served by the keycloakify theme (not the FTL theme)", async ({ page }) => {
        const response = await page.context().request.get(
            `${AUTH_URL}`,
            { maxRedirects: 5 }
        );
        const html = await response.text();

        // Keycloak stamps the active theme into kcContext
        expect(html).toContain('kcContext.themeName = "ballware-keycloakify"');

        // The FTL theme renders the login form server side, this theme only ships the React root
        expect(html).toContain('id="root"');
        expect(html).not.toContain('name="password"');
        expect(html).not.toContain("kc-form-login");

        // Keycloakify bundle assets, no jQuery/Bootstrap assets from the FTL theme
        expect(html).toMatch(/login\/ballware-keycloakify\/dist\/assets\/index-[\w-]+\.js/);
        expect(html).not.toMatch(/jquery|dxbootstrap|bootstrap\.min/i);

        await page.goto(response.url(), { waitUntil: "networkidle" });

        const themeName = await page.evaluate(
            () => (window as Window & { kcContext?: { themeName?: string } }).kcContext?.themeName
        );

        expect(themeName).toBe("ballware-keycloakify");

        // DevExtreme 26.1 (the FTL theme ships 22.2)
        await expect(page.locator("body")).toContainText(/v26\.1\.6|DevExtreme/);
    });

    test("renders the DevExtreme shell and logs license state", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await openLoginPage(page, capture);

        await shot(page, "01-login-en");

        expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
        expect(capture.warnings.join("\n")).toContain("DevExtreme");

        return capture;
    });

    test("logs in successfully (DevExtreme widgets + useSubmitBehavior)", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await openLoginPage(page, capture);

        await page.locator('form#kc-form-login input[name="username"]').fill("testuser");
        await page.locator('form#kc-form-login input[name="password"]').fill("password123");

        await shot(page, "02-login-filled-en");

        await page.locator("#kc-login").click();

        await page.waitForURL(/code=/, { timeout: 30_000 });

        expect(page.url()).toContain(REDIRECT.replace("https://", ""));
        expect(page.url()).toContain("code=");

        expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
    });

    test("shows server errors as DevExtreme validation messages", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await openLoginPage(page, capture);

        await page.locator('form#kc-form-login input[name="username"]').fill("testuser");
        await page.locator('form#kc-form-login input[name="password"]').fill("wrong-password");
        await page.locator("#kc-login").click();

        const invalidMessage = page.locator(".dx-invalid-message-content");

        await expect(invalidMessage.first()).toBeVisible({ timeout: 30_000 });
        await expect(invalidMessage.first()).toContainText(/username|password|Kennwort|Benutzername/i);

        await shot(page, "03-login-error-en");

        expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
    });

    test("switches language through the toolbar drop-down button", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await openLoginPage(page, capture);

        const dropDown = page.locator(".dx-dropdownbutton");

        await expect(dropDown).toBeVisible();
        await dropDown.click();

        const germanItem = page.locator(".dx-dropdownbutton-overlay .dx-list-item, .dx-overlay-content .dx-list-item", { hasText: "Deutsch" });

        await expect(germanItem.first()).toBeVisible();
        await germanItem.first().click();

        await page.waitForURL(/kc_locale=de/, { timeout: 30_000 });

        await expect(page.locator(".dx-field-label").first()).toContainText(/Benutzername|E-Mail/);
        await expect(page.locator("#kc-login")).toContainText("Anmelden");

        await shot(page, "04-login-de");

        expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
    });

    test("renders German locale directly via ui_locales", async ({ page }) => {
        const capture: ConsoleCapture = { warnings: [], errors: [] };

        await openLoginPage(page, capture, "&ui_locales=de");

        await expect(page.locator("#kc-page-title")).toContainText(/anmelden/i);
        await expect(page.locator("#kc-forgot-pw-link")).toContainText(/Passwort vergessen|Forgot Password/);

        await shot(page, "05-login-de-direct");

        expect(capture.errors.filter(error => !/favicon|net::ERR/.test(error))).toEqual([]);
    });
});
