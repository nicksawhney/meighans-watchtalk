import { sanityClient } from 'sanity:client'
import { defineQuery } from 'groq'
import type { PortableTextBlock } from '@portabletext/types'

export interface SanityImage {
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  alt?: string
  caption?: string
}

export type Section = 'opinions' | 'interviews' | 'poetry'

export const SECTION_LABELS: Record<Section, string> = {
  opinions: 'Opinions',
  interviews: 'Interviews',
  poetry: 'Poetry',
}

/** Everything that can be lit in the masthead nav. */
export type NavKey = Section | 'all' | 'profile'

export interface PostSummary {
  _id: string
  title: string
  subheadline: string | null
  slug: string
  section: Section
  byline: string
  featured: boolean
  publishedAt: string
  coverImage: SanityImage | null
  /** Body flattened to plain text by GROQ's pt::text, for card excerpts. */
  excerpt: string | null
}

export interface Post extends PostSummary {
  body: PortableTextBlock[] | null
}

// Shared projection. `byline` and `section` coalesce because posts created
// before those fields existed have neither.
const POST_FIELDS = /* groq */ `
  _id,
  title,
  subheadline,
  "slug": slug.current,
  "section": coalesce(section, "opinions"),
  "byline": coalesce(byline, "Meighan Johnson"),
  "featured": coalesce(featured, false),
  publishedAt,
  coverImage,
  "excerpt": pt::text(body)
`

// `featured desc` first means a flagged post always leads; `publishedAt desc`
// breaks the tie, so flagging several can never produce an arbitrary winner.
const POSTS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]
    | order(coalesce(featured, false) desc, publishedAt desc) {
    ${POST_FIELDS}
  }
`)

const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0] {
    ${POST_FIELDS},
    body
  }
`)

/** All posts, lead post first. */
export function getPosts(): Promise<PostSummary[]> {
  return sanityClient.fetch<PostSummary[]>(POSTS_QUERY)
}

export function getPost(slug: string): Promise<Post | null> {
  return sanityClient.fetch<Post | null>(POST_QUERY, { slug })
}

export interface Profile {
  name: string
  tagline: string | null
  portrait: SanityImage | null
  body: PortableTextBlock[] | null
}

// Singleton, so it is fetched by its pinned id rather than by ordering a list.
const PROFILE_QUERY = defineQuery(`
  *[_id == "profile"][0] {
    name,
    tagline,
    portrait,
    body
  }
`)

/** Returns null until the profile document is published in the Studio. */
export function getProfile(): Promise<Profile | null> {
  return sanityClient.fetch<Profile | null>(PROFILE_QUERY)
}

const POST_SECTIONS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current)]{"section": coalesce(section, "opinions")}.section
`)

/**
 * Sections that currently hold at least one post. The nav uses this to hide
 * tabs that would only lead to an empty state; a tab reappears by itself once
 * something is published into it.
 */
export async function sectionsWithPosts(): Promise<Set<Section>> {
  const sections = await sanityClient.fetch<Section[]>(POST_SECTIONS_QUERY)
  return new Set(sections)
}

const PROFILE_EXISTS_QUERY = defineQuery(`defined(*[_id == "profile"][0]._id)`)

/**
 * Cheap existence check so the nav can hide the Profile link until there is
 * something behind it. Avoids pulling the whole document on every page.
 */
export function profileExists(): Promise<boolean> {
  return sanityClient.fetch<boolean>(PROFILE_EXISTS_QUERY)
}
