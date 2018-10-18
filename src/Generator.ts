import Doer from './Doer'
import { SoftwareEnvironment, SoftwarePackage } from './context'

/**
 * Generates a Dockerfile for a `SoftwareEnvironment` instance
 */
export default class Generator extends Doer {

  environ: SoftwareEnvironment

  constructor (environ: SoftwareEnvironment, folder?: string) {
    super(folder)
    this.environ = environ
  }

  /**
   * Generate a Dockerfile for a `SoftwareEnvironment` instance
   *
   * @param environ The `SoftwareEnvironment` to generate a Dockerfile for
   */
  generate (): string {
    let dockerfile = ''

    const sysVersion = this.sysVersion()
    dockerfile += `FROM ubuntu:${sysVersion}\n`

    if (!this.applies()) return dockerfile

    const aptRepos: Array<[string, string]> = this.aptRepos(sysVersion)
    if (aptRepos.length) {
      // Install system packages required for adding repos
      dockerfile += `
RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common
`

      // Add each repository and fetch signing key if defined
      for (let [deb, key] of aptRepos) {
        dockerfile += `\nRUN apt-add-repository "${deb}"${key ? ` \\\n && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ${key}` : ''}\n`
      }
    }

    let aptPackages: Array<string> = this.aptPackages(sysVersion)
    if (aptPackages.length) {
      dockerfile += `
RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      ${aptPackages.join(' \\\n      ')} \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*
`
    }

    const installFiles = this.installFiles(sysVersion)
    const installCommand = this.installCommand(sysVersion)
    const copyFiles = this.copyFiles(sysVersion)
    const command = this.command(sysVersion)

    // Add Dockter special comment for managed installation of language packages
    if (installFiles.length || installCommand) {
      dockerfile += `\n# dockter\n`
    }

    // Copy files needed for installation of language packages
    if (installFiles.length) {
      for (let [src, dest] of installFiles) {
        dockerfile += `\nCOPY ${src} ${dest}\n`
      }
    }

    // Run command to install packages
    if (installCommand) {
      dockerfile += `RUN ${installCommand}\n`
    }

    // Copy any files over
    // Use COPY instead of ADD since the latter can add a file from a URL so is
    // not reproducible
    if (copyFiles.length) {
      dockerfile += `\nCOPY ${copyFiles.join(' ')} .\n`
    }

    // Add any CMD
    if (command) {
      dockerfile += `\nCMD ${command}\n`
    }

    // Write `.Dockerfile` for use by Docker
    this.write('.Dockerfile', dockerfile)

    return dockerfile
  }

  // Methods that are overridden in derived classes

  applies (): boolean {
    if (this.environ.softwareRequirements) {
      for (let req of this.environ.softwareRequirements) {
        let pkg = req as SoftwarePackage
        if (pkg.runtimePlatform === this.appliesRuntime()) {
          return true
        }
      }
    }
    return false
  }

  appliesRuntime (): string {
    return 'deb'
  }

  sysVersion (): number {
    return 18.04
  }

  sysVersionName (sysVersion: number): string {
    const lookup: {[key: string]: string} = {
      '14.04': 'trusty',
      '16.04': 'xenial',
      '18.04': 'bionic'
    }
    return lookup[sysVersion]
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    return []
  }

  aptPackages (sysVersion: number): Array<string> {
    return []
  }

  /**
   * A list of files that need to be be copied
   * into the image before running `installCommand`
   *
   * @param sysVersion The Ubuntu system version being used
   * @returns An array of [src, dest] tuples
   */
  installFiles (sysVersion: number): Array<[string, string]> {
    return []
  }

  /**
   * The Bash command to run to install required language packages
   *
   * @param sysVersion The Ubuntu system version being used
   */
  installCommand (sysVersion: number): string | undefined {
    return
  }

  copyFiles (sysVersion: number): Array<string> {
    return []
  }

  command (sysVersion: number): string | undefined {
    return
  }
}
