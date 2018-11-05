import { SoftwarePackage } from '@stencila/schema'

import Generator from './Generator'

export default class PackageGenerator extends Generator {

  package: SoftwarePackage

  constructor (pkg: SoftwarePackage, folder?: string) {
    super(folder)
    this.package = pkg
  }

  /**
   * Get a list of packages in `this.package.softwareRequirements`
   * which have have a particular `runtimePlatform` value
   */
  filterPackages (runtimePlatform: string): Array<SoftwarePackage> {
    if (this.package.softwareRequirements) {
      return this.package.softwareRequirements
          .filter(req => (req as SoftwarePackage).runtimePlatform === runtimePlatform)
          .map(req => req as SoftwarePackage)
    }
    return []
  }

}
