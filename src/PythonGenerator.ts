import Generator from './Generator'
import { ComputerLanguage } from './context'

/**
 * A Dockerfile generator for Python environments
 */
export default class PythonGenerator extends Generator {

  // Methods that override those in `Generator`

  appliesRuntime (): string {
    return 'Python'
  }

  aptPackages (sysVersion: number): Array<string> {
    return ['python3', 'python3-pip']
  }

}
