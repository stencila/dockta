import path from 'path'

import Parser from './Parser'
import { SoftwarePackage, Person } from '@stencila/schema'

/**
 * Dockta `Parser` class for R requirements files and source code.
 *
 * For each package, meta-data is obtained from http://crandb.r-pkg.org and used to create a `SoftwarePackage` instance
 * using crosswalks from column "R Package Description" in https://github.com/codemeta/codemeta/blob/master/crosswalk.csv
 *
 * System dependencies for each package are obtained from https://sysreqs.r-hub.io.
 */
export default class RParser extends Parser {
  /**
   * Parse a folder by detecting any R requirements or source code files
   * and return a `SoftwarePackage` instance
   */
  async parse(): Promise<SoftwarePackage | null> {
    const pkg = new SoftwarePackage()

    let name
    let version
    let date: Date | undefined
    const packages: Array<string> = []

    if (this.exists('DESCRIPTION')) {
      // Read the existing/generated DESCRIPTION file
      const desc = this.read('DESCRIPTION')

      // Get `name`
      const matchName = desc.match(/^Package:\s*(.+)/m)
      if (matchName) {
        name = matchName[1]
      }

      // Get `date`, if no date then use yesterday's date to ensure
      // packages are available on MRAN
      const matchDate = desc.match(/^Date:\s*(.+)/m)
      if (matchDate) {
        const dateNum = Date.parse(matchDate[1])
        if (isNaN(dateNum)) {
          throw new Error(
            'Unable to parse date in DESCRIPTION file: ' + matchDate[1]
          )
        } else {
          date = new Date(dateNum)
        }
      }

      // Get dependencies
      const start = /^Imports:[ \t]*\n/gm.exec(desc)
      if (start) {
        // Find next un-indented line or use end of string
        const match = desc
          .substring(start.index + start[0].length)
          .match(/\n^\w/m)
        let end
        if (match) end = match.index
        else end = desc.length - 1
        const imports = desc.substring(start.index + start[0].length, end)
        for (const imported of imports.split(',')) {
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
      const files = this.glob(['**/*.R', '**/*.r', '**/*.Rmd', '**/*.rmd'])
      if (files.length) {
        // Analyse files for `library(<pkg>)`, `require(<pkg>)`, `<pkg>::<member>`, `<pkg>:::<member>`
        // Wondering WTF this regex does? See https://regex101.com/r/hG4iij/4
        const regex = /(?:(?:library|require)\s*\(\s*(?:(?:\s*(\w+)\s*)|(?:"([^"]*)")|(?:'([^']*)'))\s*\))|(?:(\w+):::?\w+)/g
        for (const file of files) {
          const code = this.read(file)
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

    // Default to the folder name, with any non alphanumerics removed to ensure compatibility
    // with R package name requirements
    if (!name) name = path.basename(this.folder).replace(/[^a-zA-Z0-9]/g, '')
    // Default to yesterday's date (to ensure MRAN is available for the date)
    if (!date) date = new Date(Date.now() - 24 * 3600 * 1000)

    // Set package properties
    pkg.name = name
    pkg.runtimePlatform = 'R'
    pkg.datePublished = date.toISOString().substring(0, 10)

    // For each dependency, query https://crandb.r-pkg.org to get a manifest including it's own
    // dependencies and convert it to a `SoftwarePackage`
    pkg.softwareRequirements = await Promise.all(
      packages.map((name) => this.createPackage(name))
    )

    return pkg
  }

  /**
   * Create a `SoftwarePackage` instance from a R package name
   *
   * This method fetches meta-data for a R package to populate the properties
   * of a `SoftwarePackage` instance. It recursively fetches meta-data on the package's
   * dependencies, including system dependencies.
   *
   * @param name Name of the R package
   */
  private async createPackage(name: string): Promise<SoftwarePackage> {
    // Create new package instance and populate it's
    // properties in order of type hierarchy:
    //   Thing > CreativeWork > SoftwareSourceCode > SoftwarePackage
    const pkg = new SoftwarePackage()
    pkg.name = name

    // These packages are built-in to R distributions, so we don't need to collect
    // meta-data for them.
    if (
      [
        'stats',
        'graphics',
        'grDevices',
        'tools',
        'utils',
        'datasets',
        'methods',
      ].includes(name)
    ) {
      return pkg
    }

    // Fetch meta-data from CRANDB
    // If null (i.e. 404) then return package as is
    const crandb = await this.fetch(`http://crandb.r-pkg.org/${name}`)
    if (crandb === null) return pkg

    // schema:Thing
    pkg.description = crandb.Description
    if (crandb.URL) pkg.urls = crandb.URL.split(',')

    // schema:CreativeWork
    if (crandb.Author) {
      crandb.Author.split(',\n').map((author: string) => {
        const match = author.match(/^([^[]+?) \[([^\]]+)\]/)
        if (match) {
          const name = match[1]
          const person = Person.fromText(name)
          const roles = match[2].split(', ')
          if (roles.includes('aut')) pkg.authors.push(person)
          if (roles.includes('ctb')) pkg.contributors.push(person)
          if (roles.includes('cre')) pkg.creators.push(person)
        } else {
          pkg.authors.push(Person.fromText(author))
        }
      })
    }
    pkg.datePublished = crandb['Date/Publication']
    pkg.license = crandb.License

    // schema:SoftwareSourceCode
    pkg.runtimePlatform = 'R'
    if (crandb.URL) pkg.codeRepository = crandb.URL.split(',') // See issue #35

    // stencila:SoftwarePackage
    // Create `SoftwarePackage` for each dependency
    if (crandb.Imports) {
      pkg.softwareRequirements = await Promise.all(
        Object.entries(crandb.Imports).map(([name, version]) =>
          this.createPackage(name)
        )
      )
    }

    // Required system dependencies are obtained from https://sysreqs.r-hub.io and
    // added as `softwareRequirements` with "deb" as `runtimePlatform`
    const sysreqs = await this.fetch(`https://sysreqs.r-hub.io/pkg/${name}`)

    for (const sysreq of sysreqs) {
      const keys = Object.keys(sysreq)
      if (keys.length > 1)
        throw new Error(
          `Expected on one key for each sysreq but got: ${keys.join(',')}`
        )
      const name = keys[0]
      const debPackage = sysreq[name].platforms?.DEB
      // The deb package can be null e.g. `curl https://sysreqs.r-hub.io/pkg/lubridate`
      if (typeof debPackage === 'string') {
        // Handle strings e.g. curl https://sysreqs.r-hub.io/pkg/XML
        const required = new SoftwarePackage()
        required.name = debPackage
        required.runtimePlatform = 'deb'
        pkg.softwareRequirements.push(required)
      } else if (Array.isArray(debPackage)) {
        // Handle arrays e.g. curl https://sysreqs.r-hub.io/pkg/gsl
        for (const deb of debPackage.filter(
          (deb) => deb.distribution === 'Ubuntu' && deb.releases === undefined
        )) {
          if (deb.buildtime) {
            const required = new SoftwarePackage()
            required.name = deb.buildtime
            required.runtimePlatform = 'deb'
            pkg.softwareRequirements.push(required)
          }
          if (deb.runtime) {
            const required = new SoftwarePackage()
            required.name = deb.runtime
            required.runtimePlatform = 'deb'
            pkg.softwareRequirements.push(required)
          }
        }
      }
    }

    return pkg
  }
}
