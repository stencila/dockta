import fixture from './fixture'
import DockerGenerator from '../src/DockerGenerator'
import { SoftwareEnvironment, SoftwarePackage } from '../src/context';

/**
 * When applied to an empty environment, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const environ = new SoftwareEnvironment()
  const generator = new DockerGenerator(environ)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser
`)
})

/**
 * When applied to an environment with packages from several languages, generate should return
 * Dockerfile with R and the packages installed
 */
test('generate:packages', async () => {
  const pkg0 = new SoftwarePackage()
  pkg0.name = 'libxml2-dev'
  pkg0.runtimePlatform = 'deb'

  const pkg1 = new SoftwarePackage()
  pkg1.name = 'xml2'
  pkg1.runtimePlatform = 'R'
  pkg1.softwareRequirements = [pkg0]

  const pkg2 = new SoftwarePackage()
  pkg2.name = 'bokeh'
  pkg2.runtimePlatform = 'Python'

  const environ = new SoftwareEnvironment()
  environ.datePublished = '2017-01-01'
  environ.softwareRequirements = [pkg1, pkg2]
  
  const generator = new DockerGenerator(environ)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:16.04

ENV TZ="Etc/UTC"

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common

RUN apt-add-repository \"deb https://mran.microsoft.com/snapshot/2017-01-01/bin/linux/ubuntu xenial/\" \\
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      libxml2-dev \\
      python3 \\
      python3-pip \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .DESCRIPTION DESCRIPTION
RUN bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"
`)
})
