#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "docs", "best-practices");
const DATE_STAMP = new Date().toISOString().slice(0, 10);

const args = new Set(process.argv.slice(2));
const includeTransitive = args.has("--transitive");
const maxTransitive = Number.parseInt(
  [...args].find((arg) => arg.startsWith("--max-transitive="))?.split("=")[1] ??
    "0",
  10
);
const concurrency = Number.parseInt(
  [...args].find((arg) => arg.startsWith("--concurrency="))?.split("=")[1] ??
    "12",
  10
);

const OFFICIAL_DOC_OVERRIDES = {
  "@upstash/ratelimit":
    "https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted",
  "@upstash/redis": "https://upstash.com/docs/redis/sdks/ts/overview",
  "@supabase/supabase-js":
    "https://supabase.com/docs/reference/javascript/introduction",
  "@supabase/ssr": "https://supabase.com/docs/guides/auth/server-side",
  next: "https://nextjs.org/docs",
  react: "https://react.dev/reference/react",
  "react-dom": "https://react.dev/reference/react-dom",
  tailwindcss: "https://tailwindcss.com/docs",
  turbo: "https://turborepo.com/docs",
};

function resolveOfficialOverride(pkgName) {
  if (OFFICIAL_DOC_OVERRIDES[pkgName]) {
    return OFFICIAL_DOC_OVERRIDES[pkgName];
  }
  if (pkgName.startsWith("@supabase/")) return "https://supabase.com/docs";
  if (pkgName.startsWith("@upstash/")) return "https://upstash.com/docs";
  if (pkgName.startsWith("@vercel/")) return "https://vercel.com/docs";
  if (pkgName.startsWith("@tailwindcss/"))
    return "https://tailwindcss.com/docs";
  if (pkgName.startsWith("@tiptap/")) return "https://tiptap.dev/docs";
  return null;
}

function normalizeRepoUrl(repoUrl) {
  if (!repoUrl || typeof repoUrl !== "string") return null;
  let url = repoUrl.trim();
  if (url.startsWith("git+")) url = url.slice(4);
  if (url.startsWith("git://")) url = `https://${url.slice("git://".length)}`;
  if (url.startsWith("git@github.com:")) {
    url = `https://github.com/${url.slice("git@github.com:".length)}`;
  }
  if (url.endsWith(".git")) url = url.slice(0, -4);
  return url;
}

function isLikelyDocsUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("/docs") ||
    lower.includes("docs.") ||
    lower.includes("readme") ||
    lower.includes("guide")
  );
}

function npmPage(pkgName) {
  return `https://www.npmjs.com/package/${pkgName}`;
}

function decodeBunLockResolvedPackage(resolvedSpec) {
  if (!resolvedSpec || typeof resolvedSpec !== "string") return null;
  const withoutPeerSuffix = resolvedSpec.split("(")[0];
  const atIndex = withoutPeerSuffix.lastIndexOf("@");
  if (atIndex <= 0) return null;
  const name = withoutPeerSuffix.slice(0, atIndex);
  const version = withoutPeerSuffix.slice(atIndex + 1);
  if (!name || !version) return null;
  return { name, version };
}

function classifyFamily(name) {
  if (name.startsWith("@next/") || name === "next") return "nextjs";
  if (name.startsWith("react") || name.startsWith("@react/")) return "react";
  if (name.startsWith("@supabase/")) return "supabase";
  if (name.startsWith("@upstash/")) return "upstash";
  if (name.startsWith("@vercel/")) return "vercel";
  if (name.startsWith("@tailwindcss/") || name === "tailwindcss")
    return "tailwind";
  if (name.startsWith("@tiptap/")) return "tiptap";
  if (name.startsWith("@dnd-kit/")) return "dnd-kit";
  if (name.startsWith("@types/")) return "types";
  if (name.startsWith("@eslint/") || name.startsWith("eslint")) return "eslint";
  if (name.startsWith("@babel/") || name === "babel-plugin-react-compiler")
    return "babel";
  if (name.startsWith("@vitest/") || name === "vitest") return "vitest";
  if (name.startsWith("@esbuild/") || name === "esbuild") return "esbuild";
  if (name.startsWith("@napi-rs/")) return "napi-rs";
  if (name.startsWith("@radix-ui/") || name === "radix-ui") return "radix-ui";
  return "other";
}

async function readWorkspacePackageJsonFiles() {
  const rootPkgPath = path.join(ROOT, "package.json");
  const rootPkg = JSON.parse(await readFile(rootPkgPath, "utf8"));
  const workspaceDirs = [];
  for (const pattern of rootPkg.workspaces ?? []) {
    if (!pattern.endsWith("/*")) continue;
    const baseDir = pattern.slice(0, -2);
    const absoluteBaseDir = path.join(ROOT, baseDir);
    const entries = await readdir(absoluteBaseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        workspaceDirs.push(path.join(absoluteBaseDir, entry.name));
      }
    }
  }

  const files = [{ dir: ROOT, name: "root", packageJson: rootPkg }];
  for (const dir of workspaceDirs) {
    const pkgPath = path.join(dir, "package.json");
    try {
      const parsed = JSON.parse(await readFile(pkgPath, "utf8"));
      files.push({
        dir,
        name: parsed.name ?? path.basename(dir),
        packageJson: parsed,
      });
    } catch {
      // Ignore non-package dirs.
    }
  }
  return files;
}

async function collectDirectDependencies() {
  const files = await readWorkspacePackageJsonFiles();
  const map = new Map();

  for (const file of files) {
    const depSections = [
      ["dependencies", file.packageJson.dependencies ?? {}],
      ["devDependencies", file.packageJson.devDependencies ?? {}],
      ["peerDependencies", file.packageJson.peerDependencies ?? {}],
    ];

    for (const [section, deps] of depSections) {
      for (const [name, range] of Object.entries(deps)) {
        if (typeof range !== "string") continue;
        if (range.startsWith("workspace:")) continue;
        const existing = map.get(name) ?? {
          name,
          ranges: new Set(),
          sections: new Set(),
          usedBy: new Set(),
          family: classifyFamily(name),
        };
        existing.ranges.add(range);
        existing.sections.add(section);
        existing.usedBy.add(file.name);
        map.set(name, existing);
      }
    }
  }

  return map;
}

async function collectTransitiveDependencies() {
  const lockPath = path.join(ROOT, "bun.lock");
  const lockText = await readFile(lockPath, "utf8");
  const lines = lockText.split("\n");
  const map = new Map();
  let insidePackages = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!insidePackages) {
      if (line === '"packages": {') insidePackages = true;
      continue;
    }
    if (line === "}," || line === "}") {
      if (line === "}") break;
      continue;
    }
    const match = rawLine.match(/^\s+"[^"]+":\s+\["([^"]+)"/);
    if (!match) continue;
    const decoded = decodeBunLockResolvedPackage(match[1]);
    if (!decoded) continue;
    if (decoded.name.startsWith("@helvety/")) continue;
    const existing = map.get(decoded.name) ?? {
      name: decoded.name,
      versions: new Set(),
      family: classifyFamily(decoded.name),
    };
    existing.versions.add(decoded.version);
    map.set(decoded.name, existing);
  }

  return map;
}

async function fetchRegistryMeta(pkgName) {
  const officialOverride = resolveOfficialOverride(pkgName);
  if (officialOverride) {
    return {
      package: pkgName,
      docsUrl: officialOverride,
      docsSource: "official_override",
      confidence: "high",
      latestVersion: null,
      homepage: null,
      repositoryUrl: null,
      error: null,
    };
  }

  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
  const response = await fetch(registryUrl);
  if (!response.ok) {
    return {
      package: pkgName,
      docsUrl: npmPage(pkgName),
      docsSource: "npm_fallback",
      confidence: "low",
      latestVersion: null,
      homepage: null,
      repositoryUrl: null,
      error: `registry_${response.status}`,
    };
  }

  const payload = await response.json();
  const homepage =
    typeof payload.homepage === "string" ? payload.homepage : null;
  const repositoryRaw =
    typeof payload.repository === "string"
      ? payload.repository
      : typeof payload.repository?.url === "string"
        ? payload.repository.url
        : null;
  const repositoryUrl = normalizeRepoUrl(repositoryRaw);
  const latestVersion =
    typeof payload?.["dist-tags"]?.latest === "string"
      ? payload["dist-tags"].latest
      : null;

  let docsUrl = npmPage(pkgName);
  let docsSource = "npm_fallback";
  let confidence = "low";

  if (homepage && homepage.startsWith("http")) {
    docsUrl = homepage;
    docsSource = isLikelyDocsUrl(homepage)
      ? "official_docs"
      : "official_homepage";
    confidence = isLikelyDocsUrl(homepage) ? "high" : "medium";
  } else if (repositoryUrl && repositoryUrl.startsWith("http")) {
    docsUrl = `${repositoryUrl}#readme`;
    docsSource = "official_repo";
    confidence = "medium";
  }

  return {
    package: pkgName,
    docsUrl,
    docsSource,
    confidence,
    latestVersion,
    homepage,
    repositoryUrl,
    error: null,
  };
}

async function mapWithConcurrency(items, worker) {
  const queue = [...items];
  const out = [];

  async function runner() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      out.push(await worker(item));
    }
  }

  const slots = Array.from({ length: Math.max(1, concurrency) }, () =>
    runner()
  );
  await Promise.all(slots);
  return out;
}

function compareNames(a, b) {
  return a.localeCompare(b, "en");
}

function markdownTable(rows, headers) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  return [head, sep, ...rows.map((row) => `| ${row.join(" | ")} |`)].join("\n");
}

async function main() {
  const directMap = await collectDirectDependencies();
  const transitiveMap = includeTransitive
    ? await collectTransitiveDependencies()
    : new Map();

  let transitiveNames = [...transitiveMap.keys()].filter(
    (name) => !directMap.has(name)
  );
  transitiveNames.sort(compareNames);
  if (maxTransitive > 0) {
    transitiveNames = transitiveNames.slice(0, maxTransitive);
  }

  const packageNames = [...directMap.keys(), ...transitiveNames];
  const registryRecords = await mapWithConcurrency(
    packageNames,
    fetchRegistryMeta
  );
  const registryByName = new Map(
    registryRecords.map((record) => [record.package, record])
  );

  const rows = [];
  for (const name of packageNames.sort(compareNames)) {
    const direct = directMap.get(name);
    const transitive = transitiveMap.get(name);
    const registry = registryByName.get(name);

    rows.push({
      package: name,
      family: direct?.family ?? transitive?.family ?? "other",
      dependencyType: direct ? "direct" : "transitive",
      usedBy: direct ? [...direct.usedBy].sort(compareNames) : [],
      sections: direct ? [...direct.sections].sort(compareNames) : [],
      ranges: direct ? [...direct.ranges].sort(compareNames) : [],
      lockedVersions: transitive
        ? [...transitive.versions].sort(compareNames)
        : [],
      docsUrl: registry?.docsUrl ?? npmPage(name),
      docsSource: registry?.docsSource ?? "npm_fallback",
      confidence: registry?.confidence ?? "low",
      latestVersion: registry?.latestVersion ?? null,
      repositoryUrl: registry?.repositoryUrl ?? null,
      homepage: registry?.homepage ?? null,
      registryError: registry?.error ?? null,
    });
  }

  const familyCounts = rows.reduce((acc, row) => {
    acc[row.family] = (acc[row.family] ?? 0) + 1;
    return acc;
  }, {});

  const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    includeTransitive,
    maxTransitive,
    directCount: [...directMap.keys()].length,
    transitiveCount: transitiveNames.length,
    totalMapped: rows.length,
    familyCounts,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });

  const jsonPath = path.join(
    OUTPUT_DIR,
    `dependency-docs-matrix-${DATE_STAMP}.json`
  );
  await writeFile(
    jsonPath,
    JSON.stringify({ summary, packages: rows }, null, 2)
  );

  const directRows = rows
    .filter((row) => row.dependencyType === "direct")
    .slice(0, 200)
    .map((row) => [
      `\`${row.package}\``,
      row.family,
      row.sections.join(", "),
      row.usedBy.join(", "),
      `[link](${row.docsUrl})`,
      row.docsSource,
      row.confidence,
    ]);

  const md = [
    `# Dependency Docs Matrix (${DATE_STAMP})`,
    "",
    "## Scope",
    "",
    `- Direct dependencies: **${summary.directCount}**`,
    `- Transitive dependencies mapped: **${summary.transitiveCount}**`,
    `- Total packages mapped: **${summary.totalMapped}**`,
    `- Mode: ${includeTransitive ? "direct + transitive" : "direct only"}`,
    maxTransitive > 0
      ? `- Transitive cap: ${maxTransitive}`
      : "- Transitive cap: none",
    "",
    "## Family Counts",
    "",
    ...Object.entries(familyCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([family, count]) => `- ${family}: ${count}`),
    "",
    "## Direct Dependencies (first 200 rows)",
    "",
    markdownTable(directRows, [
      "Package",
      "Family",
      "Sections",
      "Used By",
      "Docs",
      "Source",
      "Confidence",
    ]),
    "",
    "## Notes",
    "",
    "- Full machine-readable matrix is in the JSON artifact next to this file.",
    "- Docs URL precedence: `homepage` > `repository#readme` > npm package page.",
    "- Platform binary packages (for example `@esbuild/*`) often inherit docs from parent ecosystem.",
  ].join("\n");

  const mdPath = path.join(
    OUTPUT_DIR,
    `dependency-docs-matrix-${DATE_STAMP}.md`
  );
  await writeFile(mdPath, md);

  process.stdout.write(
    [
      `Wrote: ${path.relative(ROOT, mdPath)}`,
      `Wrote: ${path.relative(ROOT, jsonPath)}`,
      `Mapped packages: ${rows.length}`,
    ].join("\n")
  );
}

await main();
