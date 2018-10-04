/**
 * TypeScript respresentations of Stencila JSON-LD @context types
 *
 * This is a temporay context. We are likely to generate these files
 * from JSON Schema definitions in the near future.
 */

class Thing {
  static readonly type: string = 'Thing'

  description?: string
}

export class CreativeWork extends Thing {
  static readonly type: string = 'CreativeWork'

  author: Array<string> = []
}

export class SoftwareSourceCode extends CreativeWork {
  static readonly type: string = 'SoftwareSourceCode'

  programmingLanguage: string = ''
}
