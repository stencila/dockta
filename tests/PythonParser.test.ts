import fixture from './fixture'
import PythonParser from '../src/PythonParser'
import { SoftwareEnvironment } from '../src/context';

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
test('parse:dockerfile-date', async () => {
  const parser = new PythonParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})
