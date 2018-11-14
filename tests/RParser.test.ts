import { fixture } from './test-functions'
import RParser from '../src/RParser'
import { SoftwarePackage } from '@stencila/schema'
import MockUrlFetcher from './MockUrlFetcher'

// Increase timeout (in milliseconds) to allow for HTTP requests
// to get package meta data
jest.setTimeout(30 * 60 * 1000)

const urlFetcher = new MockUrlFetcher()

/**
 * When applied to an empty folder, parse should return null.
 */
test('parse:empty', async () => {
  const parser = new RParser(urlFetcher, fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with no R code, parse should return null.
 */
test('parse:non-r', async () => {
  const parser = new RParser(urlFetcher, fixture('py-source'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with a `DESCRIPTION` file and no R source files, parse should return a `SoftwareEnvironment`
 * with `name`, `softwareRequirements` etc populated correctly from the `DESCRIPTION`.
 */
test('parse:r-source', async () => {
  const parser = new RParser(urlFetcher, fixture('r-source'))
  const environ = await parser.parse() as SoftwarePackage
  expect(environ.name).toEqual('rsource')

  const reqs = environ.softwareRequirements
  expect(reqs).not.toBeNull()
  expect(reqs.map(req => req.name)).toEqual(['MASS', 'digest', 'dplyr', 'ggplot2', 'lubridate'])
})

/**
 * When applied to a folder with no DESCRIPTION file but with .R files,
 * parse should generate a `.DESCRIPTION` file and
 * return a `SoftwareEnvironment` with packages listed.
 */
test('parse:r-requirements', async () => {
  const parser = new RParser(urlFetcher, fixture('r-requirements'))
  const environ = await parser.parse() as SoftwarePackage

  expect(environ.name).toEqual('rrequirements')

  const reqs = environ.softwareRequirements
  expect(reqs).not.toBeNull()
  expect(reqs.map(req => req.name)).toEqual(['packageone', 'packagetwo'])
})

/**
 * When applied to a folder with a `DESCRIPTION` file, and R sources, only the `DESCRIPTION` file should be used to
 * generate the requirements (i.e. R sources aren't parsed for requirements).
 */
test('parse:r-mixed', async () => {
  const parser = new RParser(urlFetcher, fixture('r-mixed'))
  const environ = await parser.parse() as SoftwarePackage

  const reqs = environ.softwareRequirements
  expect(reqs).not.toBeNull()
  expect(reqs.map(req => req.name)).toEqual(['car', 'coin', 'ggplot2', 'httr', 'lsmeans'])
})
