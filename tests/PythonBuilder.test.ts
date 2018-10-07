import path from 'path'

import PythonBuilder from '../src/PythonBuilder'

test('empty', () => {
  const builder = new PythonBuilder(path.join(__dirname, 'fixtures', 'empty'))
  expect(builder.active).toEqual(false)
})

test('py-date', () => {
  const builder = new PythonBuilder(path.join(__dirname, 'fixtures', 'py-date'))
  expect(builder.active).toEqual(true)
  expect(builder.aptPackages()).toEqual(['python3', 'python3-pip'])
})
