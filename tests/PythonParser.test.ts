import fixture from './fixture'
import PythonParser, { RequirementType } from '../src/PythonParser'
import { SoftwareEnvironment, SoftwarePackage } from '@stencila/schema'

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

  const arrowPackage = new SoftwarePackage()
  arrowPackage.name = 'arrow'
  arrowPackage.version = '==0.12.1'
  arrowPackage.runtimePlatform = 'Python'

  const environ = new SoftwareEnvironment()
  environ.name = 'py-date'
  environ.softwareRequirements = [arrowPackage]

  expect(await parser.parse()).toEqual(environ)
})
