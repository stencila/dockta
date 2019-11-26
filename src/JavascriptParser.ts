// @ts-ignore
import builtins from 'builtin-modules'
// @ts-ignore
import detective from 'detective'
import path from 'path'
import semver from 'semver'

import Parser from './Parser'
import { Person, SoftwarePackage } from '@stencila/schema'

/**
 * Dockta `Parser` class for Node.js.
 */
export default class JavascriptParser extends Parser {
  /**
   * Parse a folder to detect any `package.json` or `*.js` source code files
   * and return a `SoftwarePackage` instance
   */
  async parse(): Promise<SoftwarePackage | null> {
    if (this.exists('package.json')) {
      const data = JSON.parse(this.read('package.json'))
      return this.createPackage(data)
    } else {
      const files = this.glob(['**/*.js'])
      if (files.length) {
        const data = {
          name: path.basename(this.folder),
          dependencies: {}
        }
        for (const file of files) {
          const code = this.read(file)
          const requires = detective(code)
          for (const require of requires) {
            if (!builtins.includes(require)) {
              // @ts-ignore
              data.dependencies[require] = 'latest'
            }
          }
        }
        return this.createPackage(data)
      } else {
        return null
      }
    }
  }

  /**
   * Create a `SoftwarePackage` instance from a Node.js package meta-data object
   *
   * Meta-data for a packages dependencies is obtained from https://registry.npmjs.org/ using the
   * JSON API documented at https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
   * and https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md.
   * Currently we fetch the abbreviated metadata because the full meta data can be very large.
   *
   * The column "NodeJS" in https://github.com/codemeta/codemeta/blob/master/crosswalk.csv
   * is used to translate package meta-data into a `SoftwarePackage` instance.
   *
   * @param data Package object
   */
  private async createPackage(data: any): Promise<SoftwarePackage> {
    // Create new package instance and populate it's
    // properties in order of type hierarchy: Thing > CreativeWork > SoftwareSourceCode > SoftwarePackage
    const pkg = new SoftwarePackage()

    // schema:Thing
    pkg.name = data.name

    // schema:CreativeWork
    pkg.version = data.version

    // schema:SoftwareSourceCode
    pkg.runtimePlatform = 'Node.js'

    pkg.license = data.license
    pkg.description = data.description

    if (data.author) {
      if (typeof data.author === 'string') {
        pkg.authors = [Person.fromText(data.author)]
      } else {
        let authorStr = ''
        if (data.author.name) authorStr = data.author.name
        if (data.author.email) authorStr += ` <${data.author.email}>`
        if (data.author.url) authorStr += ` (${data.author.url})`

        pkg.authors = [Person.fromText(authorStr)]
      }
    }

    if (data.repository) {
      if (typeof data.repository === 'string') {
        if (data.repository.match(/github:/)) {
          pkg.codeRepository =
            data.repository.replace(/github:/, 'https://github.com') + '/'
        } else if (data.repository.match(/gitlab:/)) {
          pkg.codeRepository =
            data.repository.replace(/gitlab:/, 'https://gitlab.com') + '/'
        } else if (data.repository.match(/bitbucket:/)) {
          pkg.codeRepository =
            data.repository.replace(/bitbucket:/, 'https://bitbucket.com') + '/'
        } else if (data.repository.match(/^[^\/]*\/[^\/]*$/)) {
          pkg.codeRepository =
            data.repository.replace(
              /^([^\/]*)\/([^\/]*)$/,
              'https://www.npmjs.com/package/$1/$2'
            ) + '/'
        } else {
          pkg.codeRepository = data.repository
        }
      } else {
        pkg.codeRepository = data.repository.url
      }
    }

    // stencila:SoftwarePackage
    if (data.dependencies) {
      pkg.softwareRequirements = await Promise.all(
        Object.entries(data.dependencies).map(async ([name, versionRange]) => {
          // Determine the minimum version that satisfies the range specified in the
          // If we can't determine a minimum version from the versionRange
          // (e.g. because it's a github url) then try to get latest
          let version = 'latest'
          if (versionRange !== 'latest' && versionRange !== '*') {
            const range = semver.validRange(versionRange as string)
            if (range) {
              const match = range.match(
                /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/
              )
              if (match) version = match[0]
            }
          }

          // For scoped packages (e.g. `@types/node`) replace any slashes in the package name
          // and fetch the latest version (see https://github.com/stencila/dockta/issues/87).
          if (name.startsWith('@')) {
            name = name.replace('/', '%2f')
            version = '*'
          }

          // Fetch meta-data from NPM
          const data = await this.fetch(
            `https://registry.npmjs.org/${name}/${version}`,
            {
              json: true,
              headers: {
                Accept:
                  'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
              }
            }
          )

          if (data) {
            return this.createPackage(data)
          } else {
            // All we know is name and version, so return that
            const dependency = new SoftwarePackage()
            dependency.name = name
            dependency.version = versionRange as string
            dependency.runtimePlatform = 'Node.js'
            return dependency
          }
        })
      )
    }

    return pkg
  }
}
