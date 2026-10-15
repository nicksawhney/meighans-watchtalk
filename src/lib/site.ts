/** Where contact messages are delivered. Shown in the footer, and the
 *  no-JS fallback target for the masthead "Contact me" link. */
export const CONTACT_EMAIL = 'meighanjohnson24@gmail.com'

/** Sender for contact-form mail. The domain comes from RESEND_EMAIL_DOMAIN,
 *  which the Vercel Resend integration provisions; this is only the fallback
 *  if that variable is ever missing. */
export const CONTACT_FROM_NAME = "Meighan's Watchtalk"
export const CONTACT_FROM_USER = 'hello'
export const CONTACT_FALLBACK_DOMAIN = 'meighanswatchtalk.com'

/** Reject submissions completed faster than a person plausibly could. */
export const MIN_FILL_MS = 3000

/** Production origin, mirroring `site` in astro.config.mjs. That file is .mjs and
 *  is loaded by Node before Vite, so it cannot import this one — Seo.astro throws
 *  on a production build if the two ever drift apart. */
export const SITE_URL = 'https://meighanswatchtalk.com'
export const SITE_NAME = "Meighan's Watchtalk"
export const SITE_TAGLINE = 'A journal of watches, makers, and the people who love them.'
export const LOCALE = 'en_GB'

/** The site is one person's byline, so the author is a site-wide constant rather
 *  than a Sanity reference. `byline` on a post still wins where it differs. */
export const AUTHOR_NAME = 'Meighan Johnson'
export const AUTHOR_JOB_TITLE = 'Watch writer'

/** Feeds schema.org `Person.sameAs`, which is how Google ties this site to a real
 *  person rather than an anonymous blog. Anything with her name on it that links
 *  back here belongs in this list — the reciprocal link is what makes it count. */
export const SOCIAL_PROFILES: string[] = ['https://www.instagram.com/meighanswatches/']

/** Build credit in the footer, and `WebSite.creator` in the JSON-LD graph. Kept
 *  deliberately separate from the author: never an article author, never the
 *  subject of a page, so it cannot dilute the Meighan Johnson entity. */
export const CREDIT_NAME = 'Nick Sawhney'
export const CREDIT_URL = 'https://nicksawhney.github.io/me'
