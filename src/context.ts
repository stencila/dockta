/**
 * TypeScript respresentations of Stencila JSON-LD @context types
 *
 * This is a temporay context. We are likely to generate these files
 * from JSON Schema definitions in the near future.
 */

class Thing {
  readonly type: string = 'Thing'

  description?: string
}

export class CreativeWork extends Thing {
  readonly type: string = 'CreativeWork'

  author: Array<string> = []
  text: string = ''
}

export class SoftwareSourceCode extends CreativeWork {
  readonly type: string = 'SoftwareSourceCode'

  programmingLanguage: string = ''
  id: string = ''
  messages: Array<SoftwareSourceCodeMessage> = []
}

export class SoftwareSourceCodeMessage extends Thing {
  // readonly type: string = 'SoftwareSourceCodeMessage'

  level?: string
  line?: number
  column?: number
  message?: string
}
