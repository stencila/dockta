import IUrlFetcher from './IUrlFetcher'

import { NetworkError } from './errors'
import persist from 'node-persist'
import got from 'got'

export const REQUEST_CACHE_DIR = '/tmp/dockta-request-cache'
let REQUEST_CACHE_INITIALISED = false

/**
 * The default URL fetcher that Dockta uses. Fetches using `got` and caches results using `persist`
 */
export default class CachingUrlFetcher implements IUrlFetcher {
  /**
   * Fetch a URL using `got`, attempting to retrieve it from cache first.
   */
  async fetchUrl (url: string, options: any = { json: true }): Promise<any> {
    let value = await CachingUrlFetcher.getFromCache(url)
    if (value) return value

    try {
      const response = await got(url, options)
      value = response.body
    } catch (error) {
      if (error.statusCode === 404) {
        value = null
      } else if (['ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(error.code)) {
        // These are usually connection errors
        throw new NetworkError(`There was a problem fetching ${url} (${error.code}). Are you connected to the internet?`)
      } else {
        throw error
      }
    }

    await CachingUrlFetcher.setToCache(url, value)

    return value
  }

  /**
   *  Try to get a result from the `persist` cache. This method with initialise the `persist` cache if it has not been
   *  set up.
   */
  static async getFromCache (url: string): Promise<any> {
    if (!REQUEST_CACHE_INITIALISED) {
      await persist.init({
        dir: REQUEST_CACHE_DIR,
        ttl: 60 * 60 * 1000 // Milliseconds to cache responses for
      })
      REQUEST_CACHE_INITIALISED = true
    }

    try {
      return await persist.getItem(url)
    } catch (error) {
      if (error.message.includes('does not look like a valid storage file')) {
        // It seems that `persist.setItem` is not atomic and that the storage file can
        // have zero bytes when we make multiple requests, some of which are for the same
        // url. So we ignore this error and continue with the duplicate request.
        return null
      } else {
        throw error
      }
    }
  }

  /**
   * Set a value (URL response body, usually) to the `persist` cache.
   */
  static async setToCache (url: string, value: any): Promise<void> {
    await persist.setItem(url, value)
  }
}
