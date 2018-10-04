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
   * See also [best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#label)
   * for labels.
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
    for (let directive of directives.filter(directive => directive.name === 'LABEL')) {
      for (let [key, value] of Object.entries(directive.args)) {
        // Unquote value if necessary
        if (value.startsWith('"')) value = value.substring(1)
        if (value.endsWith('"')) value = value.slice(0, -1)
        // Unescape spaces
        value = value.replace(/\\ /, ' ')
        
        switch (key) {
          case 'description':
            node.description = value
            break
          case 'maintainer':
            node.author.push(value)
            break
        }
      }
    }

    // Process MAINTAINER directives
    for (let directive of directives.filter(directive => directive.name === 'MAINTAINER')) {
      let author = ''
      if (typeof directive.args === 'string') author = directive.args
      else if (Array.isArray(directive.args)) author = directive.args.join(', ')
      else throw new Error(`Unexpected type of directive arguments ${typeof directive.args}`)
      node.author.push(author)
    }

    return node
  }
}
