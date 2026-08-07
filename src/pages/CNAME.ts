import type { APIRoute } from 'astro';
import { site } from '../data/site';

/*
 * Generated rather than committed to public/, so the custom domain can never
 * disagree with `site` in astro.config.mjs — a mismatch there produces
 * canonical URLs that 301 and split the SEO signal, and a wrong CNAME breaks
 * the domain outright on the next deploy.
 *
 * An Actions deploy replaces the entire published tree, so this file is what
 * keeps the custom domain alive across deploys. scripts/check-i18n.mjs asserts
 * dist/CNAME matches the active profile, so a build that would drop or corrupt
 * it fails before it can be published.
 *
 * No trailing newline: GitHub Pages stores the domain verbatim.
 */
export const GET: APIRoute = () =>
  new Response(new URL(site.url).host, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
