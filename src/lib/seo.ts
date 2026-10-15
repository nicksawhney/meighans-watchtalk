/**
 * Per-page SEO records. Each builder returns everything Seo.astro needs for one
 * route: meta copy, canonical path, the share image, and the page's JSON-LD
 * nodes. Pages stay thin — they call one builder and hand the result to Layout.
 */

import { plainTextExcerpt } from './format'
import {
  buildBlogPosting,
  buildBreadcrumbs,
  buildCollectionPage,
  buildProfilePage,
} from './schema'
import { AUTHOR_NAME, SITE_NAME, SITE_TAGLINE } from './site'
import { urlFor } from '../sanity/lib/image'
import {
  SECTION_LABELS,
  type Post,
  type PostSummary,
  type Profile,
  type SanityImage,
  type Section,
} from '../sanity/lib/queries'

export interface SeoImage {
  url: string
  alt: string
  width: number
  height: number
}

export interface SeoData {
  title: string
  description: string
  /** Site-relative, no trailing slash. Seo.astro makes it absolute. */
  canonicalPath: string
  ogType: 'website' | 'article' | 'profile'
  image: SeoImage | null
  noindex?: boolean
  article?: {
    publishedTime: string
    modifiedTime: string
    section: string
    author: string
  }
  /** Page-specific graph nodes. The Person and WebSite nodes are added globally. */
  jsonLd: object[]
}

/** OpenGraph wants 1.91:1. The on-page cover is 16:9, so share images are a
 *  separate derivative rather than a reuse of it. jpg over auto('format')
 *  because Facebook and LinkedIn scrapers handle WebP inconsistently. */
const OG_WIDTH = 1200
const OG_HEIGHT = 630

function ogImage(source: SanityImage | null | undefined, alt: string): SeoImage | null {
  if (!source?.asset) return null
  return {
    url: urlFor(source)
      .width(OG_WIDTH)
      .height(OG_HEIGHT)
      .fit('crop')
      .format('jpg')
      .quality(80)
      .url(),
    alt: source.alt || alt,
    width: OG_WIDTH,
    height: OG_HEIGHT,
  }
}

/**
 * Share-image fallback chain: the page's own image, then the lead post's cover,
 * then nothing. Returning null is deliberate — Seo.astro drops the image tags
 * entirely rather than pointing at a URL that would render as a broken card.
 *
 * coverImage is projected for every post, not just featured ones (ArticleCard
 * merely chooses not to render it), so the second step has real data.
 */
function resolveImage(
  own: SanityImage | null | undefined,
  posts: PostSummary[],
  fallbackAlt: string,
): SeoImage | null {
  const lead = posts.find((post) => post.coverImage?.asset)
  return ogImage(own, fallbackAlt) ?? ogImage(lead?.coverImage, lead?.title ?? fallbackAlt)
}

/** Per-section copy. Each title carries the full name exactly once — the queries
 *  worth winning are "meighan johnson" and "meighan watches", and the name has
 *  to actually appear in the title for that to work. */
const SECTION_SEO: Record<Section, { title: string; description: string }> = {
  opinions: {
    title: `Watch Opinions by ${AUTHOR_NAME} | ${SITE_NAME}`,
    description: `Opinions on watches, brands, and the industry, written by ${AUTHOR_NAME}.`,
  },
  interviews: {
    title: `Watch Interviews by ${AUTHOR_NAME} | ${SITE_NAME}`,
    description: `Interviews with watchmakers, collectors, and the people behind the industry, by ${AUTHOR_NAME}.`,
  },
  poetry: {
    title: `Watch Poetry by ${AUTHOR_NAME} | ${SITE_NAME}`,
    description: `Poems about watches, time, and the people who keep it — by ${AUTHOR_NAME}.`,
  },
}

const HOME_TITLE = `${SITE_NAME} — Watch Writing by ${AUTHOR_NAME}`
const HOME_DESCRIPTION = `${AUTHOR_NAME} writes about watches, the people who make them, and the ones worth wearing — opinions, interviews, and poetry from the bench up.`

/** Newest publish date in a list, for CollectionPage.dateModified. */
function newestUpdate(posts: PostSummary[]): string | null {
  return posts.reduce<string | null>(
    (latest, post) => (!latest || post._updatedAt > latest ? post._updatedAt : latest),
    null,
  )
}

export function homeSeo(posts: PostSummary[]): SeoData {
  const image = resolveImage(null, posts, SITE_NAME)

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonicalPath: '/',
    ogType: 'website',
    image,
    jsonLd: [
      buildCollectionPage({
        path: '/',
        name: HOME_TITLE,
        description: HOME_DESCRIPTION,
        imageUrl: image?.url,
        dateModified: newestUpdate(posts),
      }),
    ],
  }
}

export function sectionSeo(section: Section, posts: PostSummary[]): SeoData {
  const { title, description } = SECTION_SEO[section]
  const label = SECTION_LABELS[section]
  const image = resolveImage(null, posts, label)

  return {
    title,
    description,
    canonicalPath: `/${section}`,
    ogType: 'website',
    image,
    // An empty section still builds (it renders its "no dispatches" state) but
    // is a thin page, so keep it out of the index until something lands there.
    // The sitemap omits it on the same condition.
    noindex: posts.length === 0,
    jsonLd: [
      buildCollectionPage({
        path: `/${section}`,
        name: title,
        description,
        imageUrl: image?.url,
        dateModified: newestUpdate(posts),
      }),
      buildBreadcrumbs([
        { name: 'Home', path: '/' },
        { name: label, path: `/${section}` },
      ]),
    ],
  }
}

export function postSeo(post: Post, posts: PostSummary[]): SeoData {
  const path = `/posts/${post.slug}`
  const label = SECTION_LABELS[post.section]
  const description =
    plainTextExcerpt(post.subheadline ?? post.excerpt, 160) ?? SITE_TAGLINE
  const image = resolveImage(post.coverImage, posts, post.title)

  return {
    title: `${post.title} — ${SITE_NAME}`,
    description,
    canonicalPath: path,
    ogType: 'article',
    image,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      section: label,
      author: post.byline,
    },
    jsonLd: [
      ...buildBlogPosting({
        path,
        headline: post.title,
        description,
        imageUrl: image?.url ?? null,
        datePublished: post.publishedAt,
        dateModified: post._updatedAt,
        section: label,
        wordCount: post.excerpt ? post.excerpt.trim().split(/\s+/).length : undefined,
      }),
      buildBreadcrumbs([
        { name: 'Home', path: '/' },
        { name: label, path: `/${post.section}` },
        { name: post.title, path },
      ]),
    ],
  }
}

export function profileSeo(profile: Profile | null, posts: PostSummary[]): SeoData {
  const name = profile?.name ?? AUTHOR_NAME
  // Deliberately AUTHOR_NAME rather than the Studio's `name`: the profile holds
  // her full name, but the query worth winning is the short byline. The h1 and
  // the Person node still show the full name, and Person.alternateName ties the
  // two together — a title differing from the h1 is fine, losing the target
  // string from the title is not.
  const title = `${AUTHOR_NAME} — Watch Writer | ${SITE_NAME}`
  const description =
    plainTextExcerpt(profile?.tagline, 160) ??
    `Who ${name} is, what she writes about, and how to get in touch. Editor and sole correspondent of ${SITE_NAME}.`

  return {
    title,
    description,
    canonicalPath: '/profile',
    ogType: 'profile',
    image: resolveImage(profile?.portrait, posts, name),
    jsonLd: [
      buildProfilePage({
        path: '/profile',
        name: title,
        description,
        dateModified: profile?._updatedAt ?? null,
      }),
      buildBreadcrumbs([
        { name: 'Home', path: '/' },
        { name: 'About me', path: '/profile' },
      ]),
    ],
  }
}

export function notFoundSeo(): SeoData {
  return {
    title: `Page not found — ${SITE_NAME}`,
    description: 'That page does not exist.',
    canonicalPath: '/404',
    ogType: 'website',
    image: null,
    noindex: true,
    jsonLd: [],
  }
}

/** Used by Layout when a page passes only title/description, so the head is
 *  never missing canonical or OpenGraph tags even on a route that predates
 *  this module. */
export function fallbackSeo(title: string, description: string, path: string): SeoData {
  return {
    title,
    description,
    canonicalPath: path,
    ogType: 'website',
    image: null,
    jsonLd: [],
  }
}
