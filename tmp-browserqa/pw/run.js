const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = "http://localhost:3001";
const pages = ["/impressum", "/privacy", "/terms"];
const viewports = [
  { width: 280, height: 800 },
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
];

async function main() {
  const outDir = path.resolve(__dirname, "..");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  for (const route of pages) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      const overflow = await page.evaluate(() => {
        const vw = window.innerWidth;
        const root = document.documentElement;
        const body = document.body;
        let maxRight = Number.NEGATIVE_INFINITY;
        let minLeft = Number.POSITIVE_INFINITY;
        let offenders = 0;

        for (const el of document.querySelectorAll("*")) {
          const rect = el.getBoundingClientRect();
          if (!Number.isFinite(rect.right) || !Number.isFinite(rect.left))
            continue;
          if (rect.right > maxRight) maxRight = rect.right;
          if (rect.left < minLeft) minLeft = rect.left;
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
          const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
          const headingNodes = Array.from(
            document.querySelectorAll("h1,h2,h3,h4,h5,h6")
          );
          const findHeading = (prefix) =>
            headingNodes.find((n) =>
              normalize(n.textContent).startsWith(prefix)
            );

          const h76 = findHeading("7.6");
          const h77 = findHeading("7.7");
          const h78 = findHeading("7.8");

          if (!h77) return { found: false };

          h77.scrollIntoView({ block: "center" });
          await new Promise((resolve) => setTimeout(resolve, 150));

          const r76 = h76 ? h76.getBoundingClientRect() : null;
          const r77 = h77.getBoundingClientRect();
          const r78 = h78 ? h78.getBoundingClientRect() : null;
          const s77 = getComputedStyle(h77);

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

      results.push({ route, viewport, overflow, terms77 });
    }
  }

  await browser.close();
  fs.writeFileSync(
    path.join(outDir, "results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
