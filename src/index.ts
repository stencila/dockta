import assert from 'assert'
import Docker from 'dockerode'
import parser from 'docker-file-parser'
import fs from 'fs'
import path from 'path'
import tmp from 'tmp'

import { SoftwareSourceCode } from './context'

export default class Compiler {

  /**
   * Load a `SoftwareSourceCode` node from a Dockerfile
   *
   * @param content The content to load
   * @param build Should the Docker image be built?
   */
  async load (content: string, build: boolean = true): Promise<SoftwareSourceCode> {
    const node = new SoftwareSourceCode()
    node.programmingLanguage = 'Dockerfile'
    node.text = content
    return this.compile(node, build)
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
   * @param node The `SoftwareSourceCode` node to compile
   * @param build Should the Docker image be built?
   */
  async compile (node: SoftwareSourceCode, build: boolean = true): Promise<SoftwareSourceCode> {
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
      else throw new Error(`Unexpected type of directive arguments ${typeof directive.args}`)
      node.author.push(author)
    }

    if (!build) return node

    // Build the Docker image
    const docker = new Docker()

    const tempDir = tmp.dirSync().name
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), node.text)

    const stream = await docker.buildImage({
      // Create a temporary folder and put the Docker file in it
      context: tempDir,
      src: ['Dockerfile']
    }, {
      // Options to Docker ImageBuild operation
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageBuild
      t: 'foo:bar' // Name and tag in `name:tag` format
    }).catch(error => {
      let line
      let message = error.message
      const match = message.match(/^\(HTTP code 400\) unexpected - Dockerfile parse error line (\d+): (.*)$/)
      if (match) {
        line = parseInt(match[1], 0)
        message = match[2]
      }
      node.messages.push({
        type: 'SoftwareSourceCodeMessage',
        level: 'error',
        line,
        message
      })
    })
    if (!stream) return node

    return new Promise<SoftwareSourceCode>((resolve, reject) => {
      stream.on('data', data => {
        data = JSON.parse(data)
        if (data.error) {
          node.messages.push({
            type: 'SoftwareSourceCodeMessage',
            level: 'error',
            message: data.error
          })
        } else if (data.aux && data.aux.ID) {
          // TODO Unique identifier for Docker images based
          // on repository and sha256
          node.id = `https://hub.docker.com/#${data.aux.ID}`
        } else {
          // We could keep track of data that looks like this
          //  {"stream":"Step 2/2 : RUN foo"}
          // to match any errors with lines in the Dockefile content
        }
      })
      stream.on('end', () => resolve(node))
      stream.on('error', reject)
    })
  }
}
