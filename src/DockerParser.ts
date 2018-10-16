import parser from 'docker-file-parser'

import Parser from './Parser'
import { ComputerLanguage, SoftwarePackage, SoftwareEnvironment, push, Person } from './context'

/**
 * Parser for Dockerfiles
 *
 * This class implements Dockerfile parsing. It extracts meta-data defined in a Dockerfile using
 * the [`LABEL`](https://docs.docker.com/engine/reference/builder/#label) or
 * deprecated [`MAINTAINER`](https://docs.docker.com/engine/reference/builder/#maintainer-deprecated) instructions.
 * Unlike the other parsers in Dockter it does not attempt to parse out dependencies.
 *
 * The following crosswalk table defines how labels in Dockerfiles are translated into JSON-LD properties
 * Here "label" refers to a key in a LABEL instruction that is un-prefixed
 * or has either the [`org.opencontainers.image`](https://github.com/opencontainers/image-spec/blob/master/annotations.md) prefix,
 * or the deprecated [`org.label-schema`](https://github.com/label-schema/label-schema.org) prefix.
 * In other words, the following are all equivalent:
 *
 * ```Dockerfile
 * LABEL version = 1.2.0
 * LABEL org.opencontainers.image.version = 1.2.0
 * LABEL org.label-schema.version = 1.2.0
 * ```
 *
 * | Label                                                  | Property (`context:type.property`) 
 * | ---                                                    | ----
 * | `description`                                          | `schema:Thing.description`
 * | `maintainer`                                           | `codemeta:SoftwareSourceCode.maintainer`
 * | `created`                                              | `schema:SoftwareSourceCode.dateCreated`    
 * | `url`                                                  | `schema:Thing.url`                           
 * | `source`                                               | `schema:SoftwareSourceCode.codeRepository`   
 * | `version`                                              | `schema:SoftwareApplication.softwareVersion` 
 * | `vendor`                                               | `schema:Organization.legalName`              
 * | `title`                                                | `schema:Thing.name`                          
 * | `documentation`                                        | `schema:softwareHelp`                        
 * | `authors`                                              | `schema:CreativeWork.author`                 
 * | `licenses`                                             | `schema:CreativeWork.license`                
 * | `schema-version`                                       | `schema:schemaVersion`                                            
 * | `build`                                                |                                            
 * | `ref-name`                                             |                                            
 * | `revision`                                             |                                            
 *
 */

export default class DockerParser extends Parser {

  /**
   * Parse a folder by detecting any Dockerfile
   * and return a `SoftwareEnvironment` instance
   */
  async parse (content?: string): Promise<SoftwareEnvironment | null> {

    let dockerfile: string
    if (content) {
      dockerfile = content
    } else {
      if (!this.exists('Dockerfile')) return null
      dockerfile = this.read('Dockerfile')
    }

    const environ = new SoftwareEnvironment()

    // Parse instructions from the Dockerfile
    const instructions = parser.parse(dockerfile)

    // Process LABEL instructions
    for (let instruction of instructions.filter(instruction => instruction.name === 'LABEL')) {
      for (let [key, value] of Object.entries(instruction.args)) {
        // Remove recognised prefixes from key
        const match = key.match(/^(org\.opencontainers\.image|org\.label-schema)\.([^ ]+)$/)
        if (match) key = match[2]

        // Unquote value if necessary
        if (value.startsWith('"')) value = value.substring(1)
        if (value.endsWith('"')) value = value.slice(0, -1)
        // Unescape spaces
        value = value.replace(/\\ /, ' ')

        switch (key) {
          case 'name':
            environ.name = value
            break
          case 'description':
            environ.description = value
            break
          case 'maintainer':
            // TODO should push to a `maintainers` property
          case 'author':
            environ.authorsPush(Person.fromText(value))
            break
        }
      }
    }

    // Process MAINTAINER instructions
    for (let instruction of instructions.filter(instruction => instruction.name === 'MAINTAINER')) {
      let author = ''
      if (typeof instruction.args === 'string') author = instruction.args
      else throw new Error(`Unexpected type of instruction arguments ${typeof instruction.args}`)
      environ.authorsPush(Person.fromText(author))
    }

    return environ
  }

}
