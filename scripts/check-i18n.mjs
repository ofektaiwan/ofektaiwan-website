#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(SCRIPT_DIR, '..', 'dist');

/*
 * Resolved the same way astro.config.mjs resolves it, so this validates the
 * build that actually ran rather than a hardcoded domain. Hardcoded, it passed
 * an ofek.ai build only by never being reached, then failed every canonical.
 */
const { resolveProfile } = await import('../src/data/site-profiles.ts');
const PROFILE = resolveProfile(process.env.SITE_PROFILE ?? process.env.GITHUB_REPOSITORY_OWNER);
const ORIGIN = `https://${PROFILE.domain}`;

const locales = [
  { locale: 'en', file: 'index.html', path: '/', lang: 'en', dir: 'ltr', marker: 'TRUSTED INSIGHTS INTO' },
  {
    locale: 'zh-tw',
    file: 'zh-tw/index.html',
    path: '/zh-tw/',
    lang: 'zh-TW',
    dir: 'ltr',
    marker: '前沿運算製造的',
  },
];

const alternates = [...locales.map(({ lang, path: localePath }) => ({ lang, path: localePath })), { lang: 'x-default', path: '/' }];
const problems = [];

const expectIncludes = (source, expected, context) => {
  if (!source.includes(expected)) problems.push(`${context}: missing ${JSON.stringify(expected)}`);
};

for (const definition of locales) {
  const filePath = path.join(DIST_DIR, definition.file);
  let html;
  try {
    html = await readFile(filePath, 'utf8');
  } catch {
    problems.push(`${definition.locale}: missing output file ${definition.file}`);
    continue;
  }

  expectIncludes(html, `lang="${definition.lang}"`, definition.locale);
  expectIncludes(html, `dir="${definition.dir}"`, definition.locale);
  expectIncludes(html, `data-locale="${definition.locale}"`, definition.locale);
  expectIncludes(html, `<link rel="canonical" href="${ORIGIN}${definition.path}">`, definition.locale);
  expectIncludes(html, definition.marker, definition.locale);
  for (const alternate of alternates) {
    expectIncludes(
      html,
      `rel="alternate" hreflang="${alternate.lang}" href="${ORIGIN}${alternate.path}"`,
      definition.locale,
    );
  }
}

let sitemap = '';
try {
  sitemap = await readFile(path.join(DIST_DIR, 'sitemap.xml'), 'utf8');
} catch {
  problems.push('sitemap: missing dist/sitemap.xml');
}

for (const definition of locales) {
  expectIncludes(sitemap, `<loc>${ORIGIN}${definition.path}</loc>`, 'sitemap');
  for (const alternate of alternates) {
    expectIncludes(
      sitemap,
      `hreflang="${alternate.lang}" href="${ORIGIN}${alternate.path}"`,
      'sitemap',
    );
  }
}

/*
 * The custom domain lives or dies by this file: an Actions deploy replaces the
 * whole published tree, so a build that drops or misspells CNAME takes the
 * domain down. Now that it is generated, assert it rather than trusting it.
 */
try {
  const cname = await readFile(path.join(DIST_DIR, 'CNAME'), 'utf8');
  if (cname !== PROFILE.domain) {
    problems.push(`CNAME: expected ${JSON.stringify(PROFILE.domain)}, got ${JSON.stringify(cname)}`);
  }
} catch {
  problems.push('CNAME: missing dist/CNAME — the custom domain would break on deploy');
}

let robots = '';
try {
  robots = await readFile(path.join(DIST_DIR, 'robots.txt'), 'utf8');
} catch {
  problems.push('robots: missing dist/robots.txt');
}
expectIncludes(robots, `Sitemap: ${ORIGIN}/sitemap.xml`, 'robots');

for (const removedPath of ['en', 'he', 'es']) {
  try {
    await stat(path.join(DIST_DIR, removedPath, 'index.html'));
    problems.push(`routing: /${removedPath}/ must not be emitted`);
  } catch {
    // Expected: English is canonical at root; removed locales stay unpublished.
  }
}

if (problems.length) {
  console.error(`i18n output validation failed:\n${problems.join('\n')}`);
  process.exit(1);
}

console.log('i18n output validation passed: 2 localized pages, canonical alternates, and sitemap');
