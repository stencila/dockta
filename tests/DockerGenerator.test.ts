import { SoftwareEnvironment, SoftwarePackage } from '@stencila/schema'

import DockerGenerator from '../src/DockerGenerator'
import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

/**
 * When applied to an empty environment, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const environ = new SoftwareEnvironment()
  const generator = new DockerGenerator(urlFetcher, environ)
  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.10

RUN useradd --create-home --uid 1001 -s /bin/bash docktauser
WORKDIR /home/docktauser

USER docktauser
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
  pkg2.softwareRequirements = []

  const environ = new SoftwareEnvironment()
  environ.datePublished = '2017-01-01'
  environ.softwareRequirements = [pkg1, pkg2]

  const generator = new DockerGenerator(urlFetcher, environ)
  expect(generator.aptPackages('18.04')).toEqual(['libxml2-dev', 'python3', 'python3-pip', 'r-base'])
})
