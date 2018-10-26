import fixture from './fixture'
import RParser from '../src/RParser'
import RGenerator from '../src/RGenerator'
import { SoftwareEnvironment, SoftwarePackage } from '@stencila/schema'

/**
 * When applied to an empty environment, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const environ = new SoftwareEnvironment()
  const generator = new RGenerator(environ)
  expect(await generator.generate(false)).toEqual('FROM ubuntu:16.04\n')
})

/**
 * When applied to an environment with R packages, generate should return
 * Dockerfile with R and the packages installed
 */
test('generate:packages', async () => {
  const pkg = new SoftwarePackage()
  pkg.name = 'ggplot2'
  pkg.runtimePlatform = 'R'

  const environ = new SoftwareEnvironment()
  environ.datePublished = '2017-01-01'
  environ.softwareRequirements = [pkg]
  
  const generator = new RGenerator(environ)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:16.04

ENV TZ="Etc/UTC" \\
    R_LIBS_USER="~/R"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common

RUN apt-add-repository \"deb https://mran.microsoft.com/snapshot/2017-01-01/bin/linux/ubuntu xenial/\" \\
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

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
RUN mkdir ~/R \\
 && bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"
`)
})

/**
 * When applied to a project with R packages that have system dependencies
 * adds the right apt packages to the Dockerfile
 */
test('generate:r-xml2', async () => {
  const folder = fixture('r-xml2')
  const environ = await new RParser(folder).parse() as SoftwareEnvironment
  const dockerfile = await new RGenerator(environ, folder).generate(false)
  expect(dockerfile).toEqual(`FROM ubuntu:16.04

ENV TZ="Etc/UTC" \\
    R_LIBS_USER="~/R"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common

RUN apt-add-repository \"deb https://mran.microsoft.com/snapshot/${environ.datePublished}/bin/linux/ubuntu xenial/\" \\
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      libxml2-dev \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .DESCRIPTION DESCRIPTION
RUN mkdir ~/R \\
 && bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"

COPY cmd.R cmd.R
COPY other.R other.R

CMD Rscript cmd.R
`)
})
