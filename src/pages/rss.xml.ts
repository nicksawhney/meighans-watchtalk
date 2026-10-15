import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'

import { plainTextExcerpt } from '../lib/format'
import { LOCALE, SITE_NAME, SITE_TAGLINE } from '../lib/site'
import { SECTION_LABELS, getPosts } from '../sanity/lib/queries'

/** Feed readers and aggregators are a real, if small, discovery channel in the
 *  watch niche. Linked from <head> in Seo.astro. */
export const GET: APIRoute = async (context) => {
  const posts = await getPosts()

  return rss({
    title: SITE_NAME,
    description: SITE_TAGLINE,
    // `site` comes from astro.config.mjs; this route cannot render without it.
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      // Longer than the meta description: a feed item is read as the content,
      // not as a search snippet.
      description: plainTextExcerpt(post.subheadline ?? post.excerpt, 300) ?? '',
      pubDate: new Date(post.publishedAt),
      link: `/posts/${post.slug}`,
      author: post.byline,
      categories: [SECTION_LABELS[post.section]],
    })),
    customData: `<language>${LOCALE.toLowerCase().replace('_', '-')}</language>`,
  })
}
