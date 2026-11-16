// Downloads the Google Fonts the site and games use and stores them in docs/fonts/,
// so pages no longer depend on fonts.googleapis.com / fonts.gstatic.com.
// Only the Latin and Latin-Extended subsets are kept (enough for English and French).
// Run once:  node self-host-fonts.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const SETS = {
  "site": "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=JetBrains+Mono:wght@400;600&display=swap",
  "css-diner": "https://fonts.googleapis.com/css?family=Exo+2:200,400,600,400italic,600italic|Satisfy&display=swap",
  "elevatorsaga": "https://fonts.googleapis.com/css?family=Oswald:400,700,300&display=swap",
  "flexboxfroggy": "https://fonts.googleapis.com/css?family=PT+Sans|Fredoka+One|Source+Code+Pro&display=swap",
  "gridgarden": "https://fonts.googleapis.com/css?family=PT+Sans|Autour+One|Source+Code+Pro&display=swap",
  "t-rex-runner": "https://fonts.googleapis.com/css?family=Open+Sans&display=swap",
};
// A modern browser user agent makes Google serve WOFF2 files.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

mkdirSync("docs/fonts/files", { recursive: true });
const downloaded = new Map();
for (const [name, url] of Object.entries(SETS)) {
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  // Google's CSS is a list of "/* subset */ @font-face {...}" blocks.
  const blocks = css.split(/(?=\/\* [a-z-]+ \*\/)/).filter((b) => /^\/\* (latin|latin-ext) \*\//.test(b));
  let out = `/* Self-hosted copy of ${url} (latin + latin-ext only). */\n`;
  for (let b of blocks) {
    for (const m of b.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
      const remote = m[1];
      if (!downloaded.has(remote)) {
        const file = remote.split("/").slice(-2).join("-").replace(/[^a-zA-Z0-9._-]/g, "");
        const buf = Buffer.from(await (await fetch(remote, { headers: { "User-Agent": UA } })).arrayBuffer());
        writeFileSync(`docs/fonts/files/${file}`, buf);
        downloaded.set(remote, file);
      }
      b = b.replace(remote, `files/${downloaded.get(remote)}`);
    }
    out += b;
  }
  writeFileSync(`docs/fonts/${name}.css`, out);
  console.log(`${name}.css: ${blocks.length} font faces`);
}
console.log(`${downloaded.size} font files saved in docs/fonts/files`);
