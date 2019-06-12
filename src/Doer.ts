import fs from 'fs'
import glob from 'fast-glob'
import path from 'path'
import tmp from 'tmp'

import { PermissionError } from './errors'
import IUrlFetcher from './IUrlFetcher'

/**
 * A utility base class for the `Parser` and `Generator` classes
 * providing a convenient interface to a filesystem folder and HTTP requests
 */
export default abstract class Doer {

  /**
   * The directory to scan for relevant files
   */
  folder: string

  /**
   * The instance of IUrlFetcher to fetch URLs
   */
  protected readonly urlFetcher: IUrlFetcher

  constructor (urlFetcher: IUrlFetcher, folder: string | undefined) {
    if (!folder) folder = tmp.dirSync().name
    this.folder = folder
    this.urlFetcher = urlFetcher
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
            `You do no have permission to access the whole of folder "${this.folder}". Are you sure you want Dockta to compile this folder?`
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
    return this.urlFetcher.fetchUrl(url, options)
  }
}
