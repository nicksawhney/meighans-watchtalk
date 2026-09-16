// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';

// astro.config.mjs runs before Astro loads env, so read the PUBLIC_ vars via Vite.
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
	process.env.NODE_ENV ?? 'development',
	process.cwd(),
	'',
);

// https://astro.build/config
export default defineConfig({
	integrations: [
		sanity({
			projectId: PUBLIC_SANITY_PROJECT_ID,
			dataset: PUBLIC_SANITY_DATASET,
			apiVersion: '2026-09-15',
			useCdn: false,
		}),
	],
});
