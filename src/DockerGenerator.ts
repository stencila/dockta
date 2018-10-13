import {SoftwareEnvironment} from './context'

/**
 * Generates a Dockerfile for a `SoftwareEnvironment` instance
 */
export default class DockerGenerator {

  /**
   * Generate a Dockerfile for a `SoftwareEnvironment` instance
   * 
   * @param environ The `SoftwareEnvironment` to generate a Dockerfile for
   * @param dir The directory to cache generated `.Dockerfile` to
   */
  generate (environ: SoftwareEnvironment, dir?: string): string {
    let dockerfile = ''

    const sysVersion = 18.04
    dockerfile += `
FROM ubuntu:${sysVersion}
`

    const aptRepos: Array<string> = []
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

    let aptPackages: Array<string> = []
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
    const copyFiles: Array<string> = []
    if (copyFiles.length) {
      dockerfile += `
COPY ${copyFiles.join(' ')} .
`
    }

    // Run installation instructions
    const installPackages: Array<string> = []
    if (installPackages.length) {
      dockerfile += `
RUN ${installPackages.join(' \\\n    ')}
`
    }

    // Add any CMD
    const command = null
    if (command) {
      dockerfile += `
CMD ${command}
`
    }

    return dockerfile
  }

}
