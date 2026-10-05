/* Run with: node tools/check-site.cjs <path-to-playwright-package> */
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require(process.argv[2] || "playwright");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "qa");
const focusedRoute = process.argv[3];
const widths = [375, 480, 768, 1024, 1280, 1440];
const routes = ["pages", "student-dashboard"].flatMap((dir) =>
    fs
        .readdirSync(path.join(root, dir))
        .filter((f) => f.endsWith(".html"))
        .map((f) => `${dir}/${f}`),
);

(async () => {
    fs.mkdirSync(output, { recursive: true });
    const browser = await chromium.launch({ channel: "msedge", headless: true });
    const failures = [];
    const results = [];
    let next = 0;
    const jobs = routes
        .filter((route) => !focusedRoute || route === focusedRoute)
        .flatMap((route) =>
            widths.flatMap((width) => ["light", "dark"].map((theme) => ({ route, width, theme }))),
        );
    await Promise.all(
        Array.from({ length: 3 }, async () => {
            const context = await browser.newContext({ reducedMotion: "reduce" });
            const page = await context.newPage();
            // External maps and web fonts are outside this local-code regression check.
            await page.route(/^https?:/, (route) => route.abort());
            let errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            while (next < jobs.length) {
                const job = jobs[next++];
                errors = [];
                await page.setViewportSize({ width: job.width, height: 900 });
                await page.goto(pathToFileURL(path.join(root, job.route)).href, {
                    waitUntil: "load",
                });
                await page.addStyleTag({
                    content:
                        "*,*::before,*::after { transition:none !important; animation:none !important; }",
                });
                await page.evaluate(async (theme) => {
                    document.documentElement.dataset.theme = theme;
                    document
                        .querySelectorAll("[data-reveal],.section-entrance")
                        .forEach((el) => el.classList.add("is-visible"));
                    await Promise.all(
                        [...document.images].map(async (image) => {
                            image.loading = "eager";
                            try {
                                await image.decode();
                            } catch (_) {
                                /* Report failed local images below. */
                            }
                        }),
                    );
                }, job.theme);
                const report = await page.evaluate(() => {
                    const visible = (el) =>
                        el.getBoundingClientRect().width > 0 &&
                        el.getBoundingClientRect().height > 0 &&
                        getComputedStyle(el).visibility !== "hidden";
                    const vw = document.documentElement.clientWidth;
                    const rgb = (value) => {
                        const parts = value.match(/[\d.]+/g)?.map(Number);
                        return parts?.length >= 3 ? [...parts.slice(0, 3), parts[3] ?? 1] : null;
                    };
                    const luminance = (color) =>
                        color
                            .slice(0, 3)
                            .map((v) => {
                                v /= 255;
                                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
                            })
                            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
                    const contrastWarnings = [];
                    for (const el of document.querySelectorAll(
                        "main p,main button,main a,main label",
                    )) {
                        if (!visible(el) || !el.textContent.trim()) continue;
                        const style = getComputedStyle(el);
                        const layers = [];
                        let complex = false;
                        for (let parent = el; parent; parent = parent.parentElement) {
                            const ps = getComputedStyle(parent);
                            if (ps.backgroundImage !== "none" || +ps.opacity < 1) {
                                complex = true;
                                break;
                            }
                            const color = rgb(ps.backgroundColor);
                            if (color) layers.push(color);
                            if (color?.[3] === 1) break;
                        }
                        if (complex) continue;
                        let background = [255, 255, 255];
                        for (const color of layers.reverse())
                            background = color
                                .slice(0, 3)
                                .map((v, i) => v * color[3] + background[i] * (1 - color[3]));
                        const text = rgb(style.color);
                        if (!text) continue;
                        const foreground = text
                            .slice(0, 3)
                            .map((v, i) => v * text[3] + background[i] * (1 - text[3]));
                        const a = luminance(foreground),
                            b = luminance(background);
                        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
                        const large =
                            parseFloat(style.fontSize) >= 24 ||
                            (parseFloat(style.fontSize) >= 18.66 &&
                                parseFloat(style.fontWeight) >= 700);
                        if (ratio < (large ? 3 : 4.5))
                            contrastWarnings.push({
                                class: el.className,
                                tag: el.tagName,
                                text: el.textContent.trim().slice(0, 60),
                                ratio: +ratio.toFixed(2),
                                color: style.color,
                            });
                    }
                    return {
                        contrastWarnings,
                        overflow: [
                            ...document.querySelectorAll(
                                "main *,.site-header *,.dashboard-header *",
                            ),
                        ]
                            .filter((el) => {
                                const r = el.getBoundingClientRect(),
                                    style = getComputedStyle(el);
                                if (
                                    !visible(el) ||
                                    ["absolute", "fixed"].includes(style.position) ||
                                    el.closest(
                                        "[hidden],.mobile-menu,.dashboard-sidebar,.nav-dropdown,.sr-only",
                                    )
                                )
                                    return false;
                                if (el instanceof SVGElement) return false;
                                for (
                                    let parent = el.parentElement;
                                    parent && parent.tagName !== "MAIN";
                                    parent = parent.parentElement
                                ) {
                                    const overflow = getComputedStyle(parent).overflowX;
                                    if (["auto", "scroll"].includes(overflow)) return false;
                                    if (
                                        el.tagName === "IMG" &&
                                        ["hidden", "clip"].includes(overflow)
                                    )
                                        return false;
                                }
                                return r.right > vw + 2 || r.left < -2;
                            })
                            .slice(0, 12)
                            .map((el) => ({
                                tag: el.tagName,
                                class: el.className,
                                width: Math.round(el.getBoundingClientRect().width),
                            })),
                        tinyParagraphs: [...document.querySelectorAll("p")]
                            .filter(
                                (el) =>
                                    visible(el) && parseFloat(getComputedStyle(el).fontSize) < 12,
                            )
                            .map((el) => el.className),
                        brokenImages: [...document.images]
                            .filter((el) => !el.complete || !el.naturalWidth)
                            .map((el) => el.getAttribute("src")),
                        dashboardIcons: document.querySelectorAll(
                            ".dashboard-nav-link svg,.mobile-dashboard-link svg",
                        ).length,
                        background: getComputedStyle(document.body).backgroundColor,
                        heading: document.querySelector("main h1")
                            ? getComputedStyle(document.querySelector("main h1")).fontSize
                            : null,
                    };
                });
                const entry = { ...job, ...report, errors: [...errors] };
                results.push(entry);
                if (
                    report.overflow.length ||
                    report.contrastWarnings.length ||
                    report.tinyParagraphs.length ||
                    report.brokenImages.length ||
                    report.dashboardIcons ||
                    errors.length
                )
                    failures.push(entry);
                if (
                    [
                        "pages/Homepage1.html",
                        "pages/Homepage2.html",
                        "pages/about.html",
                        "pages/programs.html",
                        "pages/coaches.html",
                        "pages/facilities.html",
                        "student-dashboard/dashboard.html",
                    ].includes(job.route) &&
                    [375, 1440].includes(job.width)
                ) {
                    await page.screenshot({
                        path: path.join(
                            output,
                            `${job.route.replace(/[/.]/g, "-")}-${job.width}-${job.theme}.png`,
                        ),
                        fullPage: true,
                    });
                }
                if (results.length % 30 === 0)
                    console.log(
                        `Checked ${results.length}/${jobs.length} page/theme/width combinations`,
                    );
            }
            await context.close();
        }),
    );
    fs.writeFileSync(
        path.join(output, focusedRoute ? "focused-layout-report.json" : "layout-report.json"),
        JSON.stringify({ checked: results.length, failures, results }, null, 2),
    );
    console.log(
        JSON.stringify(
            { checked: results.length, failures: failures.length, examples: failures.slice(0, 8) },
            null,
            2,
        ),
    );
    await browser.close();
    process.exitCode = failures.length ? 1 : 0;
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
