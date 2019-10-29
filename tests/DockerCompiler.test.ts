import fs from 'fs'

import DockerCompiler from '../src/DockerCompiler'
import { fixture } from './test-functions'
import { SoftwareEnvironment, Person } from '@stencila/schema'
import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

jest.setTimeout(30 * 60 * 1000)

/**
 * Tests of compiling Dockerfile
 *
 * To avoid actual building of the Docker image these tests
 * set the build flag to false
 */

test('compile:empty', async () => {
  const compiler = new DockerCompiler(urlFetcher)
  let environ = await compiler.compile('file://' + fixture('empty'), false)

  let expected = new SoftwareEnvironment()
  expected.name = 'empty'
  expect(environ).toEqual(expected)
})

test('compile:dockerfile-date', async () => {
  const compiler = new DockerCompiler(urlFetcher)
  let environ = await compiler.compile('file://' + fixture('dockerfile-date'), false)

  expect(environ && environ.description && environ.description.substring(0, 23)).toEqual('Prints the current date')
  expect(environ && environ.authors && (environ.authors[0] as Person).name).toEqual('Nokome Bentley')
})

test('compile:multi-lang', async () => {
  const compiler = new DockerCompiler(urlFetcher)
  let environ = await compiler.compile('file://' + fixture('multi-lang'), false, false)

  // Remove the date from the MRAN line to allow for changing date of test v expected
  const aptAddMRAN = /(apt-add-repository "deb https:\/\/mran.microsoft.com\/snapshot)\/([\d-]+)\/(bin\/linux\/ubuntu cosmic-cran35\/)"/
  const actual = fs.readFileSync(fixture('multi-lang/.Dockerfile'), 'utf8').replace(aptAddMRAN, '$1/YYYY-MM-DD/$3')
  const expected = fs.readFileSync(fixture('multi-lang/Dockerfile.expected'), 'utf8').replace(aptAddMRAN, '$1/YYYY-MM-DD/$3')
  expect(actual).toEqual(expected)
})

test('who:r-gsl', async () => {
  const compiler = new DockerCompiler(urlFetcher)
  let people = await compiler.who('file://' + fixture('r-gsl'))

  expect(people).toEqual({'Robin K.': ['gsl']})
})
