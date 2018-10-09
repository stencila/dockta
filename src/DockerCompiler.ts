import assert from 'assert'
import parser from 'docker-file-parser'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import Docker from 'dockerode'

import {
  Person, pushAuthor,
  SoftwareSourceCode, SoftwareSourceCodeMessage
} from './context'

import SuperWriter from './SuperWriter'

export default class DockerCompiler {

  /**
   * Load a `SoftwareSourceCode` node from a Dockerfile
   *
   * @param content The content to load
   * @param build Should the Docker image be built?
   */
  async load (content: string, build: boolean = true): Promise<SoftwareSourceCode> {
    let dockerfile = ''
    if (content.substring(0, 7) === 'file://') {
      const pat = content.substring(7)
      if (path.basename(pat) === 'Dockerfile') {
        dockerfile = fs.readFileSync(pat, 'utf8')
      } else if (fs.existsSync(path.join(pat, 'Dockerfile'))) {
        dockerfile = fs.readFileSync(path.join(pat, 'Dockerfile'), 'utf8')
      } else if (fs.statSync(pat).isDirectory()) {
        dockerfile = new SuperWriter(pat).dockerfile()
      }
    } else {
      dockerfile = content
    }

    const node = new SoftwareSourceCode()
    node.programmingLanguage = 'Dockerfile'
    node.text = dockerfile
    return node
  }

  /**
   * Compile a `SoftwareSourceCode` node
   *
   * Parse the `node.text` Dockerfile content to:
   *
   * - extract labels from [`LABEL` directives](https://docs.docker.com/engine/reference/builder/#label)
   *
   * - extract a `maintainer` label from any deprecated
   *   [`MAINTAINER` directives](https://docs.docker.com/engine/reference/builder/#maintainer-deprecated)
   *
   * See also [best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#label)
   * for labels.
   *
   * @param source The `SoftwareSourceCode` node to compile
   * @param build Should the Docker image be built?
   */
  async compile (source: string | SoftwareSourceCode, build: boolean = true): Promise<SoftwareSourceCode> {
    let node: SoftwareSourceCode
    if (typeof source === 'string') node = await this.load(source)
    else node = source

    assert.strictEqual(node.type, 'SoftwareSourceCode')
    assert.strictEqual(node.programmingLanguage, 'Dockerfile')

    // Parse directives from the Dockerfile
    let directives = parser.parse(node.text)

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
            node.description.push(value)
            break
          case 'maintainer':
          case 'author':
            pushAuthor(node, value)
            break
        }
      }
    }

    // Process MAINTAINER directives
    for (let directive of directives.filter(directive => directive.name === 'MAINTAINER')) {
      let author = ''
      if (typeof directive.args === 'string') author = directive.args
      else throw new Error(`Unexpected type of directive arguments ${typeof directive.args}`)
      pushAuthor(node, author)
    }

    if (!build) return node

    return node
  }

  async execute (source: string | SoftwareSourceCode): Promise<SoftwareSourceCode> {
    const node = await this.compile(source)

    const docker = new Docker()

    let output = ''
    let outputStream = new stream.Writable()
    outputStream._write = (chunk) => {
      output += chunk
    }

    const container = await docker.run(node.handle, [], outputStream)

    let value
    try {
      value = JSON.parse(output)
    } catch {
      value = output.trim()
    }
    node.output = value

    return node
  }
}
