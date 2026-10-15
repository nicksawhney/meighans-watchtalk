// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';
import vercel from '@astrojs/vercel';

// astro.config.mjs runs before Astro loads env, so read the PUBLIC_ vars via Vite.
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
	process.env.NODE_ENV ?? 'development',
	process.cwd(),
	'',
);

// https://astro.build/config
export default defineConfig({
	// Production origin. Duplicated as SITE_URL in src/lib/site.ts because this
	// file is .mjs and Node loads it before Vite, so it cannot import the TS
	// module. Seo.astro throws on a prod build if the two ever drift apart.
	site: 'https://meighanswatchtalk.com',

	// Astro's default would build canonical URLs and sitemap entries as
	// `/posts/foo/` while Vercel serves `/posts/foo`, so every canonical would
	// point at a redirect. This also writes `trailingSlash: false` into the
	// adapter's output config, so Vercel 308s the slashed form. Every internal
	// link in the site is already slash-free.
	trailingSlash: 'never',

	// Output stays static — every page is still prerendered. The adapter is here
	// only so `src/pages/api/contact.ts` (which sets `prerender = false`) can run
	// as a single Vercel Function.
	adapter: vercel(),
	integrations: [
		sanity({
			projectId: PUBLIC_SANITY_PROJECT_ID,
			dataset: PUBLIC_SANITY_DATASET,
			apiVersion: '2026-09-15',
			useCdn: false,
		}),
	],
});
