import { SoftwarePackage } from '@stencila/schema'

import Generator from './Generator'

export default class PackageGenerator extends Generator {

  package: SoftwarePackage

  constructor (pkg: SoftwarePackage, folder?: string) {
    super(folder)
    this.package = pkg
  }

}
