import Parser from './Parser'

/**
 * A Dockerfile writer for R
 */
export default class RParser extends Parser {

  /**
   * The date to use to version R and packages
   */
  readonly date: string

  constructor (dir: string) {
    super(dir)

    // Read DESCRIPTION file if one exists
    let desc = ''
    if (this.exists('DESCRIPTION')) {
      desc = this.read('DESCRIPTION')
    }

    // TODO Create a `.DESCRIPTION` file by scanning .R and .Rmd files

    // Get `date` from DESCRIPTION file
    let date
    const match1 = desc.match(/Date:\ *(.+)/)
    if (match1) {
      date = Date.parse(match1[1])
      if (isNaN(date)) {
        throw new Error('Unable to parse date in DESCRIPTION file: ' + match1[1])
      } else {
        date = new Date(date)
      }
    }
    // If no date then use yesterday's date
    if (!date) date = new Date(Date.now() - 24 * 3600 * 1000)
    this.date = date.toISOString().substring(0,10)

    // Get package imports from the description file
    let packages = []
    const start = /^Imports:[ \t]*\n/gm.exec(desc)
    if (start) {
      // Find next unindented line or use end of string
      let match = desc.substring(start.index + start[0].length).match(/\n^\w/m)
      let end
      if (match) end = match.index
      else end = desc.length - 1
      const imports = desc.substring(start.index + start[0].length, end)
      for (let imported of imports.split(',')) {
        let pkg
        const match = imported.match(/^\s*(\w+).*/)
        if (match) {
          pkg = match[1]
        } else pkg = imported.trim()
        packages.push(pkg)
      }
    }

    // For each package, query the CRANDB to get a manifest including it's own
    // dependencies and convert it to JSON-LD
    for (let pkg of packages) {
      fetch(`http://crandb.r-pkg.org/${pkg}`).then(value => {
        console.log(value)
      })
    }
  }

  // Methods that override those in `Parser`

  matchPaths (): Array<string> {
    return ['DESCRIPTION', 'cmd.R']
  }

  sysVersion (): number {
    // At time of writing, MRAN did not have an ubuntu:bionic repo which
    // supported R 3.4 (only bionic_3.5)
    // See https://cran.microsoft.com/snapshot/2018-10-05/bin/linux/ubuntu/
    // So require xenial.
    return 16.04
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    // TODO if no date, then use cran
    const sysVersionName = this.sysVersionName(sysVersion)
    return [
      [
        `deb https://mran.microsoft.com/snapshot/${this.date}/bin/linux/ubuntu ${sysVersionName}/`,
        '51716619E084DAB9'
      ]
    ]
  }

  aptPackages (sysVersion: number): Array<string> {
    return ['r-base']
  }

  installPackages (sysVersion: number): Array<string> {
    // If there is an `install.R` file in the path then use that
    // otherwise use special `install.R` which reads from `DESCRIPTION`
    return ['Rscript install.R']
  }

  copyFiles (sysVersion: number): Array<string> {
    return ['.']
  }

  command (sysVersion: number): string | undefined {
    if (this.exists('cmd.R')) return 'Rscript cmd.R'
  }
}
