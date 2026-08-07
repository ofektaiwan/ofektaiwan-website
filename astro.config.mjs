// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { resolveProfile } from './src/data/site-profiles.ts';

/*
 * This file owns the env read for the whole build: src/ has no @types/node, so
 * nothing under src/ can touch `process`. The resolved profile is injected as
 * __SITE_PROFILE__ (see vite.define below) and read back by src/data/site.ts.
 *
 * GITHUB_REPOSITORY_OWNER is set automatically by Actions, so ofektaiwan/website
 * and ofekai/website run the *same* workflow and still build their own site.
 */
// Read through globalThis because this file is `// @ts-check`ed and the project
// deliberately has no @types/node — adding it would retype setTimeout and
// friends across the client code in src/scripts/.
const env = /** @type {any} */ (globalThis).process?.env ?? {};
const profile = resolveProfile(env.SITE_PROFILE ?? env.GITHUB_REPOSITORY_OWNER);

// https://astro.build/config
export default defineConfig({
  // Must match the CNAME exactly, including `www` — a mismatch produces
  // canonical/OG URLs that 301 and split the SEO signal. Both are now generated
  // from this one profile (src/pages/CNAME.ts), so they cannot drift apart.
  site: `https://${profile.domain}`,

  // Deliberately NO `base`. Setting one on a custom domain silently breaks
  // every asset URL. See plan risk R1.

  vite: {
    define: {
      __SITE_PROFILE__: JSON.stringify(profile),
    },
  },

  output: 'static',
  trailingSlash: 'ignore',

  i18n: {
    locales: ['en', 'zh-tw'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // The reference site's exact pairing, fetched at build time and self-hosted
  // so the static GitHub Pages deployment has no runtime font dependency.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Lato',
      cssVariable: '--font-lato',
      weights: [300, 400, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Open Sans',
      cssVariable: '--font-open-sans',
      weights: [300, 400, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  // Adjacent inline spans in the title components include intentional literal
  // spaces, so preserve their authored HTML.
  compressHTML: false,
});
