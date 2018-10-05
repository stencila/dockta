# node-docker

> 🔧 Add screenshot/gif: dir tree, then compile and execute?

> 🔧 Setup badges; add others

[![Docs](https://img.shields.io/badge/docs-API-blue.svg)](https://stencila.github.io/node-docker/)
[![NPM](http://img.shields.io/npm/v/@stencila/node-docker.svg?style=flat)](https://www.npmjs.com/package/@stencila/node-docker)
[![Build status](https://travis-ci.org/stencila/node-docker.svg?branch=master)](https://travis-ci.org/stencila/node-docker)
[![Code coverage](https://codecov.io/gh/stencila/node-docker/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/node-docker)
[![Dependency status](https://david-dm.org/stencila/node-docker.svg)](https://david-dm.org/stencila/node-docker)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

## Purpose

> 🔧 Add crosswalk table

## Install

> 🔧 Register package on NPM; add publishing and release commands to npm scripts and Makefile and travis.yml

```bash
npm install @stencila/node-docker
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
node-docker compile Dockerfile > environ.jsonld
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

The default CLI output format is JSON but you can get YAML, which is easier to read, by using the `--format=yaml` option. You can turn off building of the Docker image (to just extract meta-data) using `--build=false`. Use `node-docker compile --help` for more help.

#### Executing an environment



```bash
node-docker execute environ.jsonld
```

```bash
node-docker execute Dockerfile
```


## Develop

We 💕 contributions! To get started,

```bash
git clone https://github.com/stencila/node-docker
cd node-docker
npm install
```

Then take a look at the docs ([online](https://stencila.github.io/node-docker/) or inline) and start hacking! Please check that your changes pass linting and unit tests,

```bash
npm run lint
npm test
```

Or, if you prefer,

```bash
make lint test
```

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

Linting, test coverage, package building, and documentation generation are done on each push on [Travis CI](https://travis-ci.org/stencila/node-docker).

## See also

Related Stencila packages include:

- [`stencila/node-nix`](https://github.com/stencila/node-nix): compiles JSON-LD `SoftwareEnvironment` nodes to [NixOS](https://nixos.org/) environments
- [`stencila/node-kube`](https://github.com/stencila/node-kube): executes JSON-LD `SoftwareEnvironment` nodes on [Kubernetes](https://kubernetes.io/) clusters

Related external projects include:

- [`jupyter/repro2docker`](https://github.com/jupyter/repo2docker): _Turn git repositories into Jupyter enabled Docker Images_
- [`openshift/source-to-image`](https://github.com/openshift/source-to-image): _A toolkit and workflow for building reproducible Docker images from source code_

## FAQ

### What's with all the unicorns 🦄?

Unicorn emoji are used to indicate features that are in development or are planned. They're useful for sketching out what this package will eventually look like.

### Why is this a Node.js package?

We've implemented this as a Node.js package for easier integrration into Stecnila's Node.js based desktop and cloud deployments.
