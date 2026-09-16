import { defineField, defineType } from 'sanity'
import { UserIcon } from '@sanity/icons/User'

/**
 * Singleton — there is exactly one profile, edited in place rather than
 * created and listed. Its document id is pinned to PROFILE_ID and Studio
 * Structure opens it directly (see sanity.config.ts), which is the one case
 * where an explicit `_id` is the right call.
 */
export const PROFILE_ID = 'profile'

export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      initialValue: 'Meighan Johnson',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      type: 'string',
      description: 'One line under the name, e.g. "Watch writer, Geneva". Optional.',
      validation: (rule) => rule.max(120).warning('Long taglines wrap under the portrait.'),
    }),
    defineField({
      name: 'portrait',
      type: 'image',
      options: { hotspot: true },
      description: 'Set the hotspot — the portrait is cropped to a square.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Describes the image for screen readers and when the image fails to load.',
          validation: (rule) =>
            rule.custom((alt, context) => {
              const parent = context.parent as { asset?: { _ref?: string } } | undefined
              if (parent?.asset?._ref && !alt) return 'Alternative text is required'
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'About',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alternative text', type: 'string' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'tagline', media: 'portrait' },
  },
})
