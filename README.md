# Meighan's Watchtalk

A personal blog for Meighan Johnson — watches, makers, and the people who love them.
Astro (static) + Sanity for content, deployed on Vercel.

The look is a print-newspaper pastiche: paper-and-ink palette, Playfair Display
masthead, hairline rules, a quote marquee, and a hard-offset shadow on card hover.

## Stack

| | |
|---|---|
| Framework | Astro 7, static output, no adapter |
| Content | Sanity (project `zuixi3pi`, dataset `production`) |
| Styling | Plain CSS with custom properties — no Tailwind |
| Motion | CSS for the marquee and card entrances; GSAP only for the article-open animation |
| Fonts | Self-hosted woff2 in `public/fonts` |
| Hosting | Vercel, builds from `main` |

## Getting started

```bash
npm install
npm run dev          # site on :4321
npm run studio:dev   # Sanity Studio on :3333
```

`npm run dev` reads `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` from
`.env`. Both are public identifiers, not secrets — but `.env` is gitignored, so
the same two values must also exist in the Vercel project settings for
deploys to build.

There is also a hosted Studio; `npm run studio:deploy` publishes to it, and
`npm run schema:deploy` pushes schema changes alone.

## Content model

### `post`

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `subheadline` | string | optional; layout closes up without it |
| `slug` | slug | required, generated from title |
| `section` | string | required — `opinions`, `interviews`, or `poetry` |
| `byline` | string | defaults to "Meighan Johnson" |
| `featured` | boolean | promotes the post to the lead slot |
| `coverImage` | image | hotspot enabled, alt text required |
| `publishedAt` | datetime | required |
| `body` | Portable Text | blocks plus inline images with alt and caption |

Posts predating the `section` and `byline` fields are handled in GROQ with
`coalesce`, so nothing breaks — but `section` is required, and the Studio
flags older posts until one is chosen.

### `profile`

A singleton with `name`, `tagline`, `portrait`, and a Portable Text `body`.
Its `_id` is pinned to `profile`, Studio Structure opens it directly instead of
as a list, and it is filtered out of the global "create new" menu so a second
one cannot be made by accident.

The `/profile` nav link only appears once the document is **published** — a
draft will not show up. That is the usual reason the link seems to be missing.

## Routes

| Route | Source |
|---|---|
| `/` | all posts, lead first |
| `/opinions`, `/interviews`, `/poetry` | generated from `SECTION_LABELS` |
| `/posts/[slug]` | one post |
| `/profile` | the profile singleton |

Sections are real static routes rather than a client-side filter, so they work
with JS disabled, each has a linkable URL, and the lead-post logic runs per
section. Adding a section means editing `SECTIONS` in
`src/sanity/schemaTypes/post.ts` and `SECTION_LABELS` in
`src/sanity/lib/queries.ts` — the route, nav item, and footer link follow.

## Layout

```text
public/fonts/            six self-hosted woff2 (Playfair, Baskerville, Courier Prime)
src/
  components/            Masthead, Ticker, FrontPage, ArticleCard, SiteFooter, PortableImage
  layouts/Layout.astro   document shell, font preloads, ClientRouter
  lib/format.ts          date formatting and excerpt trimming
  pages/                 routes (see table above)
  sanity/
    lib/queries.ts       getPosts, getPost, getProfile + shared types
    lib/image.ts         urlFor image builder
    schemaTypes/         post and profile
  styles/global.css      @font-face, tokens, base, prose, animations
sanity.config.ts         Studio config and Structure
reference/               Figma Make export — gitignored, see below
```

### Design tokens

Defined in `src/styles/global.css` and named to match the Figma source so the
two can be diffed:

`--background` `#FAF8F3` · `--foreground` `#1A160E` · `--card` `#F5F2E8` ·
`--primary` `#8B1A1A` · `--muted-foreground` `#5C4A32` · `--border` `#B0A48A` ·
`--radius` `0px`

### Fonts

Playfair Display and Libre Baskerville ship as single variable files covering
their whole weight range (400–900 and 400–700); the italics and Courier Prime
are static. Six files, ~168 KB total. The three upright faces are preloaded in
`Layout.astro`.

### Motion

Every animation is gated behind `prefers-reduced-motion`. The global reset
zeroes durations, the card entrances resolve to their final state rather than
staying invisible, the quote marquee stops scrolling and shows a single static
quote, and the GSAP article-open animation is skipped entirely.

## Design reference

`reference/` holds the original Figma Make export, pulled via the Figma MCP.
It is **gitignored and not part of the build** — a standalone React + Vite
prototype kept only as a spec for spacing, type scale, color, and easing.

All of its content is placeholder, and its three pages were adapted rather than
copied: Front Page became `/` plus the section routes, Portfolio was dropped,
and Publish — a submissions form that only wrote to local state — became the
mailto link in the footer. Articles open as real routes instead of modals.

See `reference/README.md` for what is worth taking from it.

## Deploying

Vercel builds from `main`:

```bash
git add -A
git commit -m "..."
git push
```

`git add -A` matters — `git commit -a` skips untracked files, which is how a
build once shipped without half its components.

## Gotchas

- **Content is published-only.** Builds read published documents; drafts are
  invisible to the site. If something is missing, check it is published.
- **New posts need a rebuild.** The site is static, so publishing in Sanity does
  not update the live site until Vercel builds again.
- **Two favicons.** `Layout.astro` links both `favicon.svg` and `favicon.ico`,
  and Chrome prefers the `.ico`. If the icon changes, regenerate the `.ico` from
  the SVG — updating only the SVG will look like nothing happened. Chrome also
  caches favicons in a database that survives a hard reload.
- **Section pages can be empty.** A section with no posts renders the "No
  dispatches in this section yet" state.
