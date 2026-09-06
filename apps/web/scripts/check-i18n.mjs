#!/usr/bin/env node
/**
 * Guards the two ways trilingual copy breaks at runtime rather than at build:
 * a key present in one locale but not another, and a `t("…")` call naming a key
 * no locale defines. next-intl throws on both, in production, on the screen the
 * jury is looking at.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "fr", "pcm"];

function flatten(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const keysByLocale = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    new Set(
      flatten(JSON.parse(readFileSync(join(root, "messages", `${l}.json`), "utf8"))),
    ),
  ]),
);

const problems = [];

const allKeys = new Set(LOCALES.flatMap((l) => [...keysByLocale[l]]));
for (const locale of LOCALES) {
  for (const key of allKeys) {
    if (!keysByLocale[locale].has(key)) {
      problems.push(`${locale}.json is missing "${key}"`);
    }
  }
}

// Resolve `useTranslations("Ns")` per file, then every literal t("key") against
// it. Template-literal keys (t(`status.${x}`)) can't be checked statically and
// are skipped rather than guessed at.
for (const file of sourceFiles(join(root, "src"))) {
  const src = readFileSync(file, "utf8");
  const namespaces = new Map();
  for (const m of src.matchAll(
    /const\s+(\w+)\s*=\s*useTranslations\(\s*"([^"]+)"\s*\)/g,
  )) {
    namespaces.set(m[1], m[2]);
  }
  if (namespaces.size === 0) continue;

  for (const [fn, ns] of namespaces) {
    const calls = new RegExp(`\\b${fn}\\(\\s*"([^"]+)"`, "g");
    for (const m of src.matchAll(calls)) {
      const key = `${ns}.${m[1]}`;
      if (!keysByLocale.en.has(key)) {
        problems.push(`${file.replace(root + "/", "")} uses "${key}", not in en.json`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error("i18n check failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `i18n ok — ${allKeys.size} keys present in all ${LOCALES.length} locales, every literal t() call resolves`,
);
