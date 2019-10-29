import { fixture } from './test-functions'
import RGenerator from '../src/RGenerator'
import { SoftwarePackage } from '@stencila/schema'
import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

/**
 * When applied to an empty package, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const pkg = new SoftwarePackage()
  const generator = new RGenerator(urlFetcher, pkg)
  expect(await generator.generate(false)).toEqual('FROM ubuntu:18.10\n')
})

/**
 * When applied to an environment with R packages, generate should return
 * Dockerfile with R and the packages installed
 */
test('generate:packages', async () => {
  const pkg1 = new SoftwarePackage()
  pkg1.name = 'ggplot2'
  pkg1.runtimePlatform = 'R'

  const pkg2 = new SoftwarePackage()
  pkg2.runtimePlatform = 'R'
  pkg2.datePublished = '2017-01-01'
  pkg2.softwareRequirements = [pkg1]

  const generator = new RGenerator(urlFetcher, pkg2)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.10

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      curl \\
      software-properties-common

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-add-repository "deb https://mran.microsoft.com/snapshot/2017-01-01/bin/linux/ubuntu cosmic-cran35/"

ENV TZ="Etc/UTC"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN id -u guest >/dev/null 2>&1 || useradd --create-home --uid 1001 -s /bin/bash guest
WORKDIR /home/guest

# dockta

COPY .DESCRIPTION DESCRIPTION

RUN bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockta/src/install.R)"

USER guest
`)
})

/**
 * When applied to a project with R packages that have system dependencies
 * adds the right apt packages to the Dockerfile
 */
test('generate:r-xml2', async () => {
  const folder = fixture('r-xml2')
  const pkg = new SoftwarePackage()
  pkg.name = 'rxml2'
  pkg.datePublished = '2018-11-11'
  pkg.runtimePlatform = 'R'

  const xml2DevPackage = new SoftwarePackage()
  xml2DevPackage.name = 'libxml2-dev'
  xml2DevPackage.runtimePlatform = 'deb'

  const xml2Package = new SoftwarePackage()
  xml2Package.name = 'xml2'
  xml2Package.runtimePlatform = 'R'

  xml2Package.softwareRequirements = [
    xml2DevPackage
  ]

  pkg.softwareRequirements = [
    xml2Package
  ]

  const dockerfile = await new RGenerator(urlFetcher, pkg, folder).generate(false)
  expect(dockerfile).toEqual(`FROM ubuntu:18.10

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      curl \\
      software-properties-common

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-add-repository "deb https://mran.microsoft.com/snapshot/${pkg.datePublished}/bin/linux/ubuntu cosmic-cran35/"

ENV TZ="Etc/UTC"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      r-base \\
      libxml2-dev \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN id -u guest >/dev/null 2>&1 || useradd --create-home --uid 1001 -s /bin/bash guest
WORKDIR /home/guest

# dockta

COPY .DESCRIPTION DESCRIPTION

RUN bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockta/src/install.R)"

COPY main.R main.R
COPY other.R other.R

USER guest

CMD Rscript main.R
`)
})
