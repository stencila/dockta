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

  constructor (environ: SoftwareEnvironment, folder?: string) {
    super(environ, folder)

    // List of possible generators filtered by those that apply to the
    // environment
    this.generators = [
      new PythonGenerator(environ, folder),
      new RGenerator(environ, folder)
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
    return true
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

  installFiles (sysVersion: number): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.installFiles(sysVersion))
  }

  installCommand (sysVersion: number): string | undefined {
    return this.generators.map((generator: Generator) => generator.installCommand(sysVersion))
                          .filter(cmd => cmd)
                          .join(' \\\n && ')
  }

  projectFiles (sysVersion: number): Array<[string, string]> {
    return this.collect((generator: Generator) => generator.projectFiles(sysVersion))
  }

  runCommand (sysVersion: number): string | undefined {
    return this.generators.map((generator: Generator) => generator.runCommand(sysVersion))
                          .filter(cmd => cmd)
                          .join(';')
  }
}
