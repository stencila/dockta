import fs from 'fs'
import path from 'path'
import CachingUrlFetcher, { REQUEST_CACHE_DIR } from '../src/CachingUrlFetcher'
import { NetworkError } from '../src/errors'

const fetcher = new CachingUrlFetcher()

jest.setTimeout(30 * 60 * 1000)

test('fetch:npm', async () => {
  let result = await fetcher.fetchUrl('https://registry.npmjs.org/@stencila/dockter')
  expect(result.name).toBe('@stencila/dockter')
})

test('fetch:cache', async () => {
  // same as previous, but should cover cache code
  let result = await fetcher.fetchUrl('https://registry.npmjs.org/@stencila/dockter')
  expect(result.name).toBe('@stencila/dockter')
})

test('fetch:cache-empty-error', async () => {
  // this will work but cache will fail internally with 'does not look like a valid storage file' error
  fs.writeFileSync(path.join(REQUEST_CACHE_DIR, '5acbdfceeb37a779ad5c81e903bfae92'), '')
  let result = await fetcher.fetchUrl('https://registry.npmjs.org/@stencila/dockter')
  expect(result.name).toBe('@stencila/dockter')
})

test('fetch:cache-other-error', async () => {
  let cacheFile = path.join(REQUEST_CACHE_DIR, '5acbdfceeb37a779ad5c81e903bfae92')
  fs.chmodSync(cacheFile, '000')
  await expect(
    fetcher.fetchUrl('https://registry.npmjs.org/@stencila/dockter')
  ).rejects.toThrow()
  fs.chmodSync(cacheFile, '666')
})

test('fetch:404', async () => {
  let result = await fetcher.fetchUrl('https://registry.npmjs.org/@stencila/nonExistingProject')
  expect(result).toBeNull()
})

test('fetch:ENOTFOUND', async () => {
  await expect(
    fetcher.fetchUrl('notAnUrl')
  ).rejects.toThrow(new NetworkError('There was a problem fetching notAnUrl (ENOTFOUND). Are you connected to the internet?'))
})

test('fetch:otherErr', async () => {
  // This should throw a ParseError or similar
  await expect(
    fetcher.fetchUrl('google.com')
  ).rejects.toThrow()
})
