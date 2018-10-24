import fs from 'fs'
import glob from 'fast-glob'
// @ts-ignore
import cachedRequest from 'cached-request'
import path from 'path'
import request from 'request'
import tmp from 'tmp'

import {PermissionError} from './errors'

const requestCache = cachedRequest(request)
requestCache.setCacheDirectory('/tmp/dockter-request-cache')

/**
 * A utility base class for the `Parser` and `Generator` classes
 * providing a convenient interface to a filesystem folder and HTTP requests
 */
export default abstract class Doer {

  /**
   * The directory to scan for relevant files
   */
  folder: string

  constructor (folder: string | undefined) {
    if (!folder) folder = tmp.dirSync().name
    this.folder = folder
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.folder, subpath))
  }

  glob (pattern: string | Array<string>): Array<string> {
    try {
      return glob.sync(pattern, {
        cwd: this.folder
      })
    } catch (error) {
      if (error.code === 'EACCES') {
        throw new PermissionError(
          `You do no have permission to access the whole of folder "${this.folder}". Are you sure this is the right folder?`
        )
      }
      else throw error
    }
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
