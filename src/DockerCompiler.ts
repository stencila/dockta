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
  async compile (source: string, build: boolean = true): Promise<SoftwareEnvironment | null> {
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
      dockerfile = '.Dockerfile'
      new DockerGenerator(environ, folder).generate()
    }

    if (build) {
      // Use the name of the environment, if possible
      let name = (environ && environ.name) || undefined
      // Build the image!
      const builder = new DockerBuilder()
      await builder.build(folder, name, dockerfile)
    }

    return environ
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
