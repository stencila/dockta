// @ts-ignore
import detective from 'detective'
import path from 'path'

import Parser from './Parser'
import { SoftwarePackage, Person } from '@stencila/schema'

/**
 * Dockter `Parser` class for Node.js.
 */
export default class JavascriptParser extends Parser {

  /**
   * Parse a folder to detect any `package.json` or `*.js` source code files
   * and return a `SoftwarePackage` instance
   */
  async parse (): Promise<SoftwarePackage | null> {
    if (this.exists('package.json')) {
      let data = JSON.parse(this.read('package.json'))
      return this.createPackage(data)
    } else {
      const files = this.glob(['**/*.js'])
      if (files.length) {
        const data = {
          name: path.basename(this.folder),
          dependencies: {}
        }
        for (let file of files) {
          const code = this.read(file)
          const requires = detective(code)
          for (let require of requires) {
            // @ts-ignore
            data.dependencies[require] = 'latest'
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
  private async createPackage (data: any): Promise<SoftwarePackage> {
    // Create new package instance and populate it's
    // properties in order of type hierarchy: Thing > CreativeWork > SoftwareSourceCode > SoftwarePackage
    const pkg = new SoftwarePackage()

    // TODO: populate properties based on CodeMeta crosswalk (see note above)

    // schema:Thing
    pkg.name = data.name

    // schema:CreativeWork
    pkg.version = data.version

    // schema:SoftwareSourceCode
    pkg.runtimePlatform = 'Node.js'

    // stencila:SoftwarePackage
    if (data.dependencies) {
      pkg.softwareRequirements = await Promise.all(
        Object.entries(data.dependencies).map(async ([name, version]) => {
          // TODO: handle version property. Currently using `${version}` instead of
          // `latest` in this URL fails with version like "^0.4.5".
          // Can we use the `semver` package to help here?
          const data = await this.fetch(`https://registry.npmjs.org/${name}/latest`, {
            json: true,
            headers: {
              'Accept': 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
            }
          })
          return this.createPackage(data)
        })
      )
    }

    return pkg
  }
}
