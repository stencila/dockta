import fs from 'fs'
import path from 'path'

export default class Writer {

  /**
   * Filesystem path to the source files for the image
   */
  private path: string

  /**
   * Is this builder active?
   *
   * A builder is only active it determines that it
   * applies to the images source files e.g. by filename matching
   */
  readonly active: boolean = false

  constructor (path: string) {
    this.path = path

    for (let path of this.matchPaths()) {
      if (this.exists(path)) {
        this.active = true
        break
      }
    }
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.path, subpath))
  }

  read (subpath: string): string {
    return fs.readFileSync(path.join(this.path, subpath), 'utf8')
  }

  /**
   * Build a Dockerfile
   */
  dockerfile (): string {
    let dockerfile = ''

    const sysVersion = this.sysVersion()

    dockerfile += `
FROM ubuntu:${sysVersion}
`

    const aptRepos = this.aptRepos(sysVersion)
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

    let aptPackages = this.aptPackages(sysVersion)
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

    // Add Dockter special comment for managed builds
    dockerfile += `
# dockter
`

    // Copy any files over
    // Use COPY instead of ADD since the latter can add a file from a URL so is
    // not reproducible
    const copyFiles = this.copyFiles(sysVersion)
    if (copyFiles) {
      dockerfile += `
COPY ${copyFiles.join(' ')} .
`
    }

    // Run installation instructions
    const installPackages = this.installPackages(sysVersion)
    if (this.installPackages) {
      dockerfile += `
RUN ${installPackages.join(' \\\n    ')}
`
    }

    // Add any CMD
    const command = this.command(sysVersion)
    if (command) {
      dockerfile += `
CMD ${command}
`
    }

    return dockerfile
  }

  // Methods that are overridden in derived classes

  matchPaths (): Array<string> {
    return []
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
    return ['.']
  }

  command (sysVersion: number): string | undefined {
    return
  }
}
