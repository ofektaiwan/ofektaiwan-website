# ofektaiwan.com

The Ofek marketing site: one static page, built with [Astro](https://astro.build) and deployed
to GitHub Pages at **https://www.ofektaiwan.com**.

The repository holds source only. `dist/` is a build artifact and is gitignored — GitHub Actions
builds it on every push to `main`.

## Commands

Node 24 (see `.nvmrc`; anything ≥ 22.12 works).

| | |
|---|---|
| `npm install` | once, after cloning |
| `npm run dev` | dev server on http://localhost:4321, hot reloads |
| `npm run build` | type-check, build to `dist/`, then validate all localized output |
| `npm run preview` | serve the built `dist/` as it will be served in production |
| `npm run check` | type-check only |
| `npm run check:i18n` | validate built locale pages, canonicals, alternates, and sitemap |
| `npm run visual-diff` | screenshot both locales at 8 widths and run interaction, overflow, console, and no-JS checks |

`npm run build` runs `astro check` first, so a type error fails the build rather than shipping.

## Where things are

```
src/
├── pages/                   English root, localized route entries, and generated sitemap
├── layouts/Layout.astro     <head>: SEO, Open Graph, JSON-LD, fonts, script entry
├── components/              sections plus reusable EditorialMedia and button components
├── i18n/                    locale definitions, strict message type, and translation files
├── data/site.ts             locale-independent organization metadata and contact details
├── styles/
│   ├── tokens.css           design tokens — colour, type, space, shape, motion
│   ├── reset.css
│   └── global.css           every component style, in @layer order
├── scripts/
│   ├── main.ts              entry; calls the two below
│   ├── nav.ts               progress, active sections, mobile menu, focus trap
│   └── motion.ts            reveals and the lazy scroll-timeline fallback
├── assets/images/           optimised at build time by Astro
└── icons/                   inlined as SVG components
public/                      copied byte-for-byte, never optimised (CNAME, favicon, robots.txt)
```

### Editing copy and languages

All visitor-facing copy lives in `src/i18n/locales/`. Every locale must satisfy the shared
`Messages` interface in `src/i18n/types.ts`, so a missing translation fails `npm run check`.
Locale paths, HTML language tags, direction, and switcher labels live in `src/i18n/config.ts`.

English is canonical at `/`; Traditional Chinese is published at `/zh-tw/`. The hero keeps one
accessible `headline` plus locale-specific visual `lines` and a `strongLine` index. Keep those
fields semantically synchronized when editing a headline.

Brand names, email, LinkedIn URL, and canonical organization addresses remain in
`src/data/site.ts`. Non-English copy is an initial marketing translation and should receive
native-speaker review before production publication.

### Design tokens

`src/styles/tokens.css` is the single source of truth for colour, type scale, spacing, shape and
motion. Components consume the semantic aliases (`--color-accent`, `--step-3`, `--section-y`),
never raw values — so retuning the brand means editing that one file.

The motion tokens are a deliberate five-rung system (hover / chrome / secondary entrance /
entrance / ambient), documented in a table at the top of the `--- Motion ---` block. Nothing on
the site declares a raw duration; if you add an animation, put it on one of those rungs.

`prefers-reduced-motion: reduce` collapses every duration token to `1ms` from one place at the
bottom of the same file, which neutralises the whole site at once. The one exception is noted
inline: a looping animation needs an explicit `animation: none`, because collapsing an
`infinite` animation's duration makes it cycle every frame rather than stop.

### Motion

Components opt in with `data-reveal`, `data-reveal-group`, and `data-parallax`, so the markup stays
readable. Pointer spotlights and magnetic motion are deliberately excluded from this design.

Two things worth knowing before changing anything there:

- **The hero headline reveal is pure CSS on purpose.** It is the page's first text paint, and
  routing it through a JS chunk would delay the Largest Contentful Paint by however long that
  chunk takes to arrive.
- **The hero parallax is CSS where the browser supports scroll-driven animations** and lazily
  falls back to Motion only where it doesn't (Firefox, at time of writing). Importing Motion's
  `scroll()` eagerly for everyone measurably cost LCP.

### Editorial images

Use `src/components/EditorialMedia.astro` for current and future content imagery. It supplies
responsive AVIF/WebP output, consistent ratios and crop positions, monochrome or natural tone,
and directional reveal options. The design rule is intentionally strict: square corners, crisp
crops, dark mattes, no shadows, glow, blur, grain, or decorative overlays.

## Deploying

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. See `DEPLOY.md` for the
rollback path, the checks to run after a deploy, and the traps around changing Pages settings.

`public/CNAME` must keep containing `www.ofektaiwan.com`. An Actions deploy replaces the entire
published tree, so if that file goes missing the custom domain breaks.
