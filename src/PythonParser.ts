import Parser from './Parser'
import { SoftwareEnvironment, SoftwarePackage, SoftwareSourceCode } from '@stencila/schema'
import { basename, dirname } from 'path'
import fs from 'fs'

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
        let standardRequirement = new SoftwarePackage()
        standardRequirement.name = rawRequirement.value
        standardRequirement.runtimePlatform = 'Python'
        if (rawRequirement.version) {
          standardRequirement.version = rawRequirement.version
        }

        environ.softwareRequirements.push(standardRequirement)
      } else if (rawRequirement.type === RequirementType.URL) {
        let sourceRequirement = new SoftwareSourceCode()
        sourceRequirement.runtimePlatform = 'Python'
        sourceRequirement.codeRepository = rawRequirement.value
      }
    }

    return environ
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
    let pythonSystemModules = fs.readFileSync(__dirname + '/PythonBuiltins.txt', 'utf8').split('\n')

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
