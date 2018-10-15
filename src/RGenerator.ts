import Generator from './Generator'

/**
 * A Dockerfile generator for R environments
 */
export default class RGenerator extends Generator {

  // Methods that override those in `Generator`

  appliesRuntime (): string {
    return 'R'
  }

  sysVersion (): number {
    // At time of writing, MRAN did not have an ubuntu:18.04(bionic) repo which supported R 3.4 (only bionic_3.5)
    // See https://cran.microsoft.com/snapshot/2018-10-05/bin/linux/ubuntu/
    // So require ubuntu:16.04(xenial).
    return 16.04
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    // TODO if no date, then use cran
    const sysVersionName = this.sysVersionName(sysVersion)
    const date = this.environ.datePublished
    return [
      [
        `deb https://mran.microsoft.com/snapshot/${date}/bin/linux/ubuntu ${sysVersionName}/`,
        '51716619E084DAB9'
      ]
    ]
  }

  aptPackages (sysVersion: number): Array<string> {
    return ['r-base']
  }

  /*

  TODO: reimplement these based on environment

  installPackages (sysVersion: number): Array<string> {
    // If there is an `install.R` file in the path then use that
    // otherwise use special `install.R` which reads from `DESCRIPTION`
    return ['Rscript install.R']
  }

  copyFiles (sysVersion: number): Array<string> {
    return ['.']
  }

  command (sysVersion: number): string | undefined {
    return 'Rscript cmd.R'
  }

  */
}
