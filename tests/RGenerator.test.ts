import fixture from './fixture'
import RParser from '../src/RParser'
import RGenerator from '../src/RGenerator'
import { SoftwarePackage } from '@stencila/schema'

/**
 * When applied to an empty package, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const pkg = new SoftwarePackage()
  const generator = new RGenerator(pkg)
  expect(await generator.generate(false)).toEqual('FROM ubuntu:18.04\n')
})

/**
 * When applied to an environment with R packages, generate should return
 * Dockerfile with R and the packages installed
 */
test.skip('generate:packages', async () => {
  const pkg1 = new SoftwarePackage()
  pkg1.name = 'ggplot2'
  pkg1.runtimePlatform = 'R'

  const pkg2 = new SoftwarePackage()
  pkg2.runtimePlatform = 'R'
  pkg2.datePublished = '2017-01-01'
  pkg2.softwareRequirements = [pkg1]
  
  const generator = new RGenerator(pkg2)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

ENV TZ="Etc/UTC" \\
    R_LIBS_USER="~/R"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      curl \\
      software-properties-common

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-add-repository "deb https://mran.microsoft.com/snapshot/2017-01-01/bin/linux/ubuntu bionic-cran35/"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .DESCRIPTION DESCRIPTION

RUN mkdir -p ~/R && bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"
`)
})

/**
 * When applied to a project with R packages that have system dependencies
 * adds the right apt packages to the Dockerfile
 */
test.skip('generate:r-xml2', async () => {
  const folder = fixture('r-xml2')
  const pkg = await new RParser(folder).parse() as SoftwarePackage
  const dockerfile = await new RGenerator(pkg, folder).generate(false)
  expect(dockerfile).toEqual(`FROM ubuntu:18.04

ENV TZ="Etc/UTC" \\
    R_LIBS_USER="~/R"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      curl \\
      software-properties-common

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-add-repository "deb https://mran.microsoft.com/snapshot/${pkg.datePublished}/bin/linux/ubuntu bionic-cran35/"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      r-base \\
      libxml2-dev \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .DESCRIPTION DESCRIPTION

RUN mkdir -p ~/R && bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"

COPY cmd.R cmd.R
COPY other.R other.R

CMD Rscript cmd.R
`)
})
