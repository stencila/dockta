import fs from 'fs'
import path from 'path'
import request from 'request'
// @ts-ignore
import cachedRequest from 'cached-request'

import { SoftwareEnvironment } from './context'

const requestCache = cachedRequest(request)
requestCache.setCacheDirectory('/tmp/dockter-request-cache')

/**
 * A base class for language parsers
 *
 * A language `Parser` generates a JSON-LD `SoftwareApplication` instance based on the
 * contents of a directory. It is responsible for determining which packages the application
 * needs, resolving the dependencies of those packages (both system and language packages) and
 * turning those into a JSON-LD `SoftwareApplication` instance.
 *
 * If the `Parser` finds a corresponding requirements file for the language (e.g. `requirements.txt` for Python),
 * then it uses that to determine the language packages to install. If no requirements file is found,
 * it scans for source code files for package import statements (e.g. `library(package)` in `.R` files),
 * generates a package list from those statements and creates a requirements file.
 */
export default abstract class Parser {

  /**
   * The directory to scan for relevant files
   */
  private folder: string

  constructor (folder: string) {
    this.folder = folder
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.folder, subpath))
  }

  read (subpath: string): string {
    return fs.readFileSync(path.join(this.folder, subpath), 'utf8')
  }

  fetch (url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      requestCache({
        url,
        json: true,
        ttl: 60 * 60 * 1000 // Milliseconds to cache responses for
      }, (error: Error, response: any, body: any) => {
        if (error) return reject(error)
        resolve(body)
      })
    })
  }

  abstract async parse (): Promise<SoftwareEnvironment | null>

}
