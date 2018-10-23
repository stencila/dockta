import path from 'path'

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
    const environ = new SoftwareEnvironment()

    let name
    let version
    let date: Date | undefined = undefined
    let packages: Array<string> = []

    if (this.exists('DESCRIPTION')) {
      // Read the existing/generated DESCRIPTION file
      let desc = this.read('DESCRIPTION')

      // Get `name`
      const matchName = desc.match(/^Package:\s*(.+)/m)
      if (matchName) {
        name = matchName[1]
      }

      // Get `date`, if no date then use yesterday's date to ensure
      // packages are available on MRAN
      const matchDate = desc.match(/^Date:\s*(.+)/m)
      if (matchDate) {
        let dateNum = Date.parse(matchDate[1])
        if (isNaN(dateNum)) {
          throw new Error('Unable to parse date in DESCRIPTION file: ' + matchDate[1])
        } else {
          date = new Date(dateNum)
        }
      }

      // Get dependencies
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
          } else {
            pkg = imported.trim()
          }
          if (pkg.length) packages.push(pkg)
        }
      }
    } else {
      // Scan the directory for any R or Rmd files
      const files = this.glob(['**/*.R', '**/*.Rmd'])
      if (files.length) {
        // Analyse files for `library(<pkg>)`, `require(<pkg>)`, `<pkg>::<member>`, `<pkg>:::<member>`
        // Wondering WTF this regex does? See https://regex101.com/r/hG4iij/4
        const regex = /(?:(?:library|require)\s*\(\s*(?:(?:\s*(\w+)\s*)|(?:"([^"]*)")|(?:'([^']*)'))\s*\))|(?:(\w+):::?\w+)/g
        for (let file of files) {
          let code = this.read(file)
          let match = regex.exec(code)
          while (match) {
            const pkg = match[1] || match[2] || match[3] || match[4]
            if (!packages.includes(pkg)) packages.push(pkg)
            match = regex.exec(code)
          }
        }
        packages.sort()
      } else {
        // If no R files detected, return null
        return null
      }
    }

    // Default to the folder name, with any non alphanumerics removed to ensure compatability
    // with R package name requirements
    if (!name) name = path.basename(this.folder).replace(/[^a-zA-Z0-9]/g, '')
    // Default to yesterday's date (to ensure MRAN is available for the date)
    if (!date) date = new Date(Date.now() - 24 * 3600 * 1000)

    // Set environs properties
    environ.name = name
    // environ.version = version
    environ.datePublished = date.toISOString().substring(0,10)

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
      if (crandb.URL) pkg.urls = crandb.URL.split(',')

      // schema:CreativeWork
      // pkg.headline = crandb.Title TODO
      if (crandb.Author) {
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
      }
      pkg.datePublished = crandb['Date/Publication']
      pkg.license = crandb.License // TODO parse license string into a URL or CreativeWork

      // schema:SoftwareSourceCode
      pkg.runtimePlatform = 'R'
      if (crandb.URL) pkg.codeRepository = crandb.URL.split(',') // TODO only use URLS which point to a repo e.g. github.com

      // stencila:SoftwarePackage
      // Required R packages are added as `softwareRequirements` with
      // `programmingLanguage` set to R
      if (crandb.Imports) {
        for (let [name, version] of Object.entries(crandb.Imports)) {
          const required = new SoftwarePackage()
          required.name = name
          required.runtimePlatform = 'R'
          pkg.softwareRequirementsPush(required)
        }
      }
      // Required system dependencies are obtained from https://sysreqs.r-hub.io and
      // added as `softwareRequirements` with "deb" `runtimePlatform`
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
          required.runtimePlatform = 'deb'
          pkg.softwareRequirementsPush(required)
        }
      }

      return pkg
    }))

    return environ
  }
}
