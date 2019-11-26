import PythonSystemPackageLookup from '../src/PythonSystemPackageLookup'
import { fixture } from './test-functions'

const packageLookup = PythonSystemPackageLookup.fromFile(
  fixture('py-system-package-lookup.json')
)

/**
 * Test reading the system requirements of a Python package where all matching values are found.
 */
test('python-sys-lookup:full-depth', () => {
  const requirements = packageLookup.lookupSystemPackage(
    'numpy',
    3,
    'deb',
    'xenial'
  )
  expect(requirements).toEqual(['xenial-numpy-dependencies'])
})

/**
 * Test reading the system requirements of a Python package where system name is not set so fall back to default
 */
test('python-sys-lookup:no-sysname', () => {
  const requirements = packageLookup.lookupSystemPackage(
    'numpy',
    3,
    'deb',
    'test'
  )
  expect(requirements).toEqual(['deb-default-dependencies'])
})

/**
 * Test reading the system requirements of a Python package where the package type is not defined
 */
test('python-sys-lookup:no-package-type', () => {
  const requirements = packageLookup.lookupSystemPackage(
    'numpy',
    3,
    'rpm',
    'test'
  )
  expect(requirements).toEqual(['default-default-dependencies'])
})

/**
 * Test reading the system requirements of a Python package where the python version being looked up is not set
 */
test('python-sys-lookup:no-python-version', () => {
  const requirements = packageLookup.lookupSystemPackage(
    'numpy',
    2,
    'deb',
    'xenial'
  )
  expect(requirements).toEqual(['python-2-dependency'])
})

/**
 * Test reading the system requirements of a Python package when there is no entry
 */
test('python-sys-lookup:no-package', () => {
  const requirements = packageLookup.lookupSystemPackage(
    'my-fake-package',
    2,
    'rpm',
    'test'
  )
  expect(requirements).toEqual([])
})
