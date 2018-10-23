# Dockter : a Docker image builder for researchers

[![Docs](https://img.shields.io/badge/docs-API-blue.svg)](https://stencila.github.io/dockter/)
[![NPM](http://img.shields.io/npm/v/@stencila/dockter.svg?style=flat)](https://www.npmjs.com/package/@stencila/dockter)
[![Build status](https://travis-ci.org/stencila/dockter.svg?branch=master)](https://travis-ci.org/stencila/dockter)
[![Code coverage](https://codecov.io/gh/stencila/dockter/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/dockter)
[![Dependency status](https://david-dm.org/stencila/dockter.svg)](https://david-dm.org/stencila/dockter)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila) [![Greenkeeper badge](https://badges.greenkeeper.io/stencila/dockter.svg)](https://greenkeeper.io/)

Docker is a good tool for creating reproducible computing environments. But creating truely reproducible Docker images can be difficult. Dockter aims to make it easier for researchers to create Docker images for their research projects. Dockter automatically creates and manages a Docker image for _your_ project based on _your_ source source code.

> 🦄 Features that are not yet implemented are indicated by unicorn emoji. Usually they have a link next to them, like this 🦄 [#2](https://github.com/stencila/dockter/issues/2), indicating the relevent issue where you can help make the feature a reality. It's [readme driven development](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html) with calls to action to chase after mythical vaporware creatures! So hip.

<!-- Automatically generated TOC. Don't edit, `make docs` instead>

<!-- toc -->

- [Features](#features)
  * [Automatically builds a Docker image for your project](#automatically-builds-a-docker-image-for-your-project)
    + [R](#r)
    + [Python](#python)
    + [Node.js](#nodejs)
    + [Jupyter](#jupyter)
  * [Efficiently handling of updates to project code](#efficiently-handling-of-updates-to-project-code)
  * [Generates structured meta-data for your project](#generates-structured-meta-data-for-your-project)
  * [Easy to pick up, easy to throw away](#easy-to-pick-up-easy-to-throw-away)
- [Install](#install)
  * [CLI](#cli)
  * [Package](#package)
- [Use](#use)
  * [CLI](#cli-1)
    + [Compiling an environment](#compiling-an-environment)
    + [Executing an environment](#executing-an-environment)
  * [Router and server](#router-and-server)
- [Architecture](#architecture)
- [Develop](#develop)
- [See also](#see-also)
- [FAQ](#faq)
- [Acknowledgments](#acknowledgments)

<!-- tocstop -->

## Features

### Automatically builds a Docker image for your project

Dockter scans your project folder and builds a Docker image for it. If the the folder already has a Dockerfile, then Dockter will build the image from that. If not, Dockter will scan the files in the folder, generate a `.Dockerfile` and build the image from that. How Dockter builds the image from your source code depends on the language.

#### R

If the folder contains a R [`DESCRIPTION`](http://r-pkgs.had.co.nz/description.html) file then Docker will build an image with the R packages listed under `Imports` installed. e.g.

```
Package: myrproject
Version: 1.0.0
Date: 2017-10-01
Imports:
   ggplot2
```

The `Package` and `Version` fields are required in a `DESCRIPTION` file. The `Date` field is used to define which CRAN snapshot to use. MRAN daily snapshots began [2014-09-08](https://cran.microsoft.com/snapshot/2014-09-08) so the date should be on or after that.

If the folder does not contain a `DESCRIPTION` file then Dockter will scan all the R files (files with the extension `.R` or `.Rmd`) in the folder for package import or usage statements, like `library(package)` and `package::function()`, and create a `.DESCRIPTION` file for you.

If the folder contains a `main.R` file, Dockter will set that to be the default script to run in any container created from the image.

#### Python

If the folder contains a 🦄 [#3](https://github.com/stencila/dockter/issues/3) [`requirements.txt`](https://pip.readthedocs.io/en/1.1/requirements.html) file, or a 🦄 [#4](https://github.com/stencila/dockter/issues/4) [`Pipfile`](https://github.com/pypa/pipfile), Dockter will copy it into the Docker image and use `pip` to install the specified packages.

If the folder does not contain either of those files then Dockter will 🦄 [#5](https://github.com/stencila/dockter/issues/5) scan all the folder's `.py` files for `import` statements and create a `.requirements.txt` file for you.

#### Node.js

If the folder contains a 🦄 [#7](https://github.com/stencila/dockter/issues/7) [`package.json`](https://docs.npmjs.com/files/package.json) file, Dockter will copy it into the Docker image and use `npm` to install the specified packages.

If the folder does not contain a `package.json` file, Dockter will 🦄 [#8](https://github.com/stencila/dockter/issues/8) scan all the folder's `.js` files for `import` or `require` statements and create a `.package.json` file for you.

#### Jupyter

If the folder contains any 🦄 [#9](https://github.com/stencila/dockter/issues/9) `.ipynb` files, Dockter will scan the code cells in those files for any Python `import` or R `library` statements and extract a list of package dependencies. It will also  🦄 [#10](https://github.com/stencila/dockter/issues/10) add Jupyter to the built Docker image.


### Efficiently handling of updates to project code

Docker layered filesystem has advantages but it can cause real delays when you are updating your project dependencies. For example, see [this issue](https://github.com/npm/npm/issues/11446) for the workarounds used by Node.js developers to prevent long waits when they update their `package.json`. The reason this happens is that when you update a requirements file Docker throws away all the susequent layers, including the one where you install all your package dependencies.

Here's a simple motivating [example](fixtures/tests/py-pandas) of a Dockerized Python project. It's got a [`pip`](https://pypi.org/project/pip/) `requirements.txt` file which specifies that the project requires `pandas` which, to ensure reproducibility, is pinned to version `0.23.0`,

```
pandas==0.23.0
```

The project has also got a `Dockerfile` that specifies which Python version we want, copies `requirements.txt` into the image, and installs the packages:

```Dockerfile
FROM python:3.7.0

COPY requirements.xt .
RUN pip install -r requirements.txt
```

You can build a Docker image for that project using Docker,

```bash
docker build .
```

Docker will download the base Python image (if you don't yet have it), and download five packages (`pandas` and it's four dependencies) and install them. This took over 9 minutes when we ran it.

Now, let's say that we want to do some plotting in our library, so we add `matplotlib` as a dependency in `requirements.txt`,

```
pandas==0.23.0
matplotlib==3.0.0
```

When we do `docker build .` again Docker notices that the `requirements.txt` file has changed and so throws away that layer and all subsequant ones. This means that it will download and install **all** the necesary packages again, including the ones that we previously installed - and takes longer than the first install. For a more contrieved illustration of this, simply add a space to a line in the `requirements.txt` file and notice how the package install gets repeated all over again.

Now, let's add a special `# dockter` comment to the Dockerfile before the `COPY` directive,

```Dockerfile
FROM python:3.7.0

# dockter

COPY requirements.xt .
RUN pip install -r requirements.txt
```

The comment is ignored by Docker but tells `dockter` to run all subsequent directives and commit them into a single layer,

```bash
dockter build .
```

> 🔧 Finish description of commit-based approach and illustrate speed up over normal Docker builds

### Generates structured meta-data for your project

Dockter has been built to expose a JSON-LD API so that it works with other tools. It will parse a Dockerfile into a JSON-LD [`SoftwareSourceCode`](https://schema.org/SoftwareSourceCode) node extracting meta-data about the Dockerfile and build it into a `SoftwareEnvironment` node with links to the source files and the build image.

> 🔧 Illustrate how this is done for all project sources including non Dockerfiles

> 🔧 Replace this JSON-LD with final version

```json
{
  "@context": "https://schema.stenci.la",
  "type": "SoftwareSourceCode",
  "id": "https://hub.docker.com/#sha256:27d6e441706e89dac442c69c3565fc261b9830dd313963cb5488ba418afa3d02",
  "author": [],
  "text": "FROM busybox\nLABEL description=\"Prints the current date and time at UTC, to the nearest second, in ISO-8601 format\" \\\n      author=\"Nokome Bentley <nokome@stenci.la>\"\nCMD date -u -Iseconds\n",
  "programmingLanguage": "Dockerfile",
  "messages": [],
  "description": "Prints the current date and time at UTC, to the nearest second, in ISO-8601 format"
}
```

### Easy to pick up, easy to throw away

Dockter is designed to make it easier to get started creating Docker images for your project. But it's also designed not to get in your way or restrict you from using bare Docker. You can easily and individually override any of the steps that Dockter takes to build an image. 

- *Code analysis*: To stop Dockter doing code analysis and take over specifying your project's package dependencies, just remove the leading '.' from the `.DESCRIPTION`, `.requirements.txt` or `.package.json` file that Dockter generates. 

- *Dockerfile generation*: Dockter aims to generate readable Dockerfiles that conform to best practices. They're a good place to start learning how to write your own Dockerfiles. To stop Dockter generating a `.Dockerfile`, and start editing it yourself, just rename it to `Dockerfile`.

- *Image build*: Dockter manage builds use a special comment in the `Dockerfile`, so you can stop using Dockter alltogether and build the same image using Docker (it will just take longer if you change you project dependencies).


## Install

Dockter is available as pre-compiled, standalone command line tool (CLI), or as a Node.js package. In both cases, if you want to use Dockter to build Docker images, you will need to [install Docker](https://docs.docker.com/install/) if you don't already have it.

### CLI

Download the command line interface (CLI) as a pre-compiled, standalone binary for Windows, MacOS or Linux from the [releases page](https://github.com/stencila/dockter/releases).

### Package

If you want to integrate Dockter into another application or package, it is also available as a Node.js package :

```bash
npm install @stencila/dockter
```

## Use

### CLI

The command line tool has three primary commands `compile`, `build` and `execute`. To get an overview of the commands available use the `--help` option i.e.

```bash
dockter --help
```

To get more detailed help on a particular command, also include the command name e.g

```bash
dockter compile --help
```

#### Compile a project

The `compile` command compiles a project folder into a specification of a software environment. It scans the folder for source code and package requirement files, parses them, and 🦄 creates an `.environ.jsonld` file. This file contains the information needed to build a Docker image for your project.

For example, let's say your project folder has a single R file, `main.R` which uses the R package `lubridate` to print out the current time:

```R
lubridate::now()
```

Let's compile that project and inspect the compiled software environment. Change into the project directory and run the `compile` command. The default output format is JSON but you can get YAML, which is easier to read, by using the `--format=yaml` option.

```bash
dockter compile --format=yaml
```

The output from this command is a YAML document describing the project's software environment including it's dependencies (in this case just `lubridate`). The environment's name is taken from the name of the folder, in this case `rdate`.

```yaml
name: rdate
datePublished: '2018-10-21'
softwareRequirements:
  - description: |-
      Functions to work with date-times and time-spans: fast and user
      friendly parsing of date-time data, extraction and updating of components of
      a date-time (years, months, days, hours, minutes, and seconds), algebraic
      manipulation on date-time and time-span objects. The 'lubridate' package has
      a consistent and memorable syntax that makes working with dates easy and
      fun.
      Parts of the 'CCTZ' source code, released under the Apache 2.0 License,
      are included in this package. See <https://github.com/google/cctz> for more
      details.
    name: lubridate
    urls:
      - 'http://lubridate.tidyverse.org'
      - |-

        https://github.com/tidyverse/lubridate
    authors:
      - &ref_0
        givenNames:
          - Vitalie
        familyNames:
          - Spinu
        name: Vitalie Spinu
...
```

#### Build a Docker image

Usually, you'll compile and build a Docker image for your project in one step using the `build` command. This takes the output of the `compile` command, generates a `.Dockerfile` for it and gets Docker to build that image.

```bash
dockter build
```

After the image has finished building you should have a new docker image on your machine, called `rdate`:

```bash
> docker images
REPOSITORY        TAG                 IMAGE ID            CREATED              SIZE
rdate             latest              545aa877bd8d        About a minute ago   766MB
```

#### Execute a Docker image

You can use Docker to run the created image. Or use Dockter's `execute` command to compile, build and run your docker image in one step:

```bash
> dockter execute
2018-10-23 00:58:39
```

### Router and server

The [Express](https://expressjs.com) router provides `PUT /compile` and `PUT /execute` endpoints (which do the same thing as the corresponding CLI commands). You can serve them using,

```bash
npm start
```

Or, during development using,

```bash
npm run server
```

A minimal example of how to integrate the router into your own Express server,

```js
const app = require('express')()
const { docker } = require('@stencila/dockter')

const app = express()
app.use('/docker', docker)
app.listen(3000)
```

## Architecture

Dockter implements a compiler design pattern. Source files are _parsed_ into a `SoftwareEnvironment` instance (the equivalent of an AST (Abstract Syntax Tree) in other programming language compilers) which is then used to generate a `Dockerfile` which is then built into a Docker image.

The parser classes e.g. `PythonParser`, `RParser` scan for relevant source files and generate `SoftwareEnvironment` instances.
The generator classes e.g. `PythonGenerator`, `RGenerator` generates a `Dockerfile` for a given `SoftwareEnvironment`.
`DockerGenerator` is a super-generator which combines the other generators.
`DockerBuilder` class builds 
`DockerCompiler` links all of these together.

For example, if a folder has single file in it `code.py`, `PythonParser` will parse that file and create a `SoftwareEnvironment` instance, which `DockerGenerator` uses to generate a `Dockerfile`, which `DockerBuilder` uses to build a Docker image.

## Develop

We 💕 contributions! To get started,

```bash
git clone https://github.com/stencila/dockter
cd dockter
npm install
```

To run the CLI during development use, `npm run cli -- <args>` e.g.

```bash
npm run cli -- compile tests/fixtures/dockerfile-date/Dockerfile
```

This uses `ts-node` to compile and run Typescript on the fly so that you don't need to do a build step first.

### Linting and testing

Then take a look at the docs ([online](https://stencila.github.io/dockter/) or inline) and start hacking! Please check that your changes pass linting and unit tests,

```bash
npm run lint # or, make lint
npm test # or, make text
```

Use `npm test -- <test file path>` to run a single test file

You can setup a Git pre-commit hook to perform these checks automatically before each commit using `make hooks`.

Check that any changes you've made are covered 🏅 by unit tests using,

```bash
npm run cover # or, make cover
open coverage/lcov-report/index.html
```

### Documentation generation

If you've been working on in-code documentation 🙏 you can check that by building and viewing the docs,

```bash
npm run docs # or, make docs
open docs/index.html
```

### Commit messages

Please use [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) style commit messages e.g. `docs(readme): fixed spelling mistake`. This help with automated semantic versioning. To make this easier, [Commitzen](http://commitizen.github.io/cz-cli/) is a development dependency and can be used via `npm` or `make`:

```bash
npm run commit # or, make commit
```

### Continuous integration

Linting, test coverage, binary builds, package builds, and documentation generation are done on each push on [Travis CI](https://travis-ci.org/stencila/dockter). [`semantic-release`](https://github.com/semantic-release/semantic-release) is enabled to automate version management, Github releases and NPM package publishing.


## See also

Related Stencila packages include:

- 🦄 [`stencila/tunix`](https://github.com/stencila/tunix): compiles JSON-LD `SoftwareEnvironment` nodes to [NixOS](https://nixos.org/) environments
- 🦄 [`stencila/kubex`](https://github.com/stencila/kubex): executes JSON-LD `SoftwareEnvironment` nodes on [Kubernetes](https://kubernetes.io/) clusters

There are several projects that create Docker images from source code and/or requirements files:

- [`alibaba/derrick`](https://github.com/alibaba/derrick)
- [`jupyter/repo2docker`](https://github.com/jupyter/repo2docker)
- [`Gueils/whales`](https://github.com/Gueils/whales)
- [`o2r-project/containerit`](https://github.com/o2r-project/containerit)
- [`openshift/source-to-image`](https://github.com/openshift/source-to-image)
- [`ViDA-NYU/reprozip`](https://github.com/ViDA-NYU/reprozip])

Dockter is similar to `repo2docker`, `containerit`, and `reprozip` in that it is aimed at researchers doing data analysis (and supports R) whereas most other tools are aimed at software developers (and don't support R). Dockter differs to these projects principally in that by default (but optionally) it installs the necessary Stencila language packages so that the image can talk to Stencila client interfaces an provide code execution services. Like `repo2docker` it allows for multi-language images but has the additional features of package dependency analysis of source code, managed builds and generated of image meta-data.

## FAQ

*Why is this a Node.js package?*

We've implemented this as a Node.js package for easier integration into Stencila's Node.js based desktop and cloud deployments.

## Acknowledgments

Dockter was inspired by similar tools for researchers including [`binder`](https://github.com/binder-project/binder) and [`repo2docker`](https://github.com/jupyter/repo2docker). It relies on [`dockerode`](https://www.npmjs.com/package/dockerode), [`docker-file-parser`](https://www.npmjs.com/package/docker-file-parser), and of course [Docker](https://www.docker.com/).
