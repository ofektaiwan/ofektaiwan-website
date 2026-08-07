import type { SiteProfile } from './site-profiles';

/*
 * Replaced at build time by vite.define in astro.config.mjs, which is where the
 * env read lives. Declared rather than imported because src/ has no `process`.
 */
declare const __SITE_PROFILE__: SiteProfile;

const profile = __SITE_PROFILE__;

export const site = {
  name: 'Ofek',
  url: `https://${profile.domain}`,
  email: profile.email,
  linkedin: 'https://www.linkedin.com/company/ofekglobal',
} as const;

export const addresses = [
  'United States｜112 Capitol Trail, Newark, Delaware 19711, USA',
  'Taiwan｜No. 2, Sec. 1, Dunhua S. Rd., Songshan Dist., Taipei City 105408, Taiwan (R.O.C.)',
] as const;
