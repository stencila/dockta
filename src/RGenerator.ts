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

  installFiles (sysVersion: number): Array<[string, string]> {
    if (this.exists('install.R')) return [['install.R', '.']]
    if (this.exists('DESCRIPTION')) return [['DESCRIPTION', '.']]

    // TODO Generate a '.DESCRIPTION' file from the environ
    this.write('.DESCRIPTION',`Package: project
Version: 1.0.0
Date: 2018-10-17
Imports:
  digest
`)
    return [['.DESCRIPTION', 'DESCRIPTION']]

    // Return empty array if no R packages
    return []
  }

  installCommand (sysVersion: number): string | undefined {
    if (this.exists('install.R')) {
      return `Rscript install.R`
    } else if (this.exists('DESCRIPTION') || this.exists('.DESCRIPTION')) {
      // To keep the Dockerfile as simple as possible, get and
      // execute the installation-from-DESCRIPTION script.
      //
      // During development you might want to test this by starting a static files
      // server in this repo's directory e.g.
      //   python -m SimpleHTTPServer 8000
      // and then changing the url to
      //   http://localhost:8000/src/install.R

      const url = 'http://localhost:8000/src/install.R'
      // const url = 'https://stencila.github.io/dockter/install.R'
      return `Rscript <(curl -s ${url})`
    }
  }
}
