import Writer from './Writer'
import PythonWriter from './PythonWriter'
import RWriter from './RWriter'

export default class SuperWriter extends Writer {

  protected writers: Array<Writer>

  constructor (path: string) {
    super(path)

    this.writers = [
      new PythonWriter(path),
      new RWriter(path)
    ].filter(writer => writer.active)
  }

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

  command (sysVersion: number): string | undefined {
    return this.writers.map((writer: Writer) => writer.sysVersion()).join(';')
  }

  private collect (func: any): Array<any> {
    // @ts-ignore
    return this.writers.map(func).reduce((memo, items) => (memo.concat(items)), [])
  }
}
