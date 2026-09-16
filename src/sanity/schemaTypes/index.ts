import type { SchemaTypeDefinition } from 'sanity'

import { post } from './post'
import { profile } from './profile'

export const schemaTypes: SchemaTypeDefinition[] = [post, profile]
