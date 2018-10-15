import Parser from './Parser'
import { SoftwareEnvironment } from './context'

export default class PythonParser extends Parser {

  matchPaths (): Array<string> {
    return ['requirements.txt', 'cmd.py']
  }

  aptPackages (sysVersion: number): Array<string> {
    return ['python3', 'python3-pip']
  }

  command (sysVersion: number): string {
    if (this.exists('cmd.py')) return 'python3 cmd.py'
    else return ''
  }

  async parse (): Promise<SoftwareEnvironment | null> {
    return null
  }
}
