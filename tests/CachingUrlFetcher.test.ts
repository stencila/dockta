import fs from 'fs'
import path from 'path'
import CachingUrlFetcher, { REQUEST_CACHE_DIR } from '../src/CachingUrlFetcher'
import { NetworkError } from '../src/errors'

const fetcher = new CachingUrlFetcher()

/**
 * The URL https://registry.npmjs.org/@stencila/dockta gets hashed somehow and the file on disk containing that info
 * has this name
 */
const DOCKTA_NPM_CACHE_KEY = '9dca981440f68934ac58ff30ec76a4f9'

jest.setTimeout(30 * 60 * 1000)

test('fetch:npm', async () => {
  let result = await fetcher.fetchUrl(
    'https://registry.npmjs.org/@stencila/dockta'
  )
  expect(result.name).toBe('@stencila/dockta')
})

test('fetch:cache', async () => {
  // same as previous, but should cover cache code
  let result = await fetcher.fetchUrl(
    'https://registry.npmjs.org/@stencila/dockta'
  )
  expect(result.name).toBe('@stencila/dockta')
})

test('fetch:cache-empty-error', async () => {
  // this will work but cache will fail internally with 'does not look like a valid storage file' error
  fs.writeFileSync(path.join(REQUEST_CACHE_DIR, DOCKTA_NPM_CACHE_KEY), '')
  let result = await fetcher.fetchUrl(
    'https://registry.npmjs.org/@stencila/dockta'
  )
  expect(result.name).toBe('@stencila/dockta')
})

test('fetch:cache-other-error', async () => {
  let cacheFile = path.join(REQUEST_CACHE_DIR, DOCKTA_NPM_CACHE_KEY)
  fs.chmodSync(cacheFile, '000')
  await expect(
    fetcher.fetchUrl('https://registry.npmjs.org/@stencila/dockta')
  ).rejects.toThrow()
  fs.chmodSync(cacheFile, '666')
})

test('fetch:404', async () => {
  let result = await fetcher.fetchUrl(
    'https://registry.npmjs.org/@stencila/nonExistingProject'
  )
  expect(result).toBeNull()
})

test('fetch:ENOTFOUND', async () => {
  await expect(fetcher.fetchUrl('notAnUrl')).rejects.toThrow(
    new NetworkError(
      'There was a problem fetching notAnUrl (ENOTFOUND). Are you connected to the internet?'
    )
  )
})

test('fetch:otherErr', async () => {
  // This should throw a ParseError or similar
  await expect(fetcher.fetchUrl('google.com')).rejects.toThrow()
})
