import assert from 'assert'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import Docker from 'dockerode'

import { SoftwareSourceCode, SoftwareEnvironment } from './context'

import Parser from './Parser'
import DockerParser from './DockerParser'
import RParser from './RParser'

import DockerGenerator from './DockerGenerator'
import DockerBuilder from './DockerBuilder'

export default class DockerCompiler {

  /**
   * Compile a folder into a Docker image
   *
   * @param source The folder, Dockerfile or `SoftwareEnvironment` to compile
   * @param build Should the Docker image be built?
   */
  async compile (source: string, build: boolean = true) {
    let folder
    if (source.substring(0, 7) === 'file://') {
      folder = source.substring(7)
    } else {
      folder = source
    }

    let dockerfile
    let environ

    if (fs.existsSync(path.join(folder, 'Dockerfile'))) {
      dockerfile = 'Dockerfile'
      environ = await new DockerParser(folder).parse()
    } else {
      // If there is a `environ.jsonld` file then use
      // TODO

      // Obtain environments for each language parser
      let parser: Parser
      for (parser of [
        new RParser(folder)
      ]) {
        const environLang = await parser.parse()
        if (environLang) {
          environ = environLang
          break
        }
      }

      // Normalise and compact the `environ` so that duplicates do not
      // exists e.g. packages required by multiple other packages
      // TODO

      if (!environ) environ = new SoftwareEnvironment()

      // Write `.environ.jsonld`
      // TODO

      // Generate Dockerfile
      const generator = new DockerGenerator(environ)
      let dockerfileContent = generator.generate()

      // Write `.Dockerfile`
      dockerfile = '.Dockerfile'
      fs.writeFileSync(path.join(folder, '.Dockerfile'), dockerfileContent)
    }

    const builder = new DockerBuilder()
    await builder.build(folder, undefined, dockerfile)

    return environ
  }

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
        dockerfile = '' // new DockerGenerator().generate()
      }
    } else {
      dockerfile = content
    }

    const node = new SoftwareSourceCode()
    // node.programmingLanguage = 'Dockerfile'
    node.text = dockerfile
    return node
  }

  /**
   * Compile a `SoftwareSourceCode` node
   *
   * Parse the `node.text` Dockerfile content to:
   *
   * - extract labels from [`LABEL` instructions](https://docs.docker.com/engine/reference/builder/#label)
   *
   * - extract a `maintainer` label from any deprecated
   *   [`MAINTAINER` instructions](https://docs.docker.com/engine/reference/builder/#maintainer-deprecated)
   *
   * See also [best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#label)
   * for labels.
   *
   * @param source The `SoftwareSourceCode` node to compile
   * @param build Should the Docker image be built?
   */
  async _compile (source: string | SoftwareSourceCode, build: boolean = true): Promise<SoftwareSourceCode> {
    let node: SoftwareSourceCode
    if (typeof source === 'string') node = await this.load(source)
    else node = source

    // assert.strictEqual(node.type, 'SoftwareSourceCode')
    // assert.strictEqual(node.programmingLanguage, 'Dockerfile')

    // FIXME
    const dir = (source as string).substring(7) // assumes a dir source
    let dockerfile
    let dockerfileName
    if (fs.existsSync(path.join(dir, 'Dockerfile'))) {
      dockerfile = fs.readFileSync(path.join(dir, 'Dockerfile'), 'utf8')
      dockerfileName = 'Dockerfile'
    } else {
      dockerfile = ' ' // new DockerWriter(dir).dockerfile()
      fs.writeFileSync(path.join(dir, '.Dockerfile'), dockerfile)
      dockerfileName = '.Dockerfile'
    }

    if (!build) return node

    const builder = new DockerBuilder()
    await builder.build(dir, undefined, dockerfileName)

    return node
  }

  async execute (source: string): Promise<SoftwareEnvironment | null> {
    const node = await this.compile(source)

    const docker = new Docker()

    let output = ''
    let outputStream = new stream.Writable()
    outputStream._write = (chunk) => {
      output += chunk
    }

    /*
    const container = await docker.run(node.handle, [], outputStream)

    let value
    try {
      value = JSON.parse(output)
    } catch {
      value = output.trim()
    }
    node.output = value
    */

    return node
  }
}
