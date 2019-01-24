import { SoftwarePackage } from '@stencila/schema'
import path from 'path'

import PackageGenerator from './PackageGenerator'
import PythonSystemPackageLookup from './PythonSystemPackageLookup'
import IUrlFetcher from './IUrlFetcher'

const GENERATED_REQUIREMENTS_FILE = '.requirements.txt'

/**
 * A Dockerfile generator for Python packages
 */
export default class PythonGenerator extends PackageGenerator {
  /**
   * The Python Major version, i.e. 2 or 3
   */
  private readonly pythonMajorVersion: number

  /**
   * An instance of `PythonSystemPackageLookup` with which to look up system dependencies of Python packages
   */
  private readonly systemPackageLookup: PythonSystemPackageLookup

  // Methods that override those in `Generator`

  constructor (urlFetcher: IUrlFetcher, pkg: SoftwarePackage, folder?: string, pythonMajorVersion: number = 3) {
    super(urlFetcher, pkg, folder)

    this.pythonMajorVersion = pythonMajorVersion
    this.systemPackageLookup = PythonSystemPackageLookup.fromFile(path.join(__dirname, 'PythonSystemDependencies.json'))
  }

  /**
   * Return the `pythonMajorVersion` (as string) if it is not 2, otherwise return an empty string (if it is 2). This is
   * for appending to things like pip{3} or python{3}.
   */
  pythonVersionSuffix (): string {
    return this.pythonMajorVersion === 2 ? '' : `${this.pythonMajorVersion}`
  }

  /**
   * Check if this Generator's package applies (if it is Python).
   */
  applies (): boolean {
    return this.package.runtimePlatform === 'Python'
  }

  /**
   * Generate a list of system (apt) packages by looking up with `this.systemPackageLookup`.
   */
  aptPackages (sysVersion: string): Array<string> {
    let aptRequirements: Array<string> = []

    this.package.softwareRequirements.map(requirement => {
      aptRequirements = aptRequirements.concat(
          this.systemPackageLookup.lookupSystemPackage(
              requirement.name, this.pythonMajorVersion, 'deb', sysVersion
          )
      )
    })

    let dedupedRequirements: Array<string> = []
    aptRequirements.map(aptRequirement => {
      if (!dedupedRequirements.includes(aptRequirement)) {
        dedupedRequirements.push(aptRequirement)
      }
    })
    return [`python${this.pythonVersionSuffix()}`, `python${this.pythonVersionSuffix()}-pip`].concat(
        dedupedRequirements
    )
  }

  /**
   * Build the contents of a `requirements.txt` file by joining the Python package name to its version specifier.
   */
  generateRequirementsContent (): string {
    if (!this.package.softwareRequirements) {
      return ''
    }

    return this.filterPackages('Python').map(
        requirement => `${requirement.name}${requirement.version}`
    ).join('\n')
  }

  /**
   * Get the pip command to install the Stencila package
   */
  stencilaInstall (sysVersion: string): string | undefined {
    return `pip${this.pythonVersionSuffix()} install --no-cache-dir https://github.com/stencila/py/archive/91a05a139ac120a89fc001d9d267989f062ad374.zip`
  }

  /**
   * Write out the generated requirements content to `GENERATED_REQUIREMENTS_FILE` or none exists, just instruct the
   * copy of a `requirements.txt` file as part of the Dockerfile. If that does not exist, then no COPY should be done.
   */
  installFiles (sysVersion: string): Array<[string, string]> {
    let requirementsContent = this.generateRequirementsContent()

    if (requirementsContent !== '') {
      this.write(GENERATED_REQUIREMENTS_FILE, requirementsContent)
      return [[GENERATED_REQUIREMENTS_FILE, 'requirements.txt']]
    }

    if (this.exists('requirements.txt')) {
      return [['requirements.txt', 'requirements.txt']]
    }

    return []
  }

  /**
   * Generate the right pip command to install the requirements, appends the correct Python major version to `pip`.
   */
  installCommand (sysVersion: string): string | undefined {
    return `pip${this.pythonVersionSuffix()} install --requirement requirements.txt`
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
    return `python${this.pythonVersionSuffix()} ${script}`
  }

}
