import { SoftwarePackage } from '@stencila/schema'

import PackageGenerator from './PackageGenerator'
import IUrlFetcher from './IUrlFetcher'

const PACKAGE_JSON_GENERATED = '.package.json'
const PACKAGE_JSON = 'package.json'

/**
 * A Dockerfile generator for Javascript projects
 */
export default class JavascriptGenerator extends PackageGenerator {
  /**
   * The major version of Node.js to use.
   *
   * Defaults to the latest LTS release
   */
  nodeMajorVersion: number

  // Methods that override those in `Generator`

  constructor(
    urlFetcher: IUrlFetcher,
    pkg: SoftwarePackage,
    folder?: string,
    nodeMajorVersion = 12
  ) {
    super(urlFetcher, pkg, folder)

    this.nodeMajorVersion = nodeMajorVersion
  }

  applies(): boolean {
    return this.package.runtimePlatform === 'Node.js'
  }

  aptKeysCommand(sysVersion: string) {
    return 'curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -'
  }

  aptRepos(sysVersion: string): Array<string> {
    const baseVersionName = this.baseVersionName(sysVersion)
    return [
      `deb https://deb.nodesource.com/node_${this.nodeMajorVersion}.x ${baseVersionName} main`
    ]
  }

  aptPackages(sysVersion: string): Array<string> {
    return ['nodejs']
  }

  stencilaInstall(sysVersion: string): string | undefined {
    return `npm install stencila-node@0.28.15 \\
 && node -e "require('stencila-node').register()"`
  }

  installFiles(sysVersion: string): Array<[string, string]> {
    // Use any existing 'package.json'
    if (this.exists(PACKAGE_JSON)) return [[PACKAGE_JSON, PACKAGE_JSON]]

    // Generate a `.package.json` file to copy into image
    const dependencies: any = {}
    for (const dependency of this.filterPackages('Node.js')) {
      dependencies[dependency.name] = dependency.version
    }
    const pkgjson = {
      name: this.package.name || 'unnamed',
      dependencies
    }
    this.write(PACKAGE_JSON_GENERATED, JSON.stringify(pkgjson, null, ' '))
    return [[PACKAGE_JSON_GENERATED, PACKAGE_JSON]]
  }

  installCommand(sysVersion: string): string | undefined {
    return 'npm install package.json'
  }

  projectFiles(): Array<[string, string]> {
    const files = this.glob('**/*.js')
    return files.map(file => [file, file]) as Array<[string, string]>
  }

  runCommand(): string | undefined {
    if (this.exists('main.js')) return `node main.js`
  }
}
