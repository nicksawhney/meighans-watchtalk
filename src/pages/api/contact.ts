import { createHash } from 'node:crypto'

import type { APIRoute } from 'astro'
import { Resend } from 'resend'

import {
  CONTACT_EMAIL,
  CONTACT_FALLBACK_DOMAIN,
  CONTACT_FROM_NAME,
  CONTACT_FROM_USER,
  MIN_FILL_MS,
} from '../../lib/site'

// The only route in the site that is not prerendered. Everything else stays
// static; this becomes a single Vercel Function.
export const prerender = false

const MAX_NAME = 100
const MAX_EMAIL = 200
const MAX_MESSAGE = 5000

// Deliberately permissive — real addresses reject in surprising ways, and the
// reply-to is verified in practice by whether Meighan's reply arrives.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** Header values must not contain newlines. */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return json({ ok: false, error: 'Malformed request.' }, 400)
  }

  const name = String(payload.name ?? '').trim()
  const email = String(payload.email ?? '').trim()
  const message = String(payload.message ?? '').trim()
  const company = String(payload.company ?? '').trim()
  const elapsed = Number(payload.elapsed ?? 0)

  // Honeypot and speed trap. Answer 200 and drop it on the floor — telling a
  // bot it was caught just teaches it to try something else.
  if (company || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json({ ok: true })
  }

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Please fill in your name, email, and a message.' }, 400)
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
    return json({ ok: false, error: 'That message is too long to send.' }, 400)
  }
  if (!EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400)
  }

  // process.env first: the key is a runtime secret on Vercel, not known at
  // build. import.meta.env is the local-dev path, where Vite loads .env.
  const apiKey = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set')
    return json({ ok: false, error: 'Contact form is not configured yet.' }, 503)
  }

  // The integration provisions the verified sending domain; prefer it over a
  // hardcoded address so a domain change does not need a code change.
  const domain =
    process.env.RESEND_EMAIL_DOMAIN ??
    import.meta.env.RESEND_EMAIL_DOMAIN ??
    CONTACT_FALLBACK_DOMAIN

  // Same submission retried (double-click, network retry) reuses the original
  // send rather than mailing Meighan twice. Resend expires these after 24h.
  const fingerprint = createHash('sha256').update(`${email}\n${message}`).digest('hex').slice(0, 32)

  try {
    const resend = new Resend(apiKey)

    const send = (from: string, keySuffix = '') =>
      resend.emails.send(
        {
          from,
          to: CONTACT_EMAIL,
          // So replying in Gmail goes to the visitor rather than to Resend.
          replyTo: email,
          subject: `Watchtalk — message from ${singleLine(name)}`,
          // Plain text only: nothing user-supplied is ever interpreted as markup.
          text: [`From: ${name} <${email}>`, '', message].join('\n'),
        },
        // A retry must not reuse the key with a different `from` — same key,
        // different payload is a 409 from Resend.
        { idempotencyKey: `contact-form/${fingerprint}${keySuffix}` },
      )

    // The SDK resolves with { data, error } rather than throwing, so this
    // check is the real error path; the catch below is only for transport.
    let { error } = await send(`${CONTACT_FROM_NAME} <${CONTACT_FROM_USER}@${domain}>`)

    // While the sending domain is still pending DNS verification, fall back to
    // Resend's shared sender so the form works. Once the domain verifies this
    // branch stops being taken, with no code or config change.
    if (error && /not verified/i.test(`${error.message ?? ''}`)) {
      console.warn(`[contact] ${domain} not verified yet — using resend.dev sender`)
      ;({ error } = await send(`${CONTACT_FROM_NAME} <onboarding@resend.dev>`, '/fallback'))
    }

    if (error) {
      // Log the provider detail, never return it — it can leak config.
      console.error('[contact] resend error', error)
      return json({ ok: false, error: 'Could not send that just now. Please try again.' }, 502)
    }

    return json({ ok: true })
  } catch (cause) {
    console.error('[contact] unexpected failure', cause)
    return json({ ok: false, error: 'Could not send that just now. Please try again.' }, 502)
  }
}

/** Anything other than POST. */
export const ALL: APIRoute = () => json({ ok: false, error: 'Method not allowed.' }, 405)
