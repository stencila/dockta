import { SoftwareSourceCode } from './context'

export default class Compiler {
  /**
   * Load a `SoftwareSourceCode` node from an external content string
   *
   * @param content The content to load
   * @param type The type of content
   */
  load (content: string, type: string = 'Dockerfile'): SoftwareSourceCode {
    return {
      programmingLanguage: 'Dockerfile'
    }
  }
}
