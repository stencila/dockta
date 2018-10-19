import Parser from './Parser'
import { SoftwareEnvironment, SoftwarePackage, SoftwareSourceCode } from './context'
import { basename } from 'path'

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
    if (!this.exists('requirements.txt')) {
      // no requirements file so can't generate an environment
      return null
    }

    const files = this.glob(['**/*.py'])

    if (!files.length) {
      // no .py files so don't parse this directory
      return null
    }

    const environ = new SoftwareEnvironment()

    if (this.folder) {
      environ.name = basename(this.folder)
    }

    const requirements = await this.parseRequirementsFile('requirements.txt')

    for (let rawRequirement of requirements) {
      if (rawRequirement.type === RequirementType.Named) {
        let standardRequirement = new SoftwarePackage()
        standardRequirement.name = rawRequirement.value
        if (rawRequirement.version) {
          standardRequirement.version = rawRequirement.version
        }

        environ.softwareRequirementsPush(standardRequirement)
      } else if (rawRequirement.type === RequirementType.URL) {
        let sourceRequirement = new SoftwareSourceCode()
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
}
