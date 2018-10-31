import fixture from './fixture'
import JavascriptParser from '../src/JavascriptParser'
import { SoftwarePackage } from '@stencila/schema'

// Increase timeout (in milliseconds) to allow for HTTP requests
// to get package meta data
jest.setTimeout(30 * 60 * 1000)

/**
 * When applied to an empty folder, parse should return null.
 */
test('parse:empty', async () => {
  const parser = new JavascriptParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with no JS code, parse should return null.
 */
test('parse:r-date', async () => {
  const parser = new JavascriptParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with a `package.json` file, parse should return
 * a `SoftwarePackage` with `name`, `softwareRequirements` etc
 * populated correctly.
 */
test('parse:js-package', async () => {
  const parser = new JavascriptParser(fixture('js-package'))
  const pkg = await parser.parse() as SoftwarePackage
  
  expect(pkg.name).toEqual('js-package')
  expect(pkg.softwareRequirements.length).toEqual(2)
  expect(pkg.softwareRequirements[0].name).toEqual('mkdirp')
  expect(pkg.softwareRequirements[1].name).toEqual('rimraf')
})


/**
 * When applied to a folder with a `*.js` files, parse should return
 * a `SoftwarePackage` with `name`, `softwareRequirements` etc
 * populated correctly.
 */
test('parse:js-sources', async () => {
  const parser = new JavascriptParser(fixture('js-sources'))
  const pkg = await parser.parse() as SoftwarePackage
  
  expect(pkg.name).toEqual('js-sources')
  expect(pkg.softwareRequirements.length).toEqual(2)
  expect(pkg.softwareRequirements[1].name).toEqual('array-swap')
  expect(pkg.softwareRequirements[0].name).toEqual('is-sorted')
})
