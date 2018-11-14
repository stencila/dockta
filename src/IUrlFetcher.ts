/**
 * Standard interface that can be used for fetching URLs
 */
export default interface IUrlFetcher {
  fetchUrl (url: string, options: any): any
}
