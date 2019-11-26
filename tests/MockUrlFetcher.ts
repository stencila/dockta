import CachingUrlFetcher from '../src/CachingUrlFetcher'
import fs from 'fs'
import { fixture } from './test-functions'

export default class MockUrlFetcher extends CachingUrlFetcher {
  async fetchUrl(url: string, options: any = { json: true }): Promise<any> {
    if (url.indexOf('sysreqs.r-hub.io/pkg') !== -1) {
      return this.getRSysReqs(url)
    }

    if (url.indexOf('crandb.r-pkg.org') !== -1) {
      return this.getCranDb(url)
    }

    if (url.indexOf('pypi.org/pypi/') !== -1) {
      return this.getPyPi(url)
    }

    if (url.indexOf('registry.npmjs.org/') !== -1) {
      return this.getNpmRegistry(url)
    }

    console.warn(`Unhandled URL in Mock fetcher: ${url}`)

    return super.fetchUrl(url, options)
  }

  getRSysReqs(url: string): any {
    if (url === 'https://sysreqs.r-hub.io/pkg/xml2') {
      return [
        {
          libxml2: {
            sysreqs: 'libxml2',
            platforms: {
              DEB: 'libxml2-dev',
              'OSX/brew': null,
              RPM: 'libxml2-devel'
            }
          }
        }
      ]
    }

    if (url === 'https://sysreqs.r-hub.io/pkg/haven') {
      return [
        {
          gnumake: {
            sysreqs: ['GNU make', 'GNU Make'],
            platforms: { DEB: 'make', 'OSX/brew': null, RPM: 'make' }
          }
        }
      ]
    }

    if (url === 'https://sysreqs.r-hub.io/pkg/curl') {
      return [
        {
          libcurl: {
            sysreqs: 'libcurl',
            platforms: {
              DEB: 'libcurl4-openssl-dev',
              'OSX/brew': null,
              RPM: 'libcurl-devel'
            }
          }
        },
        {
          openssl: {
            sysreqs: 'OpenSSL',
            platforms: {
              DEB: 'libssl-dev',
              'OSX/brew': 'openssl@1.1',
              RPM: 'openssl-devel'
            }
          }
        }
      ]
    }

    if (url === 'https://sysreqs.r-hub.io/pkg/gsl') {
      return [
        {
          libgsl: {
            sysreqs: ['/Gnu Scientific Library/i', '/\\bgsl\\b/'],
            platforms: {
              DEB: [
                {
                  distribution: 'Ubuntu',
                  releases: ['precise', 'trusty', 'vivid', 'wily'],
                  runtime: 'libgsl0ldbl',
                  buildtime: 'libgsl0-dev'
                },
                {
                  distribution: 'Ubuntu',
                  runtime: 'libgsl2',
                  buildtime: 'libgsl-dev'
                },
                {
                  distribution: 'Debian',
                  releases: ['squeeze', 'wheezy', 'jessie'],
                  runtime: 'libgsl0ldbl',
                  buildtime: 'libgsl0-dev'
                },
                {
                  distribution: 'Debian',
                  runtime: 'libgsl2',
                  buildtime: 'libgsl-dev'
                }
              ],
              'OSX/brew': 'gsl',
              RPM: {
                runtime: 'gsl',
                buildtime: 'gsl-devel'
              }
            }
          }
        }
      ]
    }

    return []
  }

  getCranDb(url: string): any {
    if (url === 'http://crandb.r-pkg.org/curl') {
      return {
        Package: 'curl',
        Version: '3.2',
        SystemRequirements:
          'libcurl: libcurl-devel (rpm) or\nlibcurl4-openssl-dev (deb).'
      }
    }

    if (url === 'http://crandb.r-pkg.org/haven') {
      return {
        Package: 'haven',
        Version: '1.1.2',
        SystemRequirements: 'GNU make'
      }
    }

    if (url === 'http://crandb.r-pkg.org/rio') {
      return {
        Package: 'rio',
        Version: '0.5.10',
        Imports: {
          tools: '*',
          stats: '*',
          utils: '*',
          foreign: '*',
          haven: '>= 1.1.0',
          curl: '>= 0.6',
          'data.table': '>= 1.9.8',
          readxl: '>= 0.1.1',
          openxlsx: '*',
          tibble: '*'
        }
      }
    }

    if (url === 'http://crandb.r-pkg.org/car') {
      return {
        Package: 'rio',
        Version: '0.5.10',
        Imports: {
          abind: '*',
          MASS: '*',
          mgcv: '*',
          nnet: '*',
          pbkrtest: '>= 0.4-4',
          quantreg: '*',
          grDevices: '*',
          utils: '*',
          stats: '*',
          graphics: '*',
          maptools: '*',
          rio: '*',
          lme4: '*',
          nlme: '*'
        }
      }
    }

    if (url === 'http://crandb.r-pkg.org/gsl') {
      return {
        Author:
          'Robin K. S. Hankin; qrng functions by Duncan Murdoch and\nmultimin by Andrew Clausen',
        Date: '2016-12-14',
        'Date/Publication': '2017-01-05 11:13:10',
        Depends: {
          R: '>= 2.10.0'
        },
        Description:
          '\nAn R wrapper for the special functions and quasi random number\ngenerators of the Gnu Scientific Library\n(http://www.gnu.org/software/gsl/).  See gsl-package.Rd for details of\noverall package organization, and Misc.Rd for some functions that are\nwidely used in the package, and some tips on installation.',
        License: 'GPL (>= 2)',
        Maintainer: 'Robin K. S. Hankin <hankin.robin@gmail.com>',
        NeedsCompilation: 'yes',
        Package: 'gsl',
        Packaged: '2017-01-05 07:48:21 UTC; rksh',
        Repository: 'CRAN',
        SystemRequirements: 'Gnu Scientific Library version >= 1.12',
        Title: 'Wrapper for the Gnu Scientific Library',
        Version: '1.9-10.3',
        crandb_file_date: '2017-01-05 10:14:53',
        date: '2017-01-05T10:13:10+00:00',
        releases: []
      }
    }

    return {}
  }

  getPyPi(url: string): any {
    if (url === 'https://pypi.org/pypi/arrow/json') {
      return {
        info: {
          author: 'Joe Bloggs',
          author_email: 'joe.bloggs@example.com',
          project_url: 'http://www.example.com/project',
          classifiers: [
            'Development Status :: 5 - Production/Stable',
            'Intended Audience :: Developers',
            'License :: OSI Approved :: GNU Library or Lesser General Public License (LGPL)',
            'License :: OSI Approved :: Zope Public License',
            'Operating System :: Microsoft :: Windows',
            'Operating System :: Unix',
            'Programming Language :: C',
            'Programming Language :: Python',
            'Programming Language :: Python :: 2',
            'Programming Language :: Python :: 2.6',
            'Programming Language :: Python :: 2.7',
            'Programming Language :: Python :: 3',
            'Programming Language :: Python :: 3.2',
            'Programming Language :: Python :: 3.3',
            'Programming Language :: Python :: 3.4',
            'Programming Language :: Python :: 3.5',
            'Programming Language :: Python :: 3.6',
            'Programming Language :: Python :: Implementation :: CPython',
            'Programming Language :: SQL',
            'Topic :: Database',
            'Topic :: Database :: Front-Ends',
            'Topic :: Software Development',
            'Topic :: Software Development :: Libraries :: Python Modules'
          ],
          keywords: 'test keywords list',
          license: 'Free Software License',
          long_description:
            'This is the long description that will be used in priority over description',
          description: "This probably won't be used"
        }
      }
    }

    return {}
  }

  getNpmRegistry(url: string): any {
    if (url === 'https://registry.npmjs.org/is-sorted/latest') {
      return JSON.parse(fs.readFileSync(fixture('is-sorted.json'), 'utf8'))
    }

    if (url === 'https://registry.npmjs.org/array-swap/latest') {
      return JSON.parse(fs.readFileSync(fixture('array-swap.json'), 'utf8'))
    }

    if (url.indexOf('https://registry.npmjs.org/mkdirp/') !== -1) {
      return { name: 'mkdirp', version: '0.5.1' }
    }

    if (url.indexOf('https://registry.npmjs.org/is-array/') !== -1) {
      return { name: 'is-array', version: '1.0.1' }
    }

    if (url.indexOf('https://registry.npmjs.org/rimraf/') !== -1) {
      return { name: 'rimraf', version: '2.6.2' }
    }

    if (url.indexOf('https://registry.npmjs.org/array-swap/') !== -1) {
      return { name: 'array-swap', version: '0.0.2' }
    }

    return null
  }
}
