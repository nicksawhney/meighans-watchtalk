import { defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'

export const SECTIONS = [
  { title: 'Opinions', value: 'opinions' },
  { title: 'Interviews', value: 'interviews' },
  { title: 'Poetry', value: 'poetry' },
] as const

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheadline',
      type: 'string',
      group: 'content',
      description: 'One supporting line under the headline. Optional — the layout closes up without it.',
      validation: (rule) => rule.max(160).warning('Long subheadlines wrap awkwardly on cards.'),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'meta',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'section',
      type: 'string',
      group: 'meta',
      description: 'Drives the front-page filter nav.',
      options: {
        list: SECTIONS.map((s) => ({ title: s.title, value: s.value })),
        layout: 'radio',
      },
      initialValue: 'opinions',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'byline',
      type: 'string',
      group: 'meta',
      // Deliberately not required: the query falls back to 'Meighan Johnson',
      // so flagging the pre-existing posts as invalid would be pure noise.
      description: 'Who the piece is credited to. Defaults to Meighan Johnson.',
      initialValue: 'Meighan Johnson',
    }),
    defineField({
      name: 'featured',
      title: 'Feature on the front page',
      type: 'boolean',
      group: 'meta',
      description:
        'Promotes this post to the large lead slot. If several are featured, the most recent one leads.',
      initialValue: false,
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Set the hotspot — the front page crops covers to a fixed height.',
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
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative text',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              type: 'string',
            }),
          ],
        },
      ],
    }),
  ],
  orderings: [
    {
      name: 'publishedAtDesc',
      title: 'Published at, newest first',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', section: 'section', date: 'publishedAt', media: 'coverImage' },
    prepare({ title, section, date, media }) {
      const label = SECTIONS.find((s) => s.value === section)?.title ?? section
      const when = date ? new Date(date).toLocaleDateString('en-US') : 'unpublished'
      return { title, subtitle: [label, when].filter(Boolean).join(' · '), media }
    },
  },
})
