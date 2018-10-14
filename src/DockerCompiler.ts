import assert from 'assert'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import Docker from 'dockerode'

import {
  Person,
  SoftwareSourceCode, SoftwareSourceCodeMessage
} from './context'

import DockerWriter from './DockerGenerator'
import DockerBuilder from './DockerBuilder'
import DockerGenerator from './DockerGenerator';

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
  async compile (source: string | SoftwareSourceCode, build: boolean = true): Promise<SoftwareSourceCode> {
    let node: SoftwareSourceCode
    if (typeof source === 'string') node = await this.load(source)
    else node = source

    //assert.strictEqual(node.type, 'SoftwareSourceCode')
    //assert.strictEqual(node.programmingLanguage, 'Dockerfile')

    // FIXME
    const dir = (source as string).substring(7) // assumes a dir source
    let dockerfile
    let dockerfileName
    if (fs.existsSync(path.join(dir, 'Dockerfile'))) {
      dockerfile = fs.readFileSync(path.join(dir, 'Dockerfile'), 'utf8')
      dockerfileName = 'Dockerfile'
    } else {
      dockerfile = ' ' //new DockerWriter(dir).dockerfile()
      fs.writeFileSync(path.join(dir, '.Dockerfile'), dockerfile)
      dockerfileName = '.Dockerfile'
    }

    if (!build) return node

    const builder = new DockerBuilder()
    await builder.build(dir, undefined, dockerfileName)

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
