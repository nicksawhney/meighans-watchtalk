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
