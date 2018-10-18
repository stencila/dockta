import Doer from './Doer'
import { SoftwareEnvironment } from './context'

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
export default abstract class Parser extends Doer {
  abstract async parse (): Promise<SoftwareEnvironment | null>
}
