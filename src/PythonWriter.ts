import Writer from './Writer'

export default class PythonWriter extends Writer {

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
}
