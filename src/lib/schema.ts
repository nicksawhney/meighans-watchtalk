/**
 * schema.org JSON-LD builders.
 *
 * The point of this file is entity recognition: Google needs to understand that
 * this domain *is* the person Meighan Johnson, not just a blog that mentions
 * her. That happens through one Person node, with one stable `@id`, repeated
 * identically on every page and corroborated off-site via `sameAs`.
 *
 * Two rules hold everything together:
 *
 * 1. Every page emits the full Person and WebSite nodes, not a bare `@id`
 *    reference. Google does not resolve `@id`s across pages — an unexpanded
 *    reference on a post page points at nothing.
 * 2. Page-specific nodes reference those two by `@id` only, so the graph on
 *    every URL converges on the same entity.
 *
 * Pure functions returning plain objects; no Astro imports.
 */

import {
  AUTHOR_JOB_TITLE,
  AUTHOR_NAME,
  CREDIT_NAME,
  CREDIT_URL,
  LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOCIAL_PROFILES,
} from './site'

/** BCP 47, for `inLanguage`. LOCALE is the underscored OpenGraph form. */
const LANGUAGE = LOCALE.replace('_', '-')

export const PERSON_ID = `${SITE_URL}/#person`
export const CREATOR_ID = `${SITE_URL}/#creator`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Absolute URL for a site-relative path, without a trailing slash. */
export function absoluteUrl(path: string): string {
  if (path === '/') return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`.replace(/\/$/, '')
}

export const webPageId = (path: string) => `${absoluteUrl(path)}#webpage`

type Ref = { '@id': string }
const ref = (id: string): Ref => ({ '@id': id })

export interface PersonInput {
  name: string
  description: string | null
  portraitUrl: string | null
}

/**
 * The authoritative Meighan Johnson node. `sameAs` is the single
 * highest-value field here — it is the edge Google walks to connect this site
 * to her Instagram, and it only pays off once that profile links back.
 */
export function buildPerson({ name, description, portraitUrl }: PersonInput) {
  const fullName = name || AUTHOR_NAME
  // The Studio holds her full name ("Meighan Nina Nurakhmetova Johnson"), so the
  // surname is the last token and anything between is a middle name — taking
  // "everything after the first token" as familyName would be wrong.
  const parts = fullName.split(' ').filter(Boolean)
  const givenName = parts[0]
  const familyName = parts.length > 1 ? parts[parts.length - 1] : undefined
  const additionalName = parts.slice(1, -1).join(' ') || undefined

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: fullName,
    // The byline, and the string people actually search. Stating it explicitly
    // is what lets Google treat the short and full names as one entity.
    alternateName: fullName === AUTHOR_NAME ? undefined : AUTHOR_NAME,
    givenName,
    additionalName,
    familyName,
    url: `${SITE_URL}/profile`,
    jobTitle: AUTHOR_JOB_TITLE,
    description: description || undefined,
    image: portraitUrl
      ? {
          '@type': 'ImageObject',
          '@id': `${SITE_URL}/#personimage`,
          url: portraitUrl,
          caption: name || AUTHOR_NAME,
        }
      : undefined,
    knowsAbout: ['Watches', 'Horology', 'Wristwatches', 'Watchmaking', 'Watch collecting'],
    // Omitted entirely rather than emitted empty — an empty sameAs is noise.
    sameAs: SOCIAL_PROFILES.length > 0 ? SOCIAL_PROFILES : undefined,
  }
}

/**
 * Build credit. Scoped strictly to `WebSite.creator`: never an article author,
 * never `about`, never `mainEntity`. Two Person nodes coexist fine while their
 * roles stay unambiguous, but blurring them would dilute the entity signal the
 * rest of this file exists to build.
 */
export function buildCreator() {
  return {
    '@type': 'Person',
    '@id': CREATOR_ID,
    name: CREDIT_NAME,
    url: CREDIT_URL || undefined,
    sameAs: CREDIT_URL ? [CREDIT_URL] : undefined,
  }
}

export function buildWebSite() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    inLanguage: LANGUAGE,
    // No SearchAction: there is no site search, and claiming one is a false signal.
    publisher: ref(PERSON_ID),
    author: ref(PERSON_ID),
    creator: ref(CREATOR_ID),
  }
}

interface PageInput {
  path: string
  name: string
  description: string
  imageUrl?: string | null
  dateModified?: string | null
}

/** Landing and section pages — both are lists of posts. */
export function buildCollectionPage({
  path,
  name,
  description,
  imageUrl,
  dateModified,
}: PageInput) {
  return {
    '@type': 'CollectionPage',
    '@id': webPageId(path),
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: ref(WEBSITE_ID),
    about: ref(PERSON_ID),
    inLanguage: LANGUAGE,
    primaryImageOfPage: imageUrl ? { '@type': 'ImageObject', url: imageUrl } : undefined,
    dateModified: dateModified || undefined,
  }
}

/**
 * The most direct statement available that /profile *is* Meighan Johnson.
 * ProfilePage is the type Google documents for exactly this, which is why it is
 * used here over the more generic AboutPage.
 */
export function buildProfilePage({ path, name, description, dateModified }: PageInput) {
  return {
    '@type': 'ProfilePage',
    '@id': webPageId(path),
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: ref(WEBSITE_ID),
    mainEntity: ref(PERSON_ID),
    inLanguage: LANGUAGE,
    dateModified: dateModified || undefined,
  }
}

export interface ArticleInput {
  path: string
  headline: string
  description: string
  imageUrl: string | null
  datePublished: string
  dateModified: string
  section: string
  wordCount?: number
}

export function buildBlogPosting({
  path,
  headline,
  description,
  imageUrl,
  datePublished,
  dateModified,
  section,
  wordCount,
}: ArticleInput) {
  const id = webPageId(path)

  return [
    {
      '@type': 'WebPage',
      '@id': id,
      url: absoluteUrl(path),
      name: headline,
      description,
      isPartOf: ref(WEBSITE_ID),
      inLanguage: LANGUAGE,
      datePublished,
      dateModified,
    },
    {
      '@type': 'BlogPosting',
      '@id': `${absoluteUrl(path)}#article`,
      // Google truncates headline past ~110 characters; titles here run to 94,
      // so this is a guard rather than a routine trim.
      headline: headline.length > 110 ? `${headline.slice(0, 109)}…` : headline,
      description,
      image: imageUrl || undefined,
      datePublished,
      dateModified,
      articleSection: section,
      inLanguage: LANGUAGE,
      author: ref(PERSON_ID),
      publisher: ref(PERSON_ID),
      isPartOf: ref(id),
      mainEntityOfPage: ref(id),
      wordCount,
    },
  ]
}

/** `items` is ordered root-first; the final entry is the current page. */
export function buildBreadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(items[items.length - 1]!.path)}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

/**
 * Wraps the page's nodes with the two site-wide ones. Called once per page by
 * Seo.astro — this is what guarantees every URL restates the same entity.
 */
export function buildGraph(person: PersonInput, pageNodes: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildWebSite(), buildPerson(person), buildCreator(), ...pageNodes],
  }
}

/**
 * JSON.stringify drops undefined values, so optional keys above disappear
 * cleanly. The `<` escape is not optional: post titles and the bio flow into
 * this string, and a literal `</script>` would end the tag early.
 */
export function serializeGraph(graph: object): string {
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}
