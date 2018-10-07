import Builder from './Builder'
import PythonBuilder from './PythonBuilder'
import RBuilder from './RBuilder'

export default class SuperBuilder extends Builder {

  protected builders: Array<Builder>

  constructor (path: string) {
    super(path)

    this.builders = [
      new PythonBuilder(path),
      new RBuilder(path)
    ].filter(builder => builder.active)
  }

  sysVersion (): number {
    return Math.min(...this.builders.map(builder => builder.sysVersion()))
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    return this.collect((builder: Builder) => builder.aptRepos(sysVersion))
  }

  aptPackages (sysVersion: number): Array<string> {
    return this.collect((builder: Builder) => builder.aptPackages(sysVersion))
  }

  copyFiles (sysVersion: number): Array<string> {
    return this.collect((builder: Builder) => builder.copyFiles(sysVersion))
  }

  command (sysVersion: number): string | undefined {
    return this.builders.map((builder: Builder) => builder.sysVersion()).join(';')
  }

  private collect (func: any): Array<any> {
    // @ts-ignore
    return this.builders.map(func).reduce((memo, items) => (memo.concat(items)), [])
  }
}
