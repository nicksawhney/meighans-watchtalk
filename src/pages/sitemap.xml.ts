import type { APIRoute } from 'astro'

import { absoluteUrl } from '../lib/schema'
import {
  getPosts,
  profileExists,
  sectionsWithPosts,
  type PostSummary,
  type Section,
} from '../sanity/lib/queries'

/**
 * Hand-rolled rather than @astrojs/sitemap, because both things this sitemap
 * needs to get right require Sanity data: real `lastmod` values, and leaving
 * out section routes that currently hold no posts. An integration configured in
 * astro.config.mjs would have to instantiate a second Sanity client and await
 * it at config-eval time, which means `astro dev` stops starting whenever
 * Sanity is unreachable. Not worth it for a sitemap.
 *
 * The cost is that new routes must be added here by hand.
 */

interface Entry {
  path: string
  lastmod?: string | null
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
}

function newest(posts: PostSummary[]): string | null {
  return posts.reduce<string | null>(
    (latest, post) => (!latest || post._updatedAt > latest ? post._updatedAt : latest),
    null,
  )
}

/** Slugs are URL-safe, but the loc is interpolated into XML either way. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toUrlElement({ path, lastmod, changefreq, priority }: Entry): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(path))}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n')
}

export const GET: APIRoute = async () => {
  const [posts, liveSections, hasProfile] = await Promise.all([
    getPosts(),
    sectionsWithPosts(),
    profileExists(),
  ])

  const entries: Entry[] = [
    { path: '/', lastmod: newest(posts), changefreq: 'weekly', priority: 1.0 },

    // Mirrors the nav: the route only goes in once there is something behind it.
    ...(hasProfile
      ? [{ path: '/profile', lastmod: null, changefreq: 'monthly' as const, priority: 0.9 }]
      : []),

    // Empty sections still build (they render their empty state) but are thin
    // pages, so they stay out until a post lands. seo.ts noindexes them on the
    // same condition.
    ...[...liveSections].map((section: Section) => ({
      path: `/${section}`,
      lastmod: newest(posts.filter((post) => post.section === section)),
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),

    ...posts.map((post) => ({
      path: `/posts/${post.slug}`,
      lastmod: post._updatedAt,
      changefreq: 'monthly' as const,
      priority: 0.8,
    })),
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(toUrlElement),
    '</urlset>',
    '',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
