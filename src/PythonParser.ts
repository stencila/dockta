import { dirname, basename } from 'path'
import {
  ComputerLanguage,
  Person,
  SoftwarePackage,
  SoftwareSourceCode
} from '@stencila/schema'
import OperatingSystem from '@stencila/schema/dist/OperatingSystem'

import Parser from './Parser'
import { default as pythonSystemModules } from './PythonBuiltins'

const REQUIREMENTS_COMMENT_REGEX = /^\s*#/
const REQUIREMENTS_EDITABLE_SOURCE_REGEX = /^\s*-e\s*([^\s]+)\s*/
const REQUIREMENTS_INCLUDE_PATH_REGEX = /^\s*-r\s+([^\s]+)\s*/
const REQUIREMENTS_STANDARD_REGEX = /^\s*([^\s]+)/

/**
 * Return true if the passed in line is a requirements.txt comment (starts with "#" which might be preceded by spaces).
 */
function lineIsComment (line: string): boolean {
  return REQUIREMENTS_COMMENT_REGEX.exec(line) !== null
}

/**
 * Execute the given `regex` against the line and return the first match. If there is no match, return `null`.
 */
function applyRegex (line: string, regex: RegExp): string | null {
  const result = regex.exec(line)

  if (result === null) {
    return null
  }
  return result[1]
}

/**
 * Execute the `REQUIREMENTS_EDITABLE_SOURCE_REGEX` against a line and return the first result (or null if no match).
 * This is used to find a requirements.txt line of a URL source (e.g. including a package from github).
 */
function extractEditableSource (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_EDITABLE_SOURCE_REGEX)
}

/**
 * Execute the `REQUIREMENTS_INCLUDE_PATH_REGEX` against a line and return the first result (or null if no match).
 * This is used to find a requirements.txt line that includes another requirements file.
 */
function extractIncludedRequirementsPath (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_INCLUDE_PATH_REGEX)
}

/**
 * Execute the `REQUIREMENTS_STANDARD_REGEX` against a line and return the first result (or null if no match).
 * This is used to find "standard" requirements.txt lines.
 */
function extractStandardRequirements (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_STANDARD_REGEX)
}

/**
 * Split a requirement line into name and then version. For example "package==1.0.1" => ["package", "==1.0.1"]
 * The version specifier can be `==`, `<=`, `>=`, `~=`, `<` or `>`.
 */
function splitStandardRequirementVersion (requirement: string): [string, string | null] {
  let firstSplitterIndex = -1

  for (let splitter of ['==', '<=', '>=', '~=', '<', '>']) {
    let splitterIndex = requirement.indexOf(splitter)
    if (splitterIndex > -1 && (firstSplitterIndex === -1 || splitterIndex < firstSplitterIndex)) {
      firstSplitterIndex = splitterIndex
    }
  }

  if (firstSplitterIndex !== -1) {
    return [requirement.substring(0, firstSplitterIndex), requirement.substring(firstSplitterIndex)]
  }

  return [requirement, null]
}

/**
 * Convert a list of classifiers to a Map between main classification and sub classification(s).
 * e.g: ['A :: B', 'A :: C', 'D :: E'] => {'A': ['B', 'C'], 'D': ['E']}
 */
function buildClassifierMap (classifiers: Array<string>): Map<string, Array<string>> {
  const classifierMap = new Map<string, Array<string>>()

  for (let classifier of classifiers) {
    let doubleColonPosition = classifier.indexOf('::')

    let classifierKey = classifier.substring(0, doubleColonPosition).trim()
    let classifierValue = classifier.substring(doubleColonPosition + 2).trim()

    if (!classifierMap.has(classifierKey)) {
      classifierMap.set(classifierKey, [])
    }

    classifierMap.get(classifierKey)!.push(classifierValue)
  }

  return classifierMap
}

/**
 * Each PyPI "Topic" might contain multiple levels of categorisation separated by "::". E.g.
 * "Topic :: Category :: Secondary Category :: Tertiary Category". This will split into an array of strings of the same
 * length as the number of categories, i.e. ["Category", "Secondary Category", "Tertiary Category"]
 */
function splitTopic (topics: string): Array<string> {
  return topics.split('::').map(topic => topic.trim())
}

/**
 * Parse an array of PyPI formatted topics into unique lists, returns a tuple of top level and optionally second level
 * topics. This is because PyPI will repeat top level Topics in sub topics, e.g. the list might contain:
 * ["Topic :: Game", "Topic :: Game :: Arcade"] hence "Game" is defined twice.
 */
function parseTopics (topicsList: Array<string>): [Array<string>, Array<string>] {
  let primaryTopics: Array<string> = []
  let secondaryTopics: Array<string> = []

  for (let topics of topicsList) {
    let splitTopics = splitTopic(topics)
    if (splitTopics.length) {
      if (!primaryTopics.includes(splitTopics[0])) primaryTopics.push(splitTopics[0])

      if (splitTopics.length > 1) {
        if (!secondaryTopics.includes(splitTopics[1])) secondaryTopics.push(splitTopics[1])
      }
    }
  }

  return [primaryTopics, secondaryTopics]
}

/**
 * Convert a string containing an operating system name into an array of `OperatingSystem`s. In some instances the
 * description may map to multiple `OperatingSystems`, e.g. "Unix" => Linux and macOS.
 */
function parseOperatingSystem (operatingSystem: string): Array<OperatingSystem> {
  if (operatingSystem.match(/windows/i)) {
    return [OperatingSystem.windows]
  }

  if (operatingSystem.match(/unix/i)) {
    return [OperatingSystem.linux, OperatingSystem.macos, OperatingSystem.unix]
  }

  if (operatingSystem.match(/linux/i)) {
    return [OperatingSystem.linux]
  }

  if (operatingSystem.match(/macos/i) || operatingSystem.match(/mac os/i)) {
    return [OperatingSystem.macos]
  }

  return []
}

export enum RequirementType {
  Named,
  URL
}

interface PythonRequirement {
  /**
   * Type of requirement specified (name or URL)
   */
  type: RequirementType

  /**
   * Name or URL value of the requirement
   */
  value: string

  /**
   * Version of the requirement
   */
  version?: string | null
}

/**
 * Parser to be used on a directory with Python source code and (optionally) a `requirements.txt` file.
 * If no `requirements.txt` file exists then the Parser will attempt to read requirements from the Python source code.
 */
export default class PythonParser extends Parser {

  async parse (): Promise<SoftwarePackage | null> {
    const files = this.glob(['**/*.py'])

    if (!files.length) {
      // no .py files so don't parse this directory
      return null
    }

    const pkg = new SoftwarePackage()
    pkg.runtimePlatform = 'Python'

    if (this.folder) {
      pkg.name = basename(this.folder)
    }

    let requirements

    if (this.exists('requirements.txt')) {
      requirements = await this.parseRequirementsFile('requirements.txt')
    } else {
      requirements = this.generateRequirementsFromSource()
    }

    for (let rawRequirement of requirements) {
      if (rawRequirement.type === RequirementType.Named) {
        pkg.softwareRequirements.push(await this.createPackage(rawRequirement))
      } else if (rawRequirement.type === RequirementType.URL) {
        let sourceRequirement = new SoftwareSourceCode()
        sourceRequirement.runtimePlatform = 'Python'
        sourceRequirement.codeRepository = rawRequirement.value
      }
    }

    return pkg
  }

  /**
   * Convert a `PythonRequirement` into a `SoftwarePackage` by augmenting with metadata from PyPI
   */
  private async createPackage (requirement: PythonRequirement): Promise<SoftwarePackage> {
    const softwarePackage = new SoftwarePackage()
    softwarePackage.name = requirement.value
    softwarePackage.runtimePlatform = 'Python'
    softwarePackage.programmingLanguages = [ComputerLanguage.py]

    if (requirement.version) {
      softwarePackage.version = requirement.version
    }

    const pyPiMetadata = await this.fetch(`https://pypi.org/pypi/${softwarePackage.name}/json`)

    if (pyPiMetadata.info) {
      if (pyPiMetadata.info.author) {
        softwarePackage.authors.push(Person.fromText(`${pyPiMetadata.info.author} <${pyPiMetadata.info.author_email}>`))
      }

      if (pyPiMetadata.info.project_url) {
        softwarePackage.codeRepository = pyPiMetadata.info.project_url
      }

      if (pyPiMetadata.info.classifiers) {
        const classifiers = buildClassifierMap(pyPiMetadata.info.classifiers)

        if (classifiers.has('Topic')) {
          let [topics, subTopics] = parseTopics(classifiers.get('Topic')!)

          if (topics.length) softwarePackage.applicationCategories = topics
          if (subTopics.length) softwarePackage.applicationSubCategories = subTopics
        }

        if (classifiers.has('Operating System')) {
          const operatingSystems: Array<OperatingSystem> = []

          for (let operatingSystemDescription of classifiers.get('Operating System')!) {
            for (let operatingSystem of parseOperatingSystem(operatingSystemDescription)) {
              if (!operatingSystems.includes(operatingSystem)) operatingSystems.push(operatingSystem)
            }
          }
          softwarePackage.operatingSystems = operatingSystems
        }
      }
      if (pyPiMetadata.info.keywords) softwarePackage.keywords = pyPiMetadata.info.keywords

      if (pyPiMetadata.info.license) softwarePackage.license = pyPiMetadata.info.license

      if (pyPiMetadata.info.long_description) {
        softwarePackage.description = pyPiMetadata.info.long_description
      } else if (pyPiMetadata.info.description) {
        softwarePackage.description = pyPiMetadata.info.description
      }
    }
    return softwarePackage
  }

  /**
   * Parse a `requirements.txt` file at `path` and return a list of `PythonRequirement`s
   */
  async parseRequirementsFile (path: string): Promise<Array<PythonRequirement>> {
    const requirementsContent = this.read(path)

    const allRequirementLines = requirementsContent.split('\n')

    let requirements: Array<PythonRequirement> = []

    for (let line of allRequirementLines) {
      if (lineIsComment(line)) {
        continue
      }
      let editableSource = extractEditableSource(line)

      if (editableSource !== null) {
        requirements.push({ value: editableSource, type: RequirementType.URL })
        continue
      }

      let includePath = extractIncludedRequirementsPath(line)

      if (includePath !== null) {
        let includedRequirements = await this.parseRequirementsFile(includePath)
        requirements = requirements.concat(includedRequirements)
        continue
      }

      let standardRequirement = extractStandardRequirements(line)
      if (standardRequirement !== null) {
        let [requirementName, version] = splitStandardRequirementVersion(standardRequirement)
        requirements.push({ value: requirementName, type: RequirementType.Named, version: version })
      }
    }

    return requirements
  }

  /**
   * Parse Python source files are find any non-system imports, return this as an array of `PythonRequirement`s.
   */
  generateRequirementsFromSource (): Array<PythonRequirement> {
    const nonSystemImports = this.findImports().filter(pythonImport => !pythonSystemModules.includes(pythonImport))

    return nonSystemImports.map(nonSystemImport => {
      return {
        value: nonSystemImport, type: RequirementType.Named, version: ''
      }
    })
  }

  /**
   * Parse Python source files are find all imports (including system imports).
   */
  findImports (): Array<string> {
    const files = this.glob(['**/*.py'])

    const imports: Array<string> = []

    if (files.length) {
      for (let file of files) {
        for (let importName of this.readImportsInFile(file)) {
          if (!imports.includes(importName)) imports.push(importName)
        }
      }
    }
    return imports
  }

  /**
   * Parse Python a single Python source file for imports.
   */
  readImportsInFile (path: string): Array<string> {
    const fileContent = this.read(path)
    const importRegex = /^\s*from ([\w_]+)|^\s*import ([\w_]+)/gm
    const imports: Array<string> = []
    const fileDirectory = dirname(path)
    while (true) {
      let match = importRegex.exec(fileContent)

      if (!match) break

      const pkg = match[1] || match[2]
      if (this.glob([fileDirectory + '/' + pkg + '.py', fileDirectory + '/' + pkg + '/__init__.py']).length) {
        continue
      }
      if (!imports.includes(pkg)) imports.push(pkg)
    }
    return imports
  }
}
