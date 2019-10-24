import fs from 'fs'
import path from 'path'
import { SoftwareEnvironment, SoftwarePackage } from '@stencila/schema'

import DockerParser from './DockerParser'
import parsers from './parsers'

import DockerGenerator from './DockerGenerator'
import DockerBuilder from './DockerBuilder'
import DockerExecutor from './DockerExecutor'
import IUrlFetcher from './IUrlFetcher'

/**
 * Compiles a project into a Dockerfile, or Docker image
 */
export default class DockerCompiler {

  /**
   * The instance of IUrlFetcher to fetch URLs
   */
  private readonly urlFetcher: IUrlFetcher

  constructor (urlFetcher: IUrlFetcher) {
    this.urlFetcher = urlFetcher
  }

  /**
   * Compile a project
   *
   * @param source The folder, Dockerfile or `SoftwareEnvironment` to compile
   * @param build Should the Docker image be built?
   * @param comments Should comments be added to the Dockerfile?
   * @param stencila Should relevant Stencila language packages be installed in the image?
   * @param baseImage override the FROM parameter of the Dockerfile
   */
  async compile (source: string, build: boolean = true, comments: boolean = true, stencila: boolean = false, baseImage?: string): Promise<SoftwareEnvironment | null> {
    let folder
    if (source.substring(0, 7) === 'file://') {
      folder = source.substring(7)
    } else {
      folder = source
    }

    let dockerfile
    let environ

    if (fs.existsSync(path.join(folder, 'Dockerfile'))) {
      // Dockerfile found so use that
      dockerfile = 'Dockerfile'
      environ = await new DockerParser(this.urlFetcher, folder).parse()
    } else {
      if (fs.existsSync(path.join(folder, 'environ.jsonld'))) {
        // Read existing environment from file
        const jsonld = fs.readFileSync(path.join(folder, 'environ.jsonld'), 'utf8')
        const initializer = JSON.parse(jsonld)
        environ = new SoftwareEnvironment(initializer)
      } else {
        // Create environment by merging packages
        // generated by each language parser
        environ = new SoftwareEnvironment()
        environ.name = path.basename(folder)
        for (let ParserClass of parsers) {
          const parser = new ParserClass(this.urlFetcher, folder)
          const pkg = await parser.parse()
          if (pkg) environ.softwareRequirements.push(pkg)
        }

        // Save environ as an intermediate file
        const jsonld = JSON.stringify(environ.toJSONLD(), null, '  ')
        fs.writeFileSync(path.join(folder, '.environ.jsonld'), jsonld)
      }

      // Generate Dockerfile
      dockerfile = '.Dockerfile'
      new DockerGenerator(this.urlFetcher, environ, folder, baseImage).generate(comments, stencila)
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

  /**
   * Execute the project by compiling, building and running a Docker container for it
   *
   * @param source The project to execute
   */
  async execute (source: string, command: string = '') {
    let folder
    if (source.substring(0, 7) === 'file://') {
      folder = source.substring(7)
    } else {
      folder = source
    }

    // Compile the environment first
    let environ = await this.compile(source)
    if (!environ) throw new Error('Environment not created')
    if (!environ.name) throw new Error('Environment does not have a name')

    // Execute the environment's image (which is built in compile())
    const executor = new DockerExecutor()
    return executor.execute(environ.name, folder, command)
  }

  /**
   * Find out who contributed to the packages that your project
   * depends upon.
   *
   * @param folder The project to examine
   * @param maxDepth The maximum dependency recursion depth
   */
  async who (folder: string, maxDepth: number = 100): Promise<object> {
    let environ = await this.compile(folder, false)
    if (!environ) throw new Error('Environment not created')

    const people: {[key: string]: Array<string>} = {}

    /**
     * Get the people for a software package
     *
     * @param pkg The package
     * @param depth The current recursion depth
     */
    function get (pkg: SoftwarePackage | SoftwareEnvironment, depth: number = 0) {
      let all = pkg.authors.concat(pkg.contributors).concat(pkg.creators)
      for (let person of all) {
        const name = person.name
        if (people[name]) {
          if (!people[name].includes(pkg.name)) people[name].push(pkg.name)
        } else {
          people[name] = [pkg.name]
        }
      }
      // Keep going deeper, if we haven't yet reached the maximum depth
      if (depth < maxDepth) {
        for (let req of pkg.softwareRequirements) {
          get(req, depth + 1)
        }
      }
    }
    get(environ)

    return people
  }
}
