import Generator from './Generator'
import { ComputerLanguage, SoftwareEnvironment } from './context'

const GENERATED_REQUIREMENTS_FILE = 'dockter-generated-requirements.txt'

/**
 * A Dockerfile generator for Python environments
 */
export default class PythonGenerator extends Generator {
  private readonly pythonMajorVersion: number

  // Methods that override those in `Generator`

  constructor (environ: SoftwareEnvironment, folder?: string, pythonMajorVersion: number = 3) {
    super(environ, folder)
    this.environ = environ
    this.pythonMajorVersion = pythonMajorVersion
  }

  /**
   * Return the `pythonMajorVersion` (as string) if it is not 2, otherwise return an empty string (if it is 2). This is
   * for appending to things like pip{3} or python{3}.
   */
  pythonVersionSuffix (): string {
    return this.pythonMajorVersion === 2 ? '' : `${this.pythonMajorVersion}`
  }

  applies (): boolean {
    return this.exists('requirements.txt') || super.applies()
  }

  appliesRuntime (): string {
    return 'Python'
  }

  aptPackages (sysVersion: string): Array<string> {
    return [`python${this.pythonVersionSuffix()}`, `python${this.pythonVersionSuffix()}-pip`]
  }

  generateRequirementsContent (): string {
    if (!this.environ.softwareRequirements) {
      return ''
    }

    return this.filterPackages('Python').map(
        requirement => requirement.identifier()
    ).join('\n')
  }

  installFiles (sysVersion: string): Array<[string, string]> {
    let requirementsContent = this.generateRequirementsContent()

    if (requirementsContent !== '') {
      this.write(GENERATED_REQUIREMENTS_FILE, requirementsContent)
      return [[GENERATED_REQUIREMENTS_FILE, '.']]
    }

    if (this.exists('requirements.txt')) {
      return [['requirements.txt', '.']]
    }

    return []
  }

  installCommand (sysVersion: string): string | undefined {
    let requirementsFileName = null

    if (this.exists(GENERATED_REQUIREMENTS_FILE)) {
      requirementsFileName = GENERATED_REQUIREMENTS_FILE
    } else if (this.exists('requirements.txt')) {
      requirementsFileName = 'requirements.txt'
    }

    if (requirementsFileName !== null) {
      return `pip${this.pythonVersionSuffix()} install -r ${requirementsFileName}`
    }
  }

  /**
   * The files to copy into the Docker image
   *
   * Copies all `*.py` files to the container
   */
  projectFiles (): Array<[string, string]> {
    const pyFiles = this.glob('**/*.py')
    return pyFiles.map(file => [file, file]) as Array<[string, string]>
  }

  /**
   * The command to execute in a container created from the Docker image
   *
   * If there is a top-level `main.py` or `cmd.py` then that will be used,
   * otherwise, the first `*.R` files by alphabetical order will be used.
   */
  runCommand (): string | undefined {
    const pyFiles = this.glob('**/*.py')
    if (pyFiles.length === 0) return
    let script
    if (pyFiles.includes('main.py')) script = 'main.py'
    else if (pyFiles.includes('cmd.py')) script = 'cmd.py'
    else script = pyFiles[0]
    return `python${this.pythonVersionSuffix()}  ${script}`
  }

}
