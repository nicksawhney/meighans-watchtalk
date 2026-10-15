import type { APIRoute } from 'astro'

import { SITE_URL } from '../lib/site'

/**
 * An endpoint rather than a static public/robots.txt so the sitemap URL is
 * derived from SITE_URL and cannot go stale, and so preview deployments can be
 * kept out of the index.
 *
 * Belt-and-braces on that last point: self-referencing canonicals already mark
 * the *.vercel.app copies as duplicates, and Vercel sets x-robots-tag on
 * previews. But preview URLs leaking into the index is exactly the thing that
 * fragments a brand-new entity, so take both.
 */
export const GET: APIRoute = () => {
  const isProduction = process.env.VERCEL_ENV === 'production'

  const body = isProduction
    ? ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, '']
    : ['User-agent: *', 'Disallow: /', '']

  return new Response(body.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
