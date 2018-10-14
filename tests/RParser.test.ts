import RParser from '../src/RParser'
import fixture from './fixture'
import { SoftwareApplication, SoftwareEnvironment } from '../src/context';

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
  // expect(environ.version).toEqual('version') TODO version not implemented yet
  expect(environ.datePublished).toEqual('2018-10-05')
  expect(environ.softwareRequirements.length).toEqual(1)
  expect(environ.softwareRequirements[0].name).toEqual('lubridate')
})
