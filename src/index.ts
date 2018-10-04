import parser from 'docker-file-parser'

import { SoftwareSourceCode } from './context'

export default class Compiler {
  /**
   * Load a `SoftwareSourceCode` node from a Dockerfile
   *
   * - extracts labels from [`LABEL` directives](https://docs.docker.com/engine/reference/builder/#label)
   *
   * - extracts a `maintainer` label from any deprecated
   *   [`MAINTAINER` directives](https://docs.docker.com/engine/reference/builder/#maintainer-deprecated)
   *
   * @param content The content to load
   * @param type The type of content
   */
  load (content: string): SoftwareSourceCode {
    const node = new SoftwareSourceCode()
    node.programmingLanguage = 'Dockerfile'

    // Parse directives from the Dockerfile
    let directives = parser.parse(content)

    // Process LABEL directives
    directives
      .filter(directive => directive.name === 'LABEL')
      .map(directive => {
        Object.entries(directive.args).map(([key, value]) => {
          // Unquote value if necessary
          if (value.startsWith('"')) value = value.substring(1)
          if (value.endsWith('"')) value = value.slice(0, -1)
          switch (key) {
            case 'maintainer':
              node.author.push(value)
              break
          }
        })
      })

    // Process MAINTAINER directives
    directives
      .filter(directive => directive.name === 'MAINTAINER')
      .map(directive => {
        const args = directive.args
        if (typeof args === 'string') return args
        else if (Array.isArray(args)) return args.join(', ')
        else throw new Error(`Unexpected type of directive arguments ${typeof args}`)
      })
      .map(author => node.author.push(author))

    return node
  }
}
