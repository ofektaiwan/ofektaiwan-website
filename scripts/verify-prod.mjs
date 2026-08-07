#!/usr/bin/env node
/**
 * Verifies a PUBLISHED site, as opposed to visual-diff.mjs which verifies a local build.
 *
 * The check that earns its keep is `animationName` on the scroll-driven scenes. Lightning
 * CSS once silently destroyed every `animation-timeline` rule, so 16 of 17 transitions
 * compiled away to nothing and the site looked fine in every static check.
 * scripts/check-css.mjs guards the source; this proves it end to end against the real
 * deployed CSS.
 *
 * Must run in Chromium at desktop width with reduced motion off: the rules sit behind
 * `@supports (animation-timeline: view())` and `(prefers-reduced-motion: no-preference)`,
 * and src/scripts/motion.ts drives the same elements via WAAPI on browsers without support.
 * In Safari, Firefox, or at mobile width a perfectly healthy build reports "none".
 *
 * Usage:
 *   node scripts/verify-prod.mjs                        # the active profile's domain
 *   node scripts/verify-prod.mjs https://www.ofek.ai    # or an explicit origin
 *   BASE=https://www.ofek.ai node scripts/verify-prod.mjs
 */
import { chromium } from 'playwright';
import { resolveProfile } from '../src/data/site-profiles.ts';

const profile = resolveProfile(process.env.SITE_PROFILE ?? process.env.GITHUB_REPOSITORY_OWNER);
const BASE = (process.argv[2] ?? process.env.BASE ?? `https://${profile.domain}`).replace(/\/$/, '');

/* Counting live timelines beats checking one element: the regression zeroed them all at
   once, so a low count is the signal even if a single selector is later renamed. */
const MIN_TIMELINES = 10;

const browser = await chromium.launch();
const results = [];

for (const path of ['/', '/zh-tw/']) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('requestfailed', (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && failedRequests.push(`${r.status()} ${r.url()}`));

  await page.goto(BASE + path, { waitUntil: 'networkidle' });

  const probe = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const named = all.map((el) => getComputedStyle(el).animationName).filter((a) => a && a !== 'none');
    const timelines = all
      .map((el) => getComputedStyle(el).animationTimeline)
      .filter((t) => t && t !== 'auto' && t !== 'none');
    const band = document.querySelector('.about-features-band');
    return {
      supports: CSS.supports('animation-timeline', 'view()'),
      bandAnimation: band ? getComputedStyle(band).animationName : null,
      timelineCount: timelines.length,
      names: [...new Set(named)],
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      lang: document.documentElement.lang,
      title: document.title,
      email: (document.body.innerHTML.match(/contact@[a-z.]+/g) ?? [])[0] ?? null,
      canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    };
  });

  results.push({ path, ...probe, consoleErrors, failedRequests });
  await context.close();
}

await browser.close();

let failed = false;
console.log(`Verifying ${BASE}\n`);
for (const r of results) {
  console.log(`=== ${r.path} ===`);
  console.log(`  lang / title       : ${r.lang} — ${r.title}`);
  console.log(`  canonical          : ${r.canonical}`);
  console.log(`  contact email      : ${r.email}`);
  console.log(`  supports view()    : ${r.supports}`);
  console.log(`  .about-features-band animationName: ${r.bandAnimation}`);
  console.log(`  elements w/ timeline: ${r.timelineCount}`);
  console.log(`  distinct animations : ${r.names.join(', ')}`);
  console.log(`  console errors      : ${r.consoleErrors.length ? r.consoleErrors.join(' | ') : 'none'}`);
  console.log(`  failed requests     : ${r.failedRequests.length ? r.failedRequests.join(' | ') : 'none'}`);

  const expectedEmail = `contact@${new URL(BASE).host.replace(/^www\./, '')}`;
  if (!r.supports) {
    console.log('  !! SKIPPED: this browser lacks animation-timeline; run in Chromium');
  } else {
    if (r.bandAnimation !== 'scene-fade-out') { console.log('  !! FAIL: scene animation missing — the Lightning CSS regression is back'); failed = true; }
    if (r.timelineCount < MIN_TIMELINES) { console.log(`  !! FAIL: only ${r.timelineCount} live timelines`); failed = true; }
  }
  if (r.email !== expectedEmail) { console.log(`  !! FAIL: expected ${expectedEmail}, found ${r.email}`); failed = true; }
  if (r.overflow) { console.log('  !! FAIL: horizontal overflow'); failed = true; }
  if (r.consoleErrors.length || r.failedRequests.length) { console.log('  !! FAIL: console or network errors'); failed = true; }
  console.log('');
}

console.log(failed ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(failed ? 1 : 0);
