// Refreshes docs/data.js from tools-src.json: pulls each tool's stars, licence and
// description from GitHub and checks that its link still answers.
// Run:  node update-data.mjs
// (GitHub allows 60 requests an hour without a token; set GH_TOKEN for more.)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Each tool's icon is downloaded once into docs/icons/, so visitors' browsers load it
// from this site instead of asking an outside icon service for 98 images.
mkdirSync("docs/icons", { recursive: true });
const get = async (u) => {
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch { return null; }
};
// Google answers unknown sites with a generic globe; fetch it once to recognise it.
const GOOGLE = (host) => `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
const genericGlobe = await get(GOOGLE("no-such-site-for-icon-check.invalid"));
async function saveIcon(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const name = host.replace(/[^a-z0-9.-]/gi, "_");
  // 1st source: DuckDuckGo. 2nd source: Google. Otherwise the page shows the tool's first letter.
  let buf = await get(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  if (buf && buf.length >= 200) { writeFileSync(`docs/icons/${name}.ico`, buf); return `icons/${name}.ico`; }
  buf = await get(GOOGLE(host));
  if (buf && buf.length >= 200 && !(genericGlobe && buf.equals(genericGlobe))) { writeFileSync(`docs/icons/${name}.png`, buf); return `icons/${name}.png`; }
  return "";
}

const src = JSON.parse(readFileSync("tools-src.json", "utf8"));
const headers = { "User-Agent": "tool-directory-build", Accept: "application/vnd.github+json" };
if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;

// Checks the tool's link, and whether the tool's site lets other sites show it in a
// window (frame). Sites say "no" with X-Frame-Options or CSP frame-ancestors; sites
// that need cross-origin isolation (COEP require-corp) also break inside a frame.
async function linkStatus(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 (link check)" } });
    const xfo = (res.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();
    const fa = (csp.match(/frame-ancestors([^;]*)/) || [])[1];
    const coep = (res.headers.get("cross-origin-embedder-policy") || "").toLowerCase();
    const frame = res.ok && !/deny|sameorigin/.test(xfo) && (fa === undefined || /\*/.test(fa)) && !/require-corp|credentialless/.test(coep)
      && new URL(res.url).protocol === "https:";
    return { status: res.status, frame };
  } catch (err) {
    return { status: "no answer (" + (err.cause?.code || err.name) + ")", frame: false };
  }
}

const out = [];
const problems = [];
// GitHub rejects bursts of parallel requests, so ask for a few at a time and retry refusals.
async function getRepo(repo) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (res.status !== 403 && res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
  return fetch(`https://api.github.com/repos/${repo}`, { headers });
}

const BATCH = 5;
for (let i = 0; i < src.length; i += BATCH) await Promise.all(src.slice(i, i + BATCH).map(async (t) => {
  const [res, link, icon] = await Promise.all([getRepo(t.repo), linkStatus(t.url), saveIcon(t.url)]);
  const status = link.status;
  if (!res.ok) {
    problems.push(`SKIPPED ${t.repo}: GitHub answered ${res.status}`);
    return;
  }
  const r = await res.json();
  if (status !== 200) problems.push(`CHECK   ${t.repo}: ${t.url} answered ${status}`);
  if (r.archived) problems.push(`NOTE    ${t.repo}: repository is archived`);
  const license = r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : "";
  let desc = (t.desc || r.description || "").replace(/:[a-z0-9_+-]+:/g, "").replace(/\s+/g, " ").trim();
  if (desc.length > 150) desc = desc.slice(0, 147).replace(/\s+\S*$/, "") + "…";
  // id: short name used in links like open.html?t=excalidraw
  const id = r.full_name.split("/")[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // frame: the tool can open in a window inside this site (open.html). A tool can
  // opt out with "noframe": true in tools-src.json if it turns out to misbehave there.
  const frame = link.frame && !t.noframe && !t.play;
  out.push({ id, name: t.name || r.name, desc, url: t.url, repo: r.full_name, stars: r.stargazers_count, license, cat: t.cat, tags: t.tags, icon,
    ...(t.play && { play: t.play }), ...(frame && { frame: true }) });
}));

out.sort((a, b) => b.stars - a.stars);
const date = new Date().toISOString().slice(0, 10);
writeFileSync("docs/data.js", `// Generated by update-data.mjs on ${date}. Edit tools-src.json, not this file.\nwindow.TOOLS_UPDATED = "${date}";\nwindow.TOOLS = ${JSON.stringify(out, null, 1)};\n`);
console.log(`Wrote ${out.length} of ${src.length} tools to data.js`);
console.log(problems.sort().join("\n") || "No problems.");
