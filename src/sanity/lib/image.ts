import { sanityClient } from 'sanity:client'
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
