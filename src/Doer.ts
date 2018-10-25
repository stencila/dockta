import fs from 'fs'
import glob from 'fast-glob'
// @ts-ignore
import cachedRequest from 'cached-request'
import path from 'path'
import rimraf from 'rimraf'
import request from 'request'
import tmp from 'tmp'

import { PermissionError, NetworkError, ApplicationError } from './errors'

const REQUEST_CACHE_DIR = '/tmp/dockter-request-cache'
const requestCache = cachedRequest(request)
requestCache.setCacheDirectory(REQUEST_CACHE_DIR)

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
          `You do no have permission to access the whole of folder "${this.folder}". Are you sure you want Dockter to compile this folder?`
        )
      } else throw error
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
      }, (error: any, response: any, body: any) => {
        if (error) {
          if (['ENOTFOUND', 'EAI_AGAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(error.code)) {
            // These are usually connection errors
            error = new NetworkError(`There was a problem fetching ${url} (${error.code}). Are you connected to the internet?`)
          } else if (error instanceof SyntaxError && error.message.includes(' JSON ')) {
            // We can get here if a previous attempt had a network error and resulted in corrupt
            // JSON being written to the cache. So clear the cache...
            rimraf.sync(REQUEST_CACHE_DIR)
            // Ask the user to try again
            error = new ApplicationError(`There was a problem fetching ${url}. Please try again.`)
          }
          return reject(error)
        }
        resolve(body)
      })
    })
  }
}
