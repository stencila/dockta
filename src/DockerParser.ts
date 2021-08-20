import { SoftwareEnvironment, Person } from '@stencila/schema'
import parser from 'docker-file-parser'

import Doer from './Doer'

/**
 * Parser for Dockerfiles
 *
 * This class implements Dockerfile parsing. It extracts meta-data defined in a Dockerfile using
 * the [`LABEL`](https://docs.docker.com/engine/reference/builder/#label) or
 * deprecated [`MAINTAINER`](https://docs.docker.com/engine/reference/builder/#maintainer-deprecated) instructions.
 * Unlike the other parsers in Dockta it does not attempt to parse out dependencies.
 *
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
 * The following [schema crosswalk](https://en.wikipedia.org/wiki/Schema_crosswalk) defines how labels in
 * Dockerfiles are translated into JSON-LD properties
 *
 * | Label                                                  | Property (`context:type.property`)
 * | ---                                                    | ----
 * | `authors`                                              | `schema:CreativeWork.author`
 * | `build`                                                |
 * | `created`                                              | `schema:SoftwareSourceCode.dateCreated`
 * | `description`                                          | `schema:Thing.description`
 * | `documentation`                                        | `schema:softwareHelp`
 * | `licenses`                                             | `schema:CreativeWork.license`
 * | `maintainer`                                           | `codemeta:SoftwareSourceCode.maintainer`
 * | `ref-name`                                             |
 * | `revision`                                             |
 * | `schema-version`                                       | `schema:schemaVersion`
 * | `source`                                               | `schema:SoftwareSourceCode.codeRepository`
 * | `title`                                                | `schema:Thing.name`
 * | `url`                                                  | `schema:Thing.url`
 * | `vendor`                                               | `schema:Organization.legalName`
 * | `version`                                              | `schema:SoftwareApplication.softwareVersion`
 *
 */

export default class DockerParser extends Doer {
  /**
   * Parse a folder by detecting any Dockerfile
   * and return a `SoftwareEnvironment` instance
   */
  async parse(content?: string): Promise<SoftwareEnvironment | null> {
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
    for (const instruction of instructions.filter(
      (instruction) => instruction.name === 'LABEL'
    )) {
      for (let [key, value] of Object.entries(instruction.args)) {
        // Remove recognised prefixes from key
        const match =
          /^(org\.opencontainers\.image|org\.label-schema)\.([^ ]+)$/.exec(key)
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
          case 'author':
            environ.authors.push(Person.fromText(value))
            break
        }
      }
    }

    // Process MAINTAINER instructions
    for (const instruction of instructions.filter(
      (instruction) => instruction.name === 'MAINTAINER'
    )) {
      let author = ''
      if (typeof instruction.args === 'string') author = instruction.args
      else
        throw new Error(
          `Unexpected type of instruction arguments ${typeof instruction.args}`
        )
      environ.authors.push(Person.fromText(author))
    }

    return environ
  }
}
