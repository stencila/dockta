import fs from 'fs'
import glob from 'fast-glob'
import got from 'got'
import persist from 'node-persist'
import path from 'path'
import tmp from 'tmp'

import { PermissionError, NetworkError } from './errors'

export const REQUEST_CACHE_DIR = '/tmp/dockter-request-cache'
let REQUEST_CACHE_INITIALISED = false

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

  /**
   * Does a path exist within the project folder?
   *
   * @param subpath The path within the folder
   */
  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.folder, subpath))
  }

  /**
   * Get a list of paths that match a pattern in the project folder.
   *
   * @param pattern The glob pattern
   */
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

  /**
   * Read a file within the project folder
   *
   * @param subpath The path within the folder
   */
  read (subpath: string): string {
    return fs.readFileSync(path.join(this.folder, subpath), 'utf8')
  }

  /**
   * Write to a file within the project folder
   *
   * @param subpath The path within the folder
   * @param content The content to write to the file
   */
  write (subpath: string, content: string) {
    fs.writeFileSync(path.join(this.folder, subpath), content, 'utf8')
  }

  /**
   * Fetch content from a URL
   *
   * @param url The URL to fetch
   * @param options Request options
   */
  async fetch (url: string, options: any = { json: true }): Promise<any> {
    if (!REQUEST_CACHE_INITIALISED) {
      await persist.init({
        dir: REQUEST_CACHE_DIR,
        ttl: 60 * 60 * 1000 // Milliseconds to cache responses for
      })
      REQUEST_CACHE_INITIALISED = true
    }

    let value
    try {
      value = false // await persist.getItem(url)
    } catch (error) {
      if (error.message.includes('does not look like a valid storage file')) {
        // It seems that `persist.setItem` is not atomic and that the storage file can
        // have zero bytes when we make multiple requests, some of which are for the same
        // url. So we ignore this error and continue with the duplicate request.
      } else {
        throw error
      }
    }

    if (!value) {
      try {
        const response = await got(url, options)
        value = response.body
      } catch (error) {
        if (error.statusCode === 404) {
          value = null
        } else if (['ENOTFOUND', 'EAI_AGAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(error.code)) {
          // These are usually connection errors
          throw new NetworkError(`There was a problem fetching ${url} (${error.code}). Are you connected to the internet?`)
        } else {
          throw error
        }
      }
      await persist.setItem(url, value)
    }
    return value
  }
}
