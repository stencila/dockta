import Generator from './Generator'
import PythonGenerator from './PythonGenerator'
import RGenerator from './RGenerator'
import { SoftwareEnvironment } from './context'

/**
 * A Dockerfile generator that collects instructions from
 * all the other generators to allow for images that support
 * multiple languages.
 */
export default class DockerGenerator extends Generator {

  /**
   * The child generators from which this 'super' generator
   * collects instructions.
   */
  protected generators: Array<Generator>

  constructor (environ: SoftwareEnvironment) {
    super(environ)

    this.generators = [
      new PythonGenerator(this.environ),
      new RGenerator(this.environ)
    ].filter(generator => generator.applies())
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

  // Methods that override those in `Generator`

  applies (): boolean {
    return this.collect((generator: Generator) => generator.applies()).some(value => value)
  }

  sysVersion (): number {
    return Math.min(18.04, ...this.generators.map(generator => generator.sysVersion()))
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.aptRepos(sysVersion))
  }

  aptPackages (sysVersion: number): Array<string> {
    return this.collect((generator: Generator) => generator.aptPackages(sysVersion))
  }

  copyFiles (sysVersion: number): Array<string> {
    return this.collect((generator: Generator) => generator.copyFiles(sysVersion))
  }

  installPackages (sysVersion: number): Array<string> {
    return this.collect((generator: Generator) => generator.installPackages(sysVersion))
  }

  command (sysVersion: number): string | undefined {
    return this.generators.map((generator: Generator) => generator.command(sysVersion))
                          .filter(cmd => cmd)
                          .join(';')
  }
}
