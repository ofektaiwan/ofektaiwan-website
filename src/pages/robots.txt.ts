import type { APIRoute } from 'astro';
import { site } from '../data/site';

/*
 * Generated so the Sitemap line always points at the domain this build is for.
 * Committed in public/ it silently advertised ofektaiwan.com's sitemap from an
 * ofek.ai build.
 */
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
