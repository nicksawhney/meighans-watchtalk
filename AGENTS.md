# Meighan's Watch Talk Website
Personal blog for my good friend Meighan. Astro + Sanity (headless CMS) + Vercel.
Design source of truth: Figma file https://www.figma.com/make/gPbZO8Fw13R0Cke8lgSSji/Creative-Writing-Website?p=f. Match it exactly — spacing, type scale, colors, easing.

# Stack decisions
- Astro with <ClientRouter /> for page transitions
- Sanity for content (posts: title, slug, cover image, body as Portable Text, publishedAt)
- Plain CSS with custom properties; no Tailwind
- GSAP only for the article-open animation; marquee is pure CSS
- Respect prefers-reduced-motion everywhere

# Conventions
- Mobile-first, semantic HTML, no layout shift on font load
- Fonts: [names], self-hosted woff2 in /public/fonts

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
