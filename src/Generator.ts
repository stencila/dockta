import { SoftwareEnvironment, SoftwarePackage } from './context'

/**
 * Generates a Dockerfile for a `SoftwareEnvironment` instance
 */
export default class Generator {

  environ: SoftwareEnvironment

  constructor (environ: SoftwareEnvironment) {
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
    dockerfile += `FROM ubuntu:${sysVersion}
`

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
        dockerfile += `
RUN apt-add-repository "${deb}"${key ? ` \\\n && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ${key}` : ''}
`
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

    const copyFiles: Array<string> = this.copyFiles(sysVersion)
    const installPackages: Array<string> = this.installPackages(sysVersion)
    const command = this.command(sysVersion)

    if (copyFiles.length || installPackages.length || command) {
      // Add Dockter special comment for managed builds
      dockerfile += `
# dockter
`
    }

    // Copy any files over
    // Use COPY instead of ADD since the latter can add a file from a URL so is
    // not reproducible
    if (copyFiles.length) {
      dockerfile += `
COPY ${copyFiles.join(' ')} .
`
    }

    // Run installation instructions
    if (installPackages.length) {
      dockerfile += `
RUN ${installPackages.join(' \\\n    ')}
`
    }

    // Add any CMD
    if (command) {
      dockerfile += `
CMD ${command}
`
    }

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

  installPackages (sysVersion: number): Array<string> {
    return []
  }

  copyFiles (sysVersion: number): Array<string> {
    return []
  }

  command (sysVersion: number): string | undefined {
    return
  }
}
