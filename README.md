> 🔧 This is a work in progress, to do items are noted like this

# dockter

> Reproducible Docker images without the wait

> 🔧 Add logo (something with a whale and a doctor?)

[![Docs](https://img.shields.io/badge/docs-API-blue.svg)](https://stencila.github.io/dockter/)
[![NPM](http://img.shields.io/npm/v/@stencila/dockter.svg?style=flat)](https://www.npmjs.com/package/@stencila/dockter)
[![Build status](https://travis-ci.org/stencila/dockter.svg?branch=master)](https://travis-ci.org/stencila/dockter)
[![Code coverage](https://codecov.io/gh/stencila/dockter/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/dockter)
[![Dependency status](https://david-dm.org/stencila/dockter.svg)](https://david-dm.org/stencila/dockter)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

> 🔧 Setup these badges; add others

> 🔧 Add TOC


## Features

### More efficient Dockerfile updates

```Dockerfile
FROM python:3.7.0

COPY requirements.xt
RUN pip install -r requirements.txt
```

```bash
dockter build .
```

> 🔧 Finish description of commit-based approach and illustrate speed up over normal Docker builds

For example, see [this issue](https://github.com/npm/npm/issues/11446) as an example of the workarounds used by Node.js developers.

### JSON-LD based API

Dockter has been built to expose a JSON-LD API so that it works with other tools. It will parse a Dockerfile into a JSON-LD [`SoftwareSourceCode`](https://schema.org/SoftwareSourceCode) node extracting meta-data about the Dockerfile and build it into a `SoftwareEnvironment` node with links to the source files and the build image.

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

## Install

Dockter is available as pre-compiled, standalone command line tool, or as an Node.js package.

### CLI

> 🔧 Add `pkg`-based binary builds
> 🔧 Add download instructions

### Package

> 🔧 Register package on NPM; add publishing and release commands to npm scripts and Makefile and travis.yml

```bash
npm install @stencila/dockter
```

You will need to [install Docker](https://docs.docker.com/install/) if you don't already have it on your system.

> 🔧 Allow for the use of a remote Docker daemon for building images

## Use

This package is primarily designed to be used a compiler service within a Stencila deployment (e.g. `stencila/cloud`). But you can also use it standalone via the API or command line interface. 

### CLI

The command line interface (CLI) is a good way to get an understanding of what this package does. Essentially, it just exposes the compiler API on the command line.

#### Compiling an environment

The most basic thing that this package does is to read a `Dockerfile`, parse it to extract metadata, build a Docker image for it, and run that image as a Docker container.

Here's a very simple example `Dockerfile`. It uses the tiny `busybox` image as a base, adds some meta-data about the image, and then specifies the command to run to print out the date.

```Dockerfile
FROM busybox
LABEL description="Returns the current date and time at UTC, to the nearest second, in ISO-8601 format" \
      author="Nokome Bentley <nokome@stenci.la>"
CMD date -u -Iseconds
```

You can use the `compile` command to a Dockerfile like this into a JSON-LD `SoftwareEnvironment` node,

```bash
dockter compile Dockerfile > environ.jsonld
```

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

> 🔧 Replace this JSON output when a more final version available.

The default CLI output format is JSON but you can get YAML, which is easier to read, by using the `--format=yaml` option. You can turn off building of the Docker image (to just extract meta-data) using `--build=false`. Use `dockter compile --help` for more help.

#### Executing an environment

```bash
dockter execute environ.jsonld
```

```bash
dockter execute Dockerfile
```

### R

To define an R environment create a `DESCRIPTION` file.

```
Package: myrproject
Version: 1.0.0
Date: 2017-10-01
Imports:
   ggplot2
```

The `Package` and `Version` fields are required. The package . For more on authoring R package `DESCRIPTION` files see [this](http://r-pkgs.had.co.nz/description.html).

MRAN daily snapshots began [2014-09-08](https://cran.microsoft.com/snapshot/2014-09-08). If you specify a data before that you'll get a build error  🦄.

## Router and server

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

## Crosswalks

> 🔧 Add crosswalk table for Dockerfile LABEL and MAINTAINER directives

> 🔧 Add crosswalk table for http://label-schema.org/rc1/

## Develop

We 💕 contributions! To get started,

```bash
git clone https://github.com/stencila/dockter
cd dockter
npm install
```

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

If you've been working on in-code documentation 🙏 you can check that by building and viewing the docs,

```bash
npm run docs # or, make docs
open docs/index.html
```

Linting, test coverage, package building, and documentation generation are done on each push on [Travis CI](https://travis-ci.org/stencila/dockter).

To run the CLI during development use, `npm run cli -- <args>` e.g.

```bash
npm run cli -- compile tests/fixtures/dockerfile-date/Dockerfile
```

This uses `ts-node` to compile and run Typescript on the fly so that you don't need to do a build step first.

## See also

Related Stencila packages include:

- 🦄 [`stencila/tunix`](https://github.com/stencila/tunix): compiles JSON-LD `SoftwareEnvironment` nodes to [NixOS](https://nixos.org/) environments
- 🦄 [`stencila/kubex`](https://github.com/stencila/kubex): executes JSON-LD `SoftwareEnvironment` nodes on [Kubernetes](https://kubernetes.io/) clusters

Related external projects include:

- [`jupyter/repro2docker`](https://github.com/jupyter/repo2docker): _Turn git repositories into Jupyter enabled Docker Images_
- [`openshift/source-to-image`](https://github.com/openshift/source-to-image): _A toolkit and workflow for building reproducible Docker images from source code_

## FAQ

### What's with all the unicorns 🦄?

Unicorn emoji are used to indicate features that are in development or are planned. They're useful for sketching out what this package will eventually look like.

### Why is this a Node.js package?

We've implemented this as a Node.js package for easier integration into Stencila's Node.js based desktop and cloud deployments.

## Acknowledgments

Dockter was inspired by similar tools including [`binder`](https://github.com/binder-project/binder), [`repro2docker`](https://github.com/jupyter/repo2docker), and [`source-to-image`](https://github.com/openshift/source-to-image). It relies on [`dockerode`](https://www.npmjs.com/package/dockerode), [`docker-file-parser`](https://www.npmjs.com/package/docker-file-parser), and of course [Docker](https://www.docker.com/).
