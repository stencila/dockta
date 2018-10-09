import path from 'path'

import PythonWriter from '../src/PythonWriter'

test('empty', () => {
  const writer = new PythonWriter(path.join(__dirname, 'fixtures', 'empty'))
  expect(writer.active).toEqual(false)
})

test('py-date', () => {
  const writer = new PythonWriter(path.join(__dirname, 'fixtures', 'py-date'))
  expect(writer.active).toEqual(true)
  expect(writer.aptPackages(18.04)).toEqual(['python3', 'python3-pip'])
})
