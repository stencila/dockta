import { SoftwareEnvironment } from '@stencila/schema'

import Generator from './Generator'
import generators from './generators'

const PREFERRED_UBUNTU_VERSION = '18.04'

function versionCompare (versionOne: string, versionTwo: string) {
  if (versionOne === versionTwo) {
    return 0  // shortcut
  }

  let splitV1 = versionOne.split('.')
  let splitV2 = versionTwo.split('.')

  while (splitV1.length < splitV2.length) {
    splitV1.push('0')
  }

  while (splitV2.length < splitV1.length) {
    splitV2.push('0')
  }

  for (let i = 0; i < splitV1.length; i) {
    let component1 = parseInt(splitV1[i], 10)
    let component2 = parseInt(splitV2[i], 10)

    if (component1 < component2) {
      return -1
    } else if (component1 > component2) {
      return 1
    }
  }

  return 0  // all components equal
}

/**
 * A Dockerfile generator that collects instructions from
 * all the other generators to allow for images that support
 * multiple languages.
 */
export default class DockerGenerator extends Generator {

  environ: SoftwareEnvironment

  /**
   * The child generators from which this 'super' generator
   * collects instructions.
   */
  protected generators: Array<Generator>

  constructor (environ: SoftwareEnvironment, folder?: string) {
    super(folder)
    this.environ = environ

    // Each of the environment's `softwareRequirements` is
    // matched to one of the language specific generators
    // (the first that says that it `applies`)
    this.generators = []
    for (let pkg of this.environ.softwareRequirements) {
      for (let GeneratorClass of generators) {
        // @ts-ignore
        const generator = new GeneratorClass(pkg, folder)
        if (generator.applies()) {
          this.generators.push(generator)
          break
        }
      }
    }

  }

  /**
   * Collect arrays of string from each child generator
   * and flatten them into an array of strings.
   * Used below for method overrides.
   *
   * @param func The child generator method to call
   */
  private collect (func: any): Array<any> {
    // @ts-ignore
    return this.generators.map(func).reduce((memo, items) => (memo.concat(items)), [])
  }

  /**
   * Join strings from each child generator
   *
   * @param func The child generator method to call
   */
  private join (func: any, sep: string = ' \\\n && '): string {
    // @ts-ignore
    return this.generators.map(func).filter(cmd => cmd).join(sep)
  }

  // Methods that override those in `Generator`

  applies (): boolean {
    return true
  }

  baseVersion (): string {
    return [PREFERRED_UBUNTU_VERSION].concat(
        this.generators.filter(generator => generator.baseName() === this.baseName())  // filter to generators with matching base name
            .map(generator => generator.baseVersion()))
        .sort(versionCompare)[0]
  }

  envVars (sysVersion: string): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.envVars(sysVersion))
  }

  aptKeysCommand (sysVersion: string): string | undefined {
    return this.join((generator: Generator) => generator.aptKeysCommand(sysVersion))
  }

  aptRepos (sysVersion: string): Array<string> {
    return this.collect((generator: Generator) => generator.aptRepos(sysVersion))
  }

  aptPackages (sysVersion: string): Array<string> {
    // Get the set of unique apt packages requested by each child generator
    const pkgs = this.collect((generator: Generator) => generator.aptPackages(sysVersion)).sort()
    return Array.from(new Set(pkgs))
  }

  stencilaInstall (sysVersion: string): string | undefined {
    return this.join((generator: Generator) => generator.stencilaInstall(sysVersion))
  }

  installFiles (sysVersion: string): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.installFiles(sysVersion))
  }

  installCommand (sysVersion: string): string | undefined {
    return this.join((generator: Generator) => generator.installCommand(sysVersion))
  }

  projectFiles (sysVersion: string): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.projectFiles(sysVersion))
  }

  runCommand (sysVersion: string): string | undefined {
    return this.join((generator: Generator) => generator.runCommand(sysVersion), ';')
  }
}
