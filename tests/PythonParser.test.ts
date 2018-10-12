import path from 'path'

import PythonParser from '../src/PythonParser'

test('empty', () => {
  const writer = new PythonParser(path.join(__dirname, 'fixtures', 'empty'))
  expect(writer.active).toEqual(false)
})

test('py-date', () => {
  const writer = new PythonParser(path.join(__dirname, 'fixtures', 'py-date'))
  expect(writer.active).toEqual(true)
  expect(writer.aptPackages(18.04)).toEqual(['python3', 'python3-pip'])
})
