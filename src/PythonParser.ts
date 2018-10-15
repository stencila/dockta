import Parser from './Parser'
import { SoftwareEnvironment } from './context'

export default class PythonParser extends Parser {

  async parse (): Promise<SoftwareEnvironment | null> {
    return null
  }
}
