import { fixture } from './test-functions'

import PythonParser, { RequirementType } from '../src/PythonParser'
import { ComputerLanguage, OperatingSystem, Person, SoftwarePackage } from '@stencila/schema'

import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

describe('PythonParser', () => {
  /**
   * When applied to an empty folder, parse should return null.
   */
  test('parse:empty', async () => {
    const parser = new PythonParser(urlFetcher, fixture('empty'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * When applied to a folder with no Python code, parse should return null.
   */
  test('parse:non-py', async () => {
    const parser = new PythonParser(urlFetcher, fixture('r-date'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * requirements.txt parsing should work with all features, skipping comment lines, recursive parsing, and allowing URL
   * bases requirements
   */
  test('parse:py-requirements', async () => {
    const parser = new PythonParser(urlFetcher, fixture('py-requirements'))

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
  test('parse:py-requirements', async () => {
    const parser = new PythonParser(urlFetcher, fixture('py-mixed'))

    const arrowPackage = new SoftwarePackage()
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
    environ.name = 'py-mixed'
    environ.softwareRequirements = [arrowPackage]
    environ.runtimePlatform = 'Python'

    expect(await parser.parse()).toEqual(environ)
  })

  /**
   * The parser should be able to go through a directory of Python files without a requirements.txt file and understand
   * the imports that are required by parsing the source files directly.
   */
  test('parse:py-source', async () => {
    const parser = new PythonParser(urlFetcher, fixture('py-source'))
    const environ = await parser.parse()
    expect(environ).not.toBeNull()
    const requirementNames = environ!.softwareRequirements.map(requirement => requirement.name)
    expect(requirementNames.length).toEqual(2)
    expect(requirementNames).toContain('django')
    expect(requirementNames).toContain('requests')
  })

  /**
   * If a directory has both a `requirements.txt` file and Python source files, the `PythonParser` should only read
   * requirements from the `requirements.txt` and should not parse the source code.
   */
  test('parse:py-mixed', async () => {
    const parser = new PythonParser(urlFetcher, fixture('py-mixed'))
    const environ = await parser.parse()
    expect(environ).not.toBeNull()

    expect(environ!.softwareRequirements.length).toEqual(1)
    expect(environ!.softwareRequirements[0].name).toEqual('arrow')
    expect(environ!.softwareRequirements[0].version).toEqual('==0.12.1')
  })
})
