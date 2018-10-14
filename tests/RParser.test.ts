import RParser from '../src/RParser'
import fixture from './fixture'
import { SoftwareApplication, SoftwareEnvironment } from '../src/context';

test('empty', async () => {
  const parser = new RParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

test('r-date', async () => {
  const parser = new RParser(fixture('r-date'))
  const environ = await parser.parse() as SoftwareEnvironment
  expect(environ.softwareRequirements).toEqual([])
})
