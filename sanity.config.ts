import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { UserIcon } from '@sanity/icons/User'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'

import { schemaTypes } from './src/sanity/schemaTypes'
import { PROFILE_ID } from './src/sanity/schemaTypes/profile'

// Project ID and dataset are public identifiers, not secrets. They are kept in
// sync with PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET in .env, which the
// Astro site reads. The Studio bundle cannot read PUBLIC_-prefixed vars, so the
// values are inlined here.
export default defineConfig({
  name: 'default',
  title: "Meighan's Watchtalk",
  projectId: 'zuixi3pi',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('post').title('Posts').icon(DocumentTextIcon),
            S.divider(),
            // Opens the one profile document directly instead of a list.
            S.listItem()
              .title('Profile')
              .id(PROFILE_ID)
              .icon(UserIcon)
              .child(
                S.document().schemaType('profile').documentId(PROFILE_ID).title('Profile'),
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Keep "Profile" out of the global create menu — there is only ever one,
    // and it is reached through the Content pane above.
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId !== 'profile'),
  },
})
