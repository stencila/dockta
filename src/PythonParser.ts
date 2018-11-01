import { dirname, basename } from 'path'
import {
  ComputerLanguage,
  Person,
  SoftwareApplication,
  SoftwareEnvironment,
  SoftwareSourceCode
} from '@stencila/schema'
import OperatingSystem from '@stencila/schema/dist/OperatingSystem'

import Parser from './Parser'
import { default as pythonSystemModules } from './PythonBuiltins'

const REQUIREMENTS_COMMENT_REGEX = /^\s*#/
const REQUIREMENTS_EDITABLE_SOURCE_REGEX = /^\s*-e\s*([^\s]+)\s*/
const REQUIREMENTS_INCLUDE_PATH_REGEX = /^\s*-r\s+([^\s]+)\s*/
const REQUIREMENTS_STANDARD_REGEX = /^\s*([^\s]+)/

function lineIsComment (line: string): boolean {
  return REQUIREMENTS_COMMENT_REGEX.exec(line) !== null
}

function applyRegex (line: string, regex: RegExp): string | null {
  const result = regex.exec(line)

  if (result === null) {
    return null
  }
  return result[1]
}

function extractEditableSource (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_EDITABLE_SOURCE_REGEX)
}

function extractIncludedRequirementsPath (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_INCLUDE_PATH_REGEX)
}

function extractStandardRequirements (line: string): string | null {
  return applyRegex(line, REQUIREMENTS_STANDARD_REGEX)
}

function splitStandardRequirementVersion (requirement: string): [string, string | null] {
  let firstSplitterIndex = -1

  for (let splitter of ['<=', '>=', '==', '~=', '<', '>']) {
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

function buildClassifierMap (classifiers: Array<string>): Map<string, Array<string>> {
  const classifierMap = new Map<string, Array<string>>()

  for (let classifier in classifiers) {
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
  value: string
  type: RequirementType
  version?: string | null
}

export default class PythonParser extends Parser {

  async parse (): Promise<SoftwareEnvironment | null> {
    const files = this.glob(['**/*.py'])

    if (!files.length) {
      // no .py files so don't parse this directory
      return null
    }

    const environ = new SoftwareEnvironment()

    if (this.folder) {
      environ.name = basename(this.folder)
    }

    let requirements

    if (this.exists('requirements.txt')) {
      requirements = await this.parseRequirementsFile('requirements.txt')
    } else {
      requirements = this.generateRequirementsFromSource()
    }

    for (let rawRequirement of requirements) {
      if (rawRequirement.type === RequirementType.Named) {
        environ.softwareRequirements.push(await this.createApplication(rawRequirement))
      } else if (rawRequirement.type === RequirementType.URL) {
        let sourceRequirement = new SoftwareSourceCode()
        sourceRequirement.runtimePlatform = 'Python'
        sourceRequirement.codeRepository = rawRequirement.value
      }
    }

    return environ
  }

  private async createApplication (requirement: PythonRequirement): Promise<SoftwareApplication> {
    const softwareApplication = new SoftwareApplication()
    softwareApplication.name = requirement.value
    softwareApplication.runtimePlatform = 'Python'
    softwareApplication.programmingLanguages = [ComputerLanguage.py]

    if (requirement.version) {
      softwareApplication.version = requirement.version
    }

    const pyPiMetadata = await this.fetch(`https://pypi.org/pypi/${softwareApplication.name}/json`)

    if (pyPiMetadata.info) {
      if (pyPiMetadata.info.author) {
        softwareApplication.authors.push(Person.fromText(`${pyPiMetadata.info.author} <${pyPiMetadata.info.author_email}>`))
      }

      if (pyPiMetadata.info.project_url) {
        softwareApplication.codeRepository = pyPiMetadata.info.project_url
      }

      if (pyPiMetadata.info.classifiers) {
        let classifiers = buildClassifierMap(pyPiMetadata.info.classifiers)
        if (classifiers.has('Topic')) {
          let [topics, subTopics] = parseTopics(classifiers.get('Topic')!)

          if (topics.length) softwareApplication.applicationCategories = topics
          if (subTopics.length) softwareApplication.applicationSubCategories = subTopics
        }

        if (classifiers.has('Operating System')) {
          const operatingSystems: Array<OperatingSystem> = []

          for (let operatingSystemDescription of classifiers.get('Operating System')!) {
            for (let operatingSystem of parseOperatingSystem(operatingSystemDescription)) {
              if (!operatingSystems.includes(operatingSystem)) operatingSystems.push(operatingSystem)
            }
          }
          softwareApplication.operatingSystems = operatingSystems
        }
      }
      if (pyPiMetadata.info.keywords) softwareApplication.keywords = pyPiMetadata.info.keywords

      if (pyPiMetadata.info.license) softwareApplication.license = pyPiMetadata.info.license

      if (pyPiMetadata.info.long_description) {
        softwareApplication.description = pyPiMetadata.info.long_description
      } else if (pyPiMetadata.info.description) {
        softwareApplication.description = pyPiMetadata.info.description
      }
    }
    return softwareApplication
  }

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

  generateRequirementsFromSource (): Array<PythonRequirement> {
    const nonSystemImports = this.findImports().filter(pythonImport => !pythonSystemModules.includes(pythonImport))

    return nonSystemImports.map(nonSystemImport => {
      return {
        value: nonSystemImport, type: RequirementType.Named, version: ''
      }
    })
  }

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

  readImportsInFile (path: string): Array<string> {
    const fileContent = this.read(path)
    const importRegex = /^from ([\w_]+)|^import ([\w_]+)/gm
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
