import parser from 'docker-file-parser'

import Parser from './Parser'
import { ComputerLanguage, SoftwarePackage, SoftwareEnvironment, push, Person } from './context'

/**
 * Dockter `Parser` class for Dockerfiles
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
      dockerfile  = this.read('Dockerfile')
    }

    const environ = new SoftwareEnvironment()

    // Parse instructions from the Dockerfile
    const instructions = parser.parse(dockerfile)

    // Process LABEL instructions
    for (let instruction of instructions.filter(instruction => instruction.name === 'LABEL')) {
      for (let [key, value] of Object.entries(instruction.args)) {
        // Unquote value if necessary
        if (value.startsWith('"')) value = value.substring(1)
        if (value.endsWith('"')) value = value.slice(0, -1)
        // Unescape spaces
        value = value.replace(/\\ /, ' ')

        switch (key) {
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
    for (let instruction of instructions.filter(instruction => instruction.name === 'MAINTAINER')) {
      let author = ''
      if (typeof instruction.args === 'string') author = instruction.args
      else throw new Error(`Unexpected type of instruction arguments ${typeof instruction.args}`)
      environ.authors.push(Person.fromText(author))
    }

    return environ
  }

}
