import fixture from './fixture'
import fs from 'fs'

import PythonParser, { RequirementType } from '../src/PythonParser'
import { ComputerLanguage, OperatingSystem, Person, SoftwareApplication, SoftwarePackage } from '@stencila/schema'
import { REQUEST_CACHE_DIR } from '../src/Doer'

describe('PythonParser', () => {
  beforeEach(() => {
    if (fs.existsSync(REQUEST_CACHE_DIR)) {
      for (let item of fs.readdirSync(REQUEST_CACHE_DIR)) {
        fs.unlinkSync(REQUEST_CACHE_DIR + '/' + item)
      }
    }
  })

  /**
   * When applied to an empty folder, parse should return null.
   */
  test('parse:empty', async () => {
    const parser = new PythonParser(fixture('empty'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * When applied to a folder with no Python code, parse should return null.
   */
  test('parse:r-date', async () => {
    const parser = new PythonParser(fixture('r-date'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * requirements.txt parsing should work with all features, skipping comment lines, recursive parsing, and allowing URL
   * bases requirements
   */
  test('parse:example-requirements', async () => {
    const parser = new PythonParser(fixture('py-requirements-example'))

    const requirementsContent = await parser.parseRequirementsFile('requirements.txt')

    const expected = [
      {
        value: 'Django',
        version: '==1.9.2',
        type: RequirementType.Named
      },
      {
        'type': RequirementType.Named,
        'value': 'requests',
        'version': '==2.19.1'
      },
      {
        'type': RequirementType.Named,
        'value': 'less-than',
        'version': '<1'
      },
      {
        'type': RequirementType.Named,
        'value': 'greater-than',
        'version': '>2'
      },
      {
        'type': RequirementType.Named,
        'value': 'less-than-equal',
        'version': '<=3'
      },
      {
        'type': RequirementType.Named,
        'value': 'greater-than-equal',
        'version': '>=4'
      },
      {
        'type': RequirementType.Named,
        'value': 'multiple-things',
        'version': '>5,<=6'
      },
      {
        'type': RequirementType.Named,
        'value': 'squiggly-boye',
        'version': '~=7'
      },
      {
        'type': RequirementType.URL,
        'value': 'svn+http://myrepo/svn/MyApp#egg=MyApp'
      },
      {
        'type': RequirementType.Named,
        'value': 'final-requirement',
        'version': '==2.4'
      }
    ]

    expect(requirementsContent).toEqual(expected)
  })

  /**
   * When applied to a folder with a requirements file,
   * parse should return the SoftwareEnvironment.
   */
  test('parse:py-pandas', async () => {
    const parser = new PythonParser(fixture('py-date'))

    const arrowPackage = new SoftwareApplication()
    arrowPackage.name = 'arrow'
    arrowPackage.version = '==0.12.1'
    arrowPackage.runtimePlatform = 'Python'
    arrowPackage.programmingLanguages = [ComputerLanguage.py]

    // This data is populated by the metadata lookup and the `got` mock
    arrowPackage.authors = [Person.fromText('Joe Bloggs <joe.bloggs@example.com>')]
    arrowPackage.operatingSystems = [OperatingSystem.windows, OperatingSystem.linux, OperatingSystem.macos,
      OperatingSystem.unix]
    arrowPackage.codeRepository = 'http://www.example.com/project'
    arrowPackage.applicationCategories = ['Database', 'Software Development']
    arrowPackage.applicationSubCategories = ['Front-Ends', 'Libraries']
    arrowPackage.keywords = 'test keywords list'
    arrowPackage.license = 'Free Software License'
    arrowPackage.description = 'This is the long description that will be used in priority over description'

    const environ = new SoftwarePackage()
    environ.name = 'py-date'
    environ.softwareRequirements = [arrowPackage]

    expect(await parser.parse()).toEqual(environ)
  })

  /**
   * The parser should be able to go through a directory of Python files without a requirements.txt file and understand
   * the imports that are required by parsing the source files directly.
   */
  test('parse:py-generated-requirements', async () => {
    const parser = new PythonParser(fixture('py-generated-requirements'))
    let environ = await parser.parse()
    expect(environ).not.toBeNull()
    let requirementNames = environ!.softwareRequirements.map(requirement => requirement.name)
    expect(requirementNames.length).toEqual(2)
    expect(requirementNames).toContain('django')
    expect(requirementNames).toContain('requests')
  })
})