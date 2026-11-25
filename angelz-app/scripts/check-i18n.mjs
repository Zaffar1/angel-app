// Verifies locale files: identical key structure en/he, and every static t("ns:key") used in src exists.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const localesDir = path.join(root, "i18n/locales");
const langs = fs.readdirSync(localesDir);
const data = {};
let errors = 0;
const err = (m) => { errors++; console.error("✗", m); };

const flatten = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flatten(v, `${p}${k}.`) : [`${p}${k}`]));

for (const l of langs) {
  data[l] = {};
  for (const f of fs.readdirSync(path.join(localesDir, l))) {
    const ns = f.replace(".json", "");
    try { data[l][ns] = JSON.parse(fs.readFileSync(path.join(localesDir, l, f), "utf8")); }
    catch (e) { err(`invalid JSON ${l}/${f}: ${e.message}`); data[l][ns] = {}; }
  }
}
const nsSet = new Set(langs.flatMap((l) => Object.keys(data[l])));
const keysOf = (l, ns) => new Set(flatten(data[l][ns] || {}));
for (const ns of nsSet) {
  const base = keysOf("en", ns);
  for (const l of langs.filter((x) => x !== "en")) {
    const k = keysOf(l, ns);
    for (const x of base) if (!k.has(x) && !/_(one|other|two|few|many|zero)$/.test(x)) err(`${l}/${ns} missing "${x}"`);
    for (const x of k) if (!base.has(x) && !/_(one|other|two|few|many|zero)$/.test(x)) err(`${l}/${ns} extra "${x}"`);
  }
  // empty values
  for (const l of langs) for (const x of keysOf(l, ns)) {
    const v = x.split(".").reduce((a, c) => a?.[c], data[l][ns]);
    if (typeof v === "string" && v.trim() === "") err(`${l}/${ns} empty "${x}"`);
  }
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []);

const has = (ns, key) => {
  const set = keysOf("en", ns);
  if (set.has(key)) return true;
  return ["_one", "_other", "_two", "_zero", "_few", "_many"].some((s) => set.has(key + s)) ||
    [...set].some((k) => k.startsWith(key + "."));
};
const re = /\b(?:i18n\.t|t)\(\s*(["'`])([^"'`$]+?)\1/g;
const dynamic = /\bt\(\s*`[^`]*\$\{/g;
let used = 0;
for (const f of walk(root)) {
  if (f.includes("/i18n/")) continue;
  const src = fs.readFileSync(f, "utf8");
  const nsMatch = [...src.matchAll(/useLocale\(\s*(?:\[?\s*)?["'](\w+)["']/g)].map((m) => m[1]);
  const defNs = nsMatch[0] || "common";
  let m;
  while ((m = re.exec(src))) {
    let key = m[2];
    let ns = defNs;
    if (key.includes(":")) [ns, key] = key.split(":");
    if (!nsSet.has(ns)) { err(`${path.relative(root, f)}: unknown namespace "${ns}" in "${m[2]}"`); continue; }
    used++;
    if (!has(ns, key)) err(`${path.relative(root, f)}: missing key ${ns}:${key}`);
  }
  const dyn = src.match(dynamic);
  if (dyn) console.warn(`⚠ ${path.relative(root, f)}: ${dyn.length} dynamic key(s) not checked`);
}
console.log(`\nchecked ${used} static keys across ${nsSet.size} namespaces; ${errors} problem(s)`);
process.exit(errors ? 1 : 0);
