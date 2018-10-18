import fs from 'fs'
import glob from 'fast-glob'
// @ts-ignore
import cachedRequest from 'cached-request'
import path from 'path'
import request from 'request'
import tmp from 'tmp'

const requestCache = cachedRequest(request)
requestCache.setCacheDirectory('/tmp/dockter-request-cache')

/**
 * A utility base call which provides a convient interface to
 * a filesystem folder and hTTP requests
 * for the `Parser` and `Generator` classes
 */
export default abstract class Doer {

  /**
   * The directory to scan for relevant files
   */
  private folder: string

  constructor (folder: string | undefined) {
    if (!folder) folder = tmp.dirSync().name
    this.folder = folder
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.folder, subpath))
  }

  glob (pattern: string | Array<string>): Array<string> {
    return glob.sync(pattern, {
      cwd: this.folder
    })
  }

  read (subpath: string): string {
    return fs.readFileSync(path.join(this.folder, subpath), 'utf8')
  }

  write (subpath: string, content: string) {
    fs.writeFileSync(path.join(this.folder, subpath), content, 'utf8')
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
}
