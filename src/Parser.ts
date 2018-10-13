import fs from 'fs'
import path from 'path'

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
export default class Parser {

  /**
   * The directory to scan for relevant files
   */
  private folder: string

  /**
   * Is this parser active?
   *
   * Each parser class decides if it is active by matching
   * paths within the folder
   */
  readonly active: boolean = false

  constructor (folder: string) {
    this.folder = folder

    for (let path of this.matchPaths()) {
      if (this.exists(path)) {
        this.active = true
        break
      }
    }
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.folder, subpath))
  }

  read (subpath: string): string {
    return fs.readFileSync(path.join(this.folder, subpath), 'utf8')
  }

}
