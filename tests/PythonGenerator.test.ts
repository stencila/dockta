import { SoftwarePackage } from '@stencila/schema'
import PythonGenerator from '../src/PythonGenerator'
import fs from 'fs'
import fixture from './fixture'

/**
 * When applied to an empty package, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const pkg = new SoftwarePackage()
  const generator = new PythonGenerator(pkg)
  expect(await generator.generate(false)).toEqual('FROM ubuntu:18.04\n')
})

/**
 * If the folder passed to the generator has requirements, copy that to
 * the docker container and use for install
 */
test.skip('generate:pydate', async () => {
  const arrowPackage = new SoftwarePackage()
  arrowPackage.name = 'arrow'
  arrowPackage.version = '==0.12.1'
  arrowPackage.runtimePlatform = 'Python'

  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'
  pkg.softwareRequirements = [arrowPackage]

  const generator = new PythonGenerator(pkg, fixture('py-date'))

  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python3 \\
      python3-pip \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir https://github.com/stencila/py/archive/91a05a139ac120a89fc001d9d267989f062ad374.zip

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY requirements.txt requirements.txt

RUN pip3 install --user --requirement requirements.txt

COPY cmd.py cmd.py

CMD python3  cmd.py
`)
  
  expect(fs.existsSync(fixture('py-date/.requirements.txt'))).toBe(false)
})

/**
 * If the environ passed to the generator does not have requirements, but there is a `requirements.txt`, then copy that
 * file into the container and use it for installing the requirements
 */
test.skip('generate:requirements-file', async () => {
  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'

  const generator = new PythonGenerator(pkg, fixture('py-date'), 2)

  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python \\
      python-pip \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY requirements.txt requirements.txt

RUN pip install --user --requirement requirements.txt

COPY cmd.py cmd.py

CMD python cmd.py
`)
})

/**
 * If the environ passed to the generator has a Python package that requires extra system (apt) packages to be
 * installed, these should be found and added to the apt-get install lines
 */
test.skip('generate:requirements-file', async () => {
  const pygit2 = new SoftwarePackage()
  pygit2.name = 'pygit2'
  pygit2.version = '==0.27.0'
  pygit2.runtimePlatform = 'Python'

  const pkg = new SoftwarePackage()
  pkg.runtimePlatform = 'Python'
  pkg.softwareRequirements = [pygit2]

  const generator = new PythonGenerator(pkg, fixture('py-date'), 2)

  expect(await generator.generate(false)).toEqual(`FROM ubuntu:18.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python \\
      python-pip \\
      libgit2-dev \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir https://github.com/stencila/py/archive/91a05a139ac120a89fc001d9d267989f062ad374.zip

RUN useradd --create-home --uid 1001 -s /bin/bash dockteruser
USER dockteruser
WORKDIR /home/dockteruser

# dockter

COPY .requirements.txt requirements.txt

RUN pip install --user --requirement requirements.txt

COPY cmd.py cmd.py

CMD python  cmd.py
`)
})
