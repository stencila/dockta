import assert from 'assert'
import Docker from 'dockerode'
import parser from 'docker-file-parser'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import tmp from 'tmp'

import {
  Person, pushAuthor,
  SoftwareSourceCode, SoftwareSourceCodeMessage
} from './context'

export default class DockerCompiler {

  /**
   * Load a `SoftwareSourceCode` node from a Dockerfile
   *
   * @param content The content to load
   * @param build Should the Docker image be built?
   */
  async load (content: string, build: boolean = true): Promise<SoftwareSourceCode> {
    if (content.substring(0, 7) === 'file://') {
      const path = content.substring(7)
      content = fs.readFileSync(path, 'utf8')
    }

    const node = new SoftwareSourceCode()
    node.programmingLanguage = 'Dockerfile'
    node.text = content
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

    // Build the Docker image
    const docker = new Docker()

    // Put the Dockerfile into a temporary folder
    const tempDir = tmp.dirSync().name
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), node.text)

    const stream = await docker.buildImage({
      context: tempDir,
      src: ['Dockerfile']
    }, {
      // Options to Docker ImageBuild operation
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageBuild
    }).catch(error => {
      let line
      let message = error.message
      const match = message.match(/^\(HTTP code 400\) unexpected - Dockerfile parse error line (\d+): (.*)$/)
      if (match) {
        line = parseInt(match[1], 0)
        message = match[2]
      }
      const msg = new SoftwareSourceCodeMessage()
      msg.level = 'error'
      msg.line = line
      msg.message = message
      node.messages.push(msg)
    })
    if (!stream) return node

    return new Promise<SoftwareSourceCode>((resolve, reject) => {
      stream.on('data', data => {
        data = JSON.parse(data)
        if (data.error) {
          const msg = new SoftwareSourceCodeMessage()
          msg.level = 'error'
          msg.message = data.error
          node.messages.push(msg)
        } else if (data.aux && data.aux.ID) {
          node.handle = data.aux.ID
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
