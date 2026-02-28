const { test } = require("playwright/test");
const fs = require("fs");
const path = require("path");

const baseUrl = "http://localhost:3001";
const pages = ["/impressum", "/privacy", "/terms"];
const viewports = [
  { width: 280, height: 800 },
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
];

test("legal pages visual QA audit", async ({ page }) => {
  const outDir = path.join(process.cwd(), "tmp-browserqa");
  const results = [];

  for (const route of pages) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      const overflow = await page.evaluate(() => {
        const vw = window.innerWidth;
        const root = document.documentElement;
        const body = document.body;
        let maxRight = 0;
        let minLeft = 0;
        let offenders = 0;

        for (const el of document.querySelectorAll("*")) {
          const rect = el.getBoundingClientRect();
          if (!Number.isFinite(rect.right) || !Number.isFinite(rect.left))
            continue;
          maxRight = Math.max(maxRight, rect.right);
          minLeft = Math.min(minLeft, rect.left);
          if (rect.right > vw + 1 || rect.left < -1) offenders += 1;
        }

        return {
          viewportWidth: vw,
          docScrollWidth: root.scrollWidth,
          bodyScrollWidth: body.scrollWidth,
          maxRight,
          minLeft,
          offenderCount: offenders,
        };
      });

      let terms77 = null;
      if (route === "/terms") {
        terms77 = await page.evaluate(async () => {
          const allNodes = Array.from(
            document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,div,span")
          );
          const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
          const findByPrefix = (prefix) =>
            allNodes.find((n) => normalize(n.textContent).startsWith(prefix));

          const h76 = findByPrefix("7.6");
          const h77 = findByPrefix("7.7");
          const h78 = findByPrefix("7.8");

          if (!h77) {
            return { found: false };
          }

          h77.scrollIntoView({ block: "center" });
          await new Promise((resolve) => setTimeout(resolve, 120));

          const r76 = h76 ? h76.getBoundingClientRect() : null;
          const r77 = h77.getBoundingClientRect();
          const r78 = h78 ? h78.getBoundingClientRect() : null;
          const s77 = window.getComputedStyle(h77);

          return {
            found: true,
            text: normalize(h77.textContent),
            gapFrom76: r76 ? r77.top - r76.bottom : null,
            gapTo78: r78 ? r78.top - r77.bottom : null,
            marginTop77: s77.marginTop,
            marginBottom77: s77.marginBottom,
          };
        });

        await page.screenshot({
          path: path.join(
            outDir,
            `terms-77-${viewport.width}x${viewport.height}.png`
          ),
          fullPage: false,
        });
      }

      results.push({
        route,
        viewport,
        overflow,
        terms77,
      });
    }
  }

  fs.writeFileSync(
    path.join(outDir, "results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );
});
