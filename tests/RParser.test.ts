import fixture from './fixture'
import RParser from '../src/RParser'
import { SoftwareEnvironment } from '../src/context'

// Increase timeout (in milliseconds) to allow for HTTP requests
// to get package meta data
jest.setTimeout(30 * 60 * 1000)

/**
 * When applied to an empty folder, parse should return null.
 */
test('parse:empty', async () => {
  const parser = new RParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with no R code, parse should return null.
 */
test('parse:dockerfile-date', async () => {
  const parser = new RParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with a DESCRIPTION file, parse should return
 * a `SoftwareEnvironment` with `name`, `softwareRequirements` etc
 * populated correctly.
 */
test('parse:r-date', async () => {
  const parser = new RParser(fixture('r-date'))
  const environ = await parser.parse() as SoftwareEnvironment
  expect(environ.name).toEqual('rdate')
  
  const reqs = environ.softwareRequirements
  expect(reqs).toBeDefined()
  expect(reqs && reqs.length).toEqual(1)
  expect(reqs && reqs[0].name).toEqual('lubridate')
})

/**
 * When applied to a folder with no DESCRIPTION file but with .R files, 
 * parse should generate a `.DESCRIPTION` file and 
 * return a `SoftwareEnvironment` with packages listed.
 */
test('parse:r-no-desc', async () => {
  const parser = new RParser(fixture('r-no-desc'))
  const environ = await parser.parse() as SoftwareEnvironment
  
  expect(environ.name).toEqual('rnodesc')

  const reqs = environ.softwareRequirements
  expect(reqs).toBeDefined()
  expect(reqs && reqs.map(req => req.name)).toEqual(['MASS', 'digest', 'dplyr', 'ggplot2', 'lubridate'])
})

/**
 * When applied to fixture with more system dependencies...
 */
test('parse:r-elife', async () => {
  const parser = new RParser(fixture('r-elife'))
  const environ = await parser.parse() as SoftwareEnvironment

  const reqs = environ.softwareRequirements
  expect(reqs).toBeDefined()
  expect(reqs && reqs.map(req => req.name)).toEqual([
    'car', 'coin', 'ggplot2', 'httr', 'lsmeans', 'MBESS',
    'metafor', 'pander', 'psychometric', 'reshape2',
    'rjson', 'tidyr'
  ])
})

