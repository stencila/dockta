import { SoftwarePackage } from '@stencila/schema'

import Generator from './Generator'
import UrlFetcher from './IUrlFetcher'

/**
 * Generates a Dockerfile for a `SoftwarePackage` instance
 */
export default class PackageGenerator extends Generator {
  /**
   * The package that this generator generates a Dockerfile for
   */
  package: SoftwarePackage

  constructor(urlFetcher: UrlFetcher, pkg: SoftwarePackage, folder?: string) {
    super(urlFetcher, folder)
    this.package = pkg
  }

  /**
   * Get a list of packages in `this.package.softwareRequirements`
   * which have have a particular `runtimePlatform` value
   */
  filterPackages(runtimePlatform: string): Array<SoftwarePackage> {
    if (this.package.softwareRequirements) {
      return this.package.softwareRequirements
        .filter(
          req => (req as SoftwarePackage).runtimePlatform === runtimePlatform
        )
        .map(req => req as SoftwarePackage)
    }
    return []
  }
}
