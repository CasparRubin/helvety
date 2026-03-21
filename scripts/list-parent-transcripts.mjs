import fs from "node:fs";
import path from "node:path";

const root =
  process.env.TRANSCRIPTS_ROOT ??
  "C:/Users/ETH/.cursor/projects/e-Development-Helvety-Github-helvety/agent-transcripts";

const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory());
const rows = [];
for (const d of dirs) {
  const id = d.name;
  const f = path.join(root, id, `${id}.jsonl`);
  if (!fs.existsSync(f)) continue;
  const st = fs.statSync(f);
  rows.push({
    path: f.replace(/\\/g, "/"),
    mtimeMs: Math.floor(st.mtimeMs),
  });
}
rows.sort((a, b) => b.mtimeMs - a.mtimeMs);
console.log(JSON.stringify(rows.slice(0, 40), null, 2));
