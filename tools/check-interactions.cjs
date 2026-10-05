const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.argv[2] || "playwright");
const root = path.resolve(__dirname, "..");

(async () => {
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.route(/^https?:/, (route) => route.abort());
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let checks = 0;
    const visit = async (route) => {
        await page.goto(pathToFileURL(path.join(root, route)).href);
        await page.addStyleTag({
            content:
                "*,*::before,*::after { transition:none !important; animation:none !important; }",
        });
    };
    const check = (condition, label) => {
        assert.ok(condition, label);
        checks++;
    };

    for (const file of fs
        .readdirSync(path.join(root, "pages"))
        .filter((f) => f.endsWith(".html"))) {
        await page.setViewportSize({ width: 375, height: 900 });
        await visit(`pages/${file}`);
        const menu = page.locator(".menu-toggle");
        if (await menu.isVisible()) {
            await menu.click();
            check(
                (await menu.getAttribute("aria-expanded")) === "true",
                `${file}: mobile menu opens`,
            );
            await page.keyboard.press("Escape");
            check(
                (await menu.getAttribute("aria-expanded")) === "false",
                `${file}: Escape closes mobile menu`,
            );
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        const theme = page.locator(".theme-toggle:visible").first();
        if (await theme.count()) {
            const before = await page.locator("html").getAttribute("data-theme");
            await theme.click();
            check(
                (await page.locator("html").getAttribute("data-theme")) !== before,
                `${file}: theme switches`,
            );
            await theme.click();
        }
        const dropdown = page.locator(".nav-dropdown-toggle:visible");
        if (await dropdown.count()) {
            await dropdown.click();
            check(
                (await dropdown.getAttribute("aria-expanded")) === "true",
                `${file}: home dropdown opens`,
            );
            await page.keyboard.press("Escape");
            check(
                (await dropdown.getAttribute("aria-expanded")) === "false",
                `${file}: dropdown closes`,
            );
        }
        for (const width of [1024, 1101, 1200, 1280, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            if (await menu.isVisible()) {
                await menu.click();
                check(
                    await page.locator(".mobile-menu").isVisible(),
                    `${file}: navigation drawer opens at ${width}px`,
                );
                await page.keyboard.press("Escape");
                check(
                    (await menu.getAttribute("aria-expanded")) === "false",
                    `${file}: drawer closes at ${width}px`,
                );
                check(
                    await page.locator(".header-actions > .theme-toggle").isVisible(),
                    `${file}: header theme toggle remains visible at ${width}px`,
                );
                check(
                    await page.evaluate(() => {
                        const header = document.querySelector(".header-shell");
                        return (
                            !header ||
                            [...header.children].every(
                                (el) => el.getBoundingClientRect().right <= window.innerWidth,
                            )
                        );
                    }),
                    `${file}: header fits at ${width}px`,
                );
            } else if (await page.locator(".desktop-nav").isVisible()) {
                check(
                    !(await menu.isVisible()),
                    `${file}: desktop hamburger is hidden at ${width}px`,
                );
                check(
                    await page.evaluate(() => {
                        const brand = document
                            .querySelector(".header-shell > .brand")
                            .getBoundingClientRect();
                        const nav = document.querySelector(".desktop-nav").getBoundingClientRect();
                        const actions = document
                            .querySelector(".header-actions")
                            .getBoundingClientRect();
                        return (
                            brand.right <= nav.left &&
                            nav.right <= actions.left &&
                            actions.right <= innerWidth
                        );
                    }),
                    `${file}: desktop navigation and controls do not overlap at ${width}px`,
                );
            }
        }
    }

    await visit("pages/Homepage2.html");
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const tab of await page.locator('[data-discipline-selector] [role="tab"]').all()) {
        await tab.click();
        const panel = page.locator(`#${await tab.getAttribute("aria-controls")}`);
        const photo = panel.locator("img");
        await photo.evaluate((image) => {
            image.loading = "eager";
            return image.decode();
        });
        check(await photo.isVisible(), "Every specialist coaching tab displays its photo");
    }
    await page.locator("#discipline-tab-spin").click();
    fs.mkdirSync(path.join(root, "qa"), { recursive: true });
    await page
        .locator("#discipline-spin")
        .screenshot({ path: path.join(root, "qa", "restored-spin-bowling.png") });

    await visit("pages/programs.html");
    for (const tab of await page.locator('.prg-specialist-nav [role="tab"]').all()) {
        await tab.click();
        check((await tab.getAttribute("aria-selected")) === "true", "Specialist selection updates");
        const id = await tab.getAttribute("aria-controls");
        check(await page.locator(`#${id}`).isVisible(), "Selected specialist panel is visible");
    }
    await page.setViewportSize({ width: 375, height: 900 });
    check(
        await page.locator(".prg-specialist-console").isVisible(),
        "Specialist tabs remain available on mobile",
    );
    await page.locator(".prg-program summary").first().click();
    check(
        (await page.locator(".prg-program").first().getAttribute("open")) !== null,
        "Program details expand",
    );
    await page.locator('[data-program-finder] button[type="submit"]').click();
    check(
        (await page.locator("[data-finder-message]").textContent()).trim().length > 0,
        "Program finder validates missing choices",
    );
    for (const name of ["age", "experience", "goal"]) {
        await page
            .locator(`[data-program-finder] label:has(input[name="${name}"])`)
            .first()
            .click();
        check(
            await page.locator(`[data-program-finder] input[name="${name}"]`).first().isChecked(),
            "Program choice updates",
        );
    }
    await page.locator('[data-program-finder] button[type="submit"]').click();
    check(
        await page.locator("[data-program-result]").isVisible(),
        "Program finder returns a pathway",
    );

    await visit("pages/facilities.html");
    for (const tab of await page.locator('.academy-map-tabs [role="tab"]').all()) {
        await tab.click();
        check(
            (await tab.getAttribute("aria-selected")) === "true",
            "Facility zone selection updates",
        );
    }

    await visit("pages/login.html");
    await page.locator(".auth-submit").click();
    check(await page.locator(".auth-form-alert").isVisible(), "Login validates empty fields");
    await page.locator("#auth-email").fill("player@example.com");
    await page.locator("#auth-password").fill("Practice123");
    await page.locator(".auth-password-toggle").click();
    check(
        (await page.locator("#auth-password").getAttribute("type")) === "text",
        "Password visibility toggles",
    );
    await page.locator(".auth-submit").click();
    check(
        await page.locator(".auth-demo-message").isVisible(),
        "Existing demo login response remains intact",
    );

    await visit("pages/register.html");
    await page.locator(".register-submit").click();
    check(await page.locator(".register-alert").isVisible(), "Registration validates empty fields");
    await page.locator('[name="accountType"][value="parent"]').check();
    check(
        await page.locator(".parent-player-field").isVisible(),
        "Parent registration reveals player name",
    );

    await visit("pages/contact.html");
    await page.locator(".contact-form-submit").click();
    check(
        await page.locator(".contact-form-error-summary").isVisible(),
        "Enquiry validates required fields",
    );
    await page.locator("#contact-full-name").fill("Test Player");
    await page.locator("#contact-email").fill("player@example.com");
    await page.locator("#contact-enquiry-type").selectOption({ index: 1 });
    await page
        .locator("#contact-message")
        .fill("I would like to discuss a suitable cricket training program and trial session.");
    await page.locator(".contact-form-submit").click();
    check(
        await page.locator(".contact-form-success").isVisible(),
        "Existing enquiry demo response remains intact",
    );

    for (const file of fs
        .readdirSync(path.join(root, "student-dashboard"))
        .filter((f) => f.endsWith(".html"))) {
        await visit(`student-dashboard/${file}`);
        const menu = page.locator(".dashboard-menu-toggle");
        if (await menu.isVisible()) {
            await menu.click();
            check(
                (await menu.getAttribute("aria-expanded")) === "true",
                `${file}: dashboard drawer opens`,
            );
            await page.keyboard.press("Escape");
            check(
                (await menu.getAttribute("aria-expanded")) === "false",
                `${file}: dashboard drawer closes`,
            );
        }
        if (file === "schedule.html") {
            await page.locator(".portal-session").first().click();
            check(await page.locator(".portal-session-dialog").isVisible(), "Session dialog opens");
            await page.keyboard.press("Escape");
            check(
                !(await page.locator(".portal-session-dialog").isVisible()),
                "Session dialog closes",
            );
        }
        if (file === "profile.html") {
            await page.locator("[data-profile-edit]").click();
            check(
                await page.locator(".profile-edit-form input").first().isEnabled(),
                "Profile editing remains available",
            );
            await page.locator("[data-profile-cancel]").click();
            check(
                await page.locator(".profile-edit-form input").first().isDisabled(),
                "Profile editing cancels",
            );
        }
    }
    check(errors.length === 0, "No browser runtime errors");
    fs.mkdirSync(path.join(root, "qa"), { recursive: true });
    for (const folder of ["pages", "student-dashboard"]) {
        for (const file of fs
            .readdirSync(path.join(root, folder))
            .filter((f) => f.endsWith(".html"))) {
            for (const [width, theme] of [
                [375, "light"],
                [1440, "dark"],
            ]) {
                await page.setViewportSize({ width, height: 900 });
                await visit(`${folder}/${file}`);
                await page.evaluate(async (theme) => {
                    document.documentElement.dataset.theme = theme;
                    await Promise.all(
                        [...document.images].map(async (image) => {
                            image.loading = "eager";
                            try {
                                await image.decode();
                            } catch (_) {}
                        }),
                    );
                }, theme);
                await page.screenshot({
                    path: path.join(root, "qa", `${folder}-${file}-${width}-${theme}-viewport.png`),
                });
            }
        }
    }
    console.log(`PASS: ${checks} navigation, theme, form, tab and dashboard interaction checks.`);
    await browser.close();
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
