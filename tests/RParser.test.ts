import RParser from '../src/RParser'
import fixture from './fixture'
import { SoftwareApplication } from '../src/context';

test('empty', async () => {
  const parser = new RParser(fixture('empty'))
  const environ = await parser.parse()
  expect(environ.softwareRequirements).toEqual([])
})

test('r-date', async () => {
  const parser = new RParser(fixture('r-date'))
  const environ = await parser.parse()
  expect(environ.softwareRequirements).toEqual([])
})
