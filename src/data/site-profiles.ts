/**
 * The only place the two published sites differ.
 *
 * ofektaiwan.com and ofek.ai are the same company and ship the same tree: same
 * copy, same addresses, same LinkedIn, both locales. Only the domain and the
 * contact address change, so keeping that difference to one map is what makes a
 * single shared codebase worth having — the two repos stay byte-identical,
 * including their workflow, and a sync can never conflict.
 *
 * Resolution order (see astro.config.mjs, which owns the env read because
 * src/ has no @types/node and therefore no `process`):
 *
 *   SITE_PROFILE              local preview: SITE_PROFILE=ofekai npm run build
 *   GITHUB_REPOSITORY_OWNER   set automatically by Actions in both repos
 *   ofektaiwan                fallback, so a bare `npm run dev` is unsurprising
 *
 * Deriving from the repo owner is what lets one workflow file serve both repos.
 */
export const PROFILES = {
  ofektaiwan: { domain: 'www.ofektaiwan.com', email: 'contact@ofektaiwan.com' },
  ofekai: { domain: 'www.ofek.ai', email: 'contact@ofek.ai' },
} as const;

export type SiteProfile = (typeof PROFILES)[keyof typeof PROFILES];

export const DEFAULT_PROFILE_KEY = 'ofektaiwan';

/** Unknown owners fall back rather than throwing: a fork should still build. */
export function resolveProfile(key: string | undefined | null): SiteProfile {
  if (key && Object.hasOwn(PROFILES, key)) return PROFILES[key as keyof typeof PROFILES];
  return PROFILES[DEFAULT_PROFILE_KEY];
}
