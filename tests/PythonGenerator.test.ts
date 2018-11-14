import { SoftwarePackage } from '@stencila/schema'
import PythonGenerator from '../src/PythonGenerator'
import fs from 'fs'
import { fixture, expectedFixture, cleanup } from './test-functions'

import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

/**
 * When applied to an empty package, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const pkg = new SoftwarePackage()
  const generator = new PythonGenerator(urlFetcher, pkg)
  expect(await generator.generate(false)).toEqual('FROM ubuntu:18.04\n')
})

/**
 * If the folder passed to the generator has requirements, copy that to
 * the docker container and use for install
 */
test('generate:requirements', async () => {
  cleanup(['py-generator-generated/.Dockerfile', 'py-generator-generated/.requirements.txt'])

  const arrowPackage = new SoftwarePackage()
  arrowPackage.name = 'arrow'
  arrowPackage.version = '==0.12.1'
  arrowPackage.runtimePlatform = 'Python'

  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'
  pkg.softwareRequirements = [arrowPackage]

  const generator = new PythonGenerator(urlFetcher, pkg, fixture('py-generator-generated'))

  expect(await generator.generate(false, true)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python3 \\
      python3-pip \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir https://github.com/stencila/py/archive/91a05a139ac120a89fc001d9d267989f062ad374.zip

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .requirements.txt requirements.txt

RUN pip3 install --user --requirement requirements.txt

COPY cmd.py cmd.py

USER dockteruser

CMD python3 cmd.py
`)

  expectedFixture(fixture('py-generator-generated'), '.requirements.txt')

  expect(fs.existsSync(fixture('py-date/.requirements.txt'))).toBe(false)

  cleanup(['py-generator-generated/.Dockerfile', 'py-generator-generated/.requirements.txt'])
})

/**
 * If the environ passed to the generator does not have requirements, but there is a `requirements.txt`, then copy that
 * file into the container and use it for installing the requirements
 */
test('generate:requirements-file', async () => {
  cleanup(['py-generator-existing/.Dockerfile'])
  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'

  const generator = new PythonGenerator(urlFetcher, pkg, fixture('py-generator-existing'), 2)

  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python \\
      python-pip \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
WORKDIR /home/dockteruser

# dockter

COPY requirements.txt requirements.txt

RUN pip install --user --requirement requirements.txt

COPY cmd.py cmd.py

USER dockteruser

CMD python cmd.py
`)

  // it should not generate a .requirements.txt
  expect(fs.existsSync(fixture('py-generator-existing/.requirements.txt'))).toBeFalsy()
  cleanup(['py-generator-existing/.Dockerfile'])
})

/**
 * If the environ passed to the generator has a Python package that requires extra system (apt) packages to be
 * installed, these should be found and added to the apt-get install lines
 */
test('generate:apt-packages', async () => {
  cleanup(['py-generator-generated/.Dockerfile', 'py-generator-generated/.requirements.txt'])
  const pygit2 = new SoftwarePackage()
  pygit2.name = 'pygit2'
  pygit2.version = '==0.27.0'
  pygit2.runtimePlatform = 'Python'

  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'
  pkg.softwareRequirements = [pygit2]

  const generator = new PythonGenerator(urlFetcher, pkg, fixture('py-generator-generated'), 2)

  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python \\
      python-pip \\
      libgit2-dev \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .requirements.txt requirements.txt

RUN pip install --user --requirement requirements.txt

COPY cmd.py cmd.py

USER dockteruser

CMD python cmd.py
`)
  cleanup(['py-generator-generated/.Dockerfile', 'py-generator-generated/.requirements.txt'])
})
