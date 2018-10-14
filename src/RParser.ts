import Parser from './Parser'
import { ComputerLanguage, SoftwarePackage, SoftwareEnvironment, push, Person } from './context'

/**
 * Dockter `Parser` class for R requirements files and source code.
 * 
 * For each package, we get meta-data from http://crandb.r-pkg.org.
 * System dependencies for each package are obtained from https://sysreqs.r-hub.io/pkg/xml2.
 *
 * Create a `SoftwarePackage` instance to respresent each package
 * using crosswalks from column "R Package Description" in https://github.com/codemeta/codemeta/blob/master/crosswalk.csv
 */
export default class RParser extends Parser {

  /**
   * Parse a folder by detecting any R requirements or souce code files
   * and return a `SoftwareEnvironment` instance
   */
  async parse (): Promise<SoftwareEnvironment | null> {
    // Read DESCRIPTION file if it exists
    let desc = ''
    if (this.exists('DESCRIPTION')) {
      desc = this.read('DESCRIPTION')
    }

    // TODO Create a `.DESCRIPTION` file by scanning .R and .Rmd files

    // If no R files detected, return empty environments
    if (!desc) return null

    const environ = new SoftwareEnvironment()

    // Get `name`
    const matchName = desc.match(/^Package:\s*(.+)/m)
    if (matchName) {
      environ.name = matchName[1]
    }

    // Get `date`, if no date then use yesterday's date to ensure
    // packages are available on MRAN
    let date
    const matchDate = desc.match(/^Date:\s*(.+)/m)
    if (matchDate) {
      date = Date.parse(matchDate[1])
      if (isNaN(date)) {
        throw new Error('Unable to parse date in DESCRIPTION file: ' + matchDate[1])
      } else {
        date = new Date(date)
      }
    }
    if (!date) date = new Date(Date.now() - 24 * 3600 * 1000)
    environ.datePublished = date.toISOString().substring(0,10)

    // Get dependencies
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

    // For each dependency, query https://crandb.r-pkg.org to get a manifest including it's own
    // dependencies and convert it to a `SoftwarePackage`
    environ.softwareRequirements = await Promise.all(packages.map(async name => {
      const crandb = await this.fetch(`http://crandb.r-pkg.org/${name}`)
 
      // Create new package instance and populate it's
      // properties in order of type heirarchy:
      //   Thing > CreativeWork > SoftwareSourceCode > SoftwarePackage
      const pkg = new SoftwarePackage()

      // schema:Thing
      pkg.description = crandb.Description
      pkg.name = crandb.Package
      pkg.urls = crandb.URL.split(',')
      
      // schema:CreativeWork
      // pkg.headline = crandb.Title TODO
      crandb.Author.split(',\n').map((author: string) => {
        const match = author.match(/^([^\[]+?) \[([^\]]+)\]/)
        if (match) {
          const name = match[1]
          const person = Person.fromText(name)
          const roles = match[2].split(', ')
          if (roles.includes('aut')) push(pkg, 'authors', person)
          if (roles.includes('ctb')) push(pkg, 'contributors', person)
          if (roles.includes('cre')) push(pkg, 'creators', person)
        } else {
          push(pkg, 'authors', Person.fromText(author))
        }
      })
      pkg.datePublished = crandb['Date/Publication']
      pkg.license = crandb.License // TODO parse license string into a URL or CreativeWork

      // schema:SoftwareSourceCode
      pkg.codeRepository = crandb.URL.split(',') // TODO only use URLS which point to a repo e.g. github.com

      // stencila:SoftwarePackage
      // Required R packages are added as `softwareRequirements` with
      // `programmingLanguage` set to R
      for (let [name, version] of Object.entries(crandb.Imports)) {
        const required = new SoftwarePackage()
        required.name = name
        required.programmingLanguages = [ComputerLanguage.r]
        pkg.softwareRequirements.push(required)
      }
      // Required system dependencies are obtained from https://sysreqs.r-hub.io and
      // added as `softwareRequirements` with no `programmingLanguage` 
      const sysreqs = await this.fetch(`https://sysreqs.r-hub.io/pkg/${name}`)
      for (let sysreq of sysreqs) {
        const keys = Object.keys(sysreq)
        if (keys.length > 1) throw new Error(`Expected on one key for each sysreq but got: ${keys.join(',')}`)
        const name = keys[0]
        const debPackage = sysreq[name].platforms['DEB']
        // The deb package can be null e.g. `curl https://sysreqs.r-hub.io/pkg/lubridate`
        if (debPackage) {
          const required = new SoftwarePackage()
          required.name = debPackage
          pkg.softwareRequirements.push(required)
        }
      }
      
      return pkg
    }))

    return environ
  }

  /*

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

  */
}
