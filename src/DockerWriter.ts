import Writer from './Writer'
import PythonWriter from './PythonWriter'
import RWriter from './RWriter'

/**
 * A Dockerfile writer that collects instructions from
 * all the other writers to allow for images that support
 * multiple languages.
 */
export default class DockerWriter extends Writer {

  /**
   * The child writers from which this 'super' writer
   * collects instructions.
   */
  protected writers: Array<Writer>

  constructor (path: string) {
    super(path)

    // Only collect instructions from active writers
    this.writers = [
      new PythonWriter(path),
      new RWriter(path)
    ].filter(writer => writer.active)
  }

  /**
   * Collect arrays of string from each child writer
   * and flatten them into an array of strings.
   * Used below for method overrides.
   *
   * @param func The child writer method to call
   */
  private collect (func: any): Array<any> {
    // @ts-ignore
    return this.writers.map(func).reduce((memo, items) => (memo.concat(items)), [])
  }

  // Methods that override those in `Writer`

  sysVersion (): number {
    return Math.min(...this.writers.map(writer => writer.sysVersion()))
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    return this.collect((writer: Writer) => writer.aptRepos(sysVersion))
  }

  aptPackages (sysVersion: number): Array<string> {
    return this.collect((writer: Writer) => writer.aptPackages(sysVersion))
  }

  copyFiles (sysVersion: number): Array<string> {
    return this.collect((writer: Writer) => writer.copyFiles(sysVersion))
  }

  installPackages (sysVersion: number): Array<string> {
    return this.collect((writer: Writer) => writer.installPackages(sysVersion))
  }

  command (sysVersion: number): string | undefined {
    return this.writers.map((writer: Writer) => writer.command(sysVersion)).join(';')
  }
}
