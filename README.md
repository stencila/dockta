# Dockta: a container image builder for researchers

[![All Contributors](https://img.shields.io/badge/all_contributors-7-orange.svg?style=flat-square)](#contributors)
[![Build status](https://travis-ci.org/stencila/dockta.svg?branch=master)](https://travis-ci.org/stencila/dockta)
[![Code coverage](https://codecov.io/gh/stencila/dockta/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/dockta)
[![NPM](http://img.shields.io/npm/v/@stencila/dockta.svg?style=flat)](https://www.npmjs.com/package/@stencila/dockta)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://stencila.github.io/dockta/)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

Docker is a useful tool for creating reproducible computing environments. But creating truly reproducible Docker images can be difficult - even if you already know how to write a `Dockerfile`.

Dockta makes it easier for researchers to create Docker images for their research projects. Dockta generates a `Dockerfile` and builds a image, for _your_ project, based on _your_ source code.

<!-- Automatically generated TOC. Don't edit, `make docs` instead>

<!-- toc -->

- [Features](#features)
  * [Builds a Docker image based on your source code](#builds-a-docker-image-based-on-your-source-code)
    + [R](#r)
    + [Python](#python)
    + [Node.js](#nodejs)
    + [JATS](#jats)
    + [Jupyter](#jupyter)
  * [Automatically determines system requirements](#automatically-determines-system-requirements)
  * [Faster re-installation of language packages](#faster-re-installation-of-language-packages)
  * [Generates structured meta-data for your project](#generates-structured-meta-data-for-your-project)
  * [Easy to pick up, easy to throw away](#easy-to-pick-up-easy-to-throw-away)
- [Demo](#demo)
- [Install](#install)
- [Use](#use)
  * [Compile a project](#compile-a-project)
  * [Build a Docker image](#build-a-docker-image)
  * [Execute a Docker image](#execute-a-docker-image)
  * [Docter who?](#docter-who)
  * [Predefined images](#predefined-images)
    + [Image versions](#image-versions)
    + [Getting the images](#getting-the-images)
    + [Running the images](#running-the-images)
    + [Extending the images](#extending-the-images)
- [Contributors](#contributors)
- [See also](#see-also)
- [FAQ](#faq)
- [Acknowledgments](#acknowledgments)

<!-- tocstop -->

## Features

> 🦄 Features that are planned, but not yet implemented, are indicated by unicorn emoji. Usually they have a link next to them, like this 🦄 [#2](https://github.com/stencila/dockta/issues/2), indicating the relevant issue where you can help make the feature a reality. It's [readme driven development](http://tom.preston-werner.com/2010/08/23/readme-driven-development.html) with calls to action to chase after mythical vaporware creatures! So hip.

### Builds a Docker image based on your source code

Dockta scans your project and builds a custom Docker image for it. If the the folder already has a `Dockerfile`, Dockta will build the image from that. If not, Dockta will scan the source code files in the folder and generate one for you. Dockta currently handles R, Python and Node.js source code. A project can have a mix of these languages.

#### R

If the folder contains a R package [`DESCRIPTION`](http://r-pkgs.had.co.nz/description.html) file then Dockta will install the R packages listed under `Imports` into the image. e.g.

```
Package: myrproject
Version: 1.0.0
Date: 2017-10-01
Imports:
   ggplot2
```

The `Package` and `Version` fields are required in a `DESCRIPTION` file. The `Date` field is used to define which CRAN snapshot to use. MRAN daily snapshots began [2014-09-08](https://cran.microsoft.com/snapshot/2014-09-08) so the date should be on or after that.

If the folder does not contain a `DESCRIPTION` file then Dockta will scan all the R files (files with the extension `.R` or `.Rmd`) in the folder for package import or usage statements, like `library(package)` and `package::function()`, and create a `.DESCRIPTION` file for you.

#### Python

If the folder contains a [`requirements.txt`](https://pip.readthedocs.io/en/1.1/requirements.html) file, or a 🦄 [#4](https://github.com/stencila/dockta/issues/4) [`Pipfile`](https://github.com/pypa/pipfile), Dockta will copy it into the Docker image and use `pip` to install the specified packages.

If the folder does not contain either of those files then Dockta will scan all the folder's `.py` files for `import` statements and create a `.requirements.txt` file for you.

#### Node.js

If the folder contains a [`package.json`](https://docs.npmjs.com/files/package.json) file, Dockta will copy it into the Docker image and use `npm` to install the specified packages.

If the folder does not contain a `package.json` file, Dockta will scan all the folder's `.js` files for `require` calls and create a `.package.json` file for you.

#### JATS

If the folder contains any [JATS](https://en.wikipedia.org/wiki/Journal_Article_Tag_Suite) files (`.xml` files with `<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) ...`), 🦄 [#52](https://github.com/stencila/dockta/issues/52) Docker will scan reproducible elements defined in the [Dar JATS extension](https://github.com/substance/dar/blob/master/DarArticle.md) for any package import statements (e.g. Python `import`, R `library`, or Node.js `require`) and install the necessary packages into the image.

#### Jupyter

If the folder contains any Jupyter [`.ipynb`](http://jupyter.org/) files, 🦄 [#9](https://github.com/stencila/dockta/issues/9) Dockta will scan the code cells in those files for any package import statements (e.g. Python `import`, R `library`, or Node.js `require`) and install the necessary packages into the image. It will also 🦄 [#10](https://github.com/stencila/dockta/issues/10) add the necessary Jupyter kernels to the built Docker image.

### Automatically determines system requirements

One of the headaches researchers face when hand writing Dockerfiles is figuring out which system dependencies your project needs. Often this involves a lot of trial and error.

Dockta automatically checks if any of your dependencies (or dependencies of dependencies, or dependencies of...) requires system packages and installs those into the image. For example, let's say you have a project with an R script that requires the `rgdal` package for geospatial analyses,

```R
library(rgdal)
```

When you run `dockta compile` in this project, Dockta will generate a `Dockerfile` with the following section which installs R, plus the three system dependencies required `gdal-bin`, `libgdal-dev`, and `libproj-dev`:

```Dockerfile
# This section installs system packages required for your project
# If you need extra system packages add them here.
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      gdal-bin \
      libgdal-dev \
      libproj-dev \
      r-base \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
```

For R, Dockta does this by querying the https://sysreqs.r-hub.io/ database. For Python, Dockta includes a mapping of system requirements of packages that users can [contribute to](CONTRIBUTING.md#python-system-dependencies).

No more trial and error of build, fail, add dependency, repeat... cycles!

### Faster re-installation of language packages

If you have built a Docker image before, you'll know that it can be frustrating waiting for _all_ your project's dependencies to reinstall when you simply add or remove one of them.

The reason this happens is that, due to Docker's layered filesystem, when you update a requirements file, Docker throws away all the subsequent layers - including the one where you previously installed your dependencies. That means that all those packages need to get reinstalled.

Dockta takes a different approach. It leaves the installation of language packages to the language package managers: Python's [`pip`](https://pypi.org/project/pip/) , Node.js's `npm`, and R's `install.packages`. These package managers are good at the job they were designed for - to check which packages need to be updated and to only update them. The result is much faster rebuilds, especially for R packages, which often involve compilation.

Dockta does this by looking for a special `# dockta` comment in a `Dockerfile`. Instead of throwing away subsequent image layers, it executes all instructions after this comment in the same layer - thus reusing packages that were previously installed.

Here's a simple motivating [example](fixtures/tests/py-pandas). It's a Python project with a `requirements.txt` file which specifies that the project depends upon `pandas` which, to ensure reproducibility, is pinned to version `0.23.0`,

```
pandas==0.23.0
```

The project also has a `Dockerfile` which specifies which Python version we want to use, copies `requirements.txt` into the image, and uses `pip` to install the packages:

```Dockerfile
FROM python:3.7.0

COPY requirements.txt .
RUN pip install -r requirements.txt
```

You could build a Docker image for that project using Docker,

```bash
docker build .
```

Docker will download the base Python image (if you don't yet have it), download five packages (`pandas` and it's four dependencies) and install them. This took over 9 minutes when we ran it.

Now, let's say that we want to get the latest version of `pandas` and increment the version in the `requirements.txt` file,

```
pandas==0.23.1
```

When we do `docker build .` again to update the image, Docker notices that the `requirements.txt` file has changed and so throws away that layer and all subsequent ones. This means that it will download and install _all_ the necessary packages again, including the ones that we previously installed. For a more contrived illustration of this, simply add a space to one of the lines in the `requirements.txt` file and notice how the package install gets repeated all over again.

Now, let's add a special `# dockta` comment to the Dockerfile before the `COPY` directive,

```Dockerfile
FROM python:3.7.0

# dockta

COPY requirements.xt .
RUN pip install -r requirements.txt
```

The comment is ignored by Docker but tells `dockta` to run all subsequent instructions in a single filesystem layer,

```bash
dockta build .
```

Now, if you change the `requirements.txt` file, instead of reinstalling everything again, `pip` will only reinstall what it needs to - the updated `pandas` version. The output looks like:

```
Step 1/1 : FROM python:3.7.0
 ---> a9d071760c82
Successfully built a9d071760c82
Successfully tagged dockta-5058f1af8388633f609cadb75a75dc9d:system
Dockta 1/2 : COPY requirements.txt requirements.txt
Dockta 2/2 : RUN pip install -r requirements.txt
Collecting pandas==0.23.1 (from -r requirements.txt (line 1))

  <snip>

Successfully built pandas
Installing collected packages: pandas
  Found existing installation: pandas 0.23.0
    Uninstalling pandas-0.23.0:
      Successfully uninstalled pandas-0.23.0
Successfully installed pandas-0.23.1

```

### Generates structured meta-data for your project

Dockta uses [JSON-LD](https://json-ld.org/) as it's internal data structure. When it parses your project's source code it generates a JSON-LD tree using a vocabularies from [schema.org](https://schema.org) and [CodeMeta](https://codemeta.github.io/index.html).

For example, It will parse a `Dockerfile` into a schema.org [`SoftwareSourceCode`](https://schema.org/SoftwareSourceCode) node extracting meta-data about the Dockerfile.

Dockta also fetches meta data on your project's dependencies, which could be used to generate a complete software citation for your project.

```json
{
  "name": "myproject",
  "datePublished": "2017-10-19",
  "description": "Regression analysis for my data",
  "softwareRequirements": [
    {
      "description": "\nFunctions to Accompany J. Fox and S. Weisberg,\nAn R Companion to Applied Regression, Third Edition, Sage, in press.",
      "name": "car",
      "urls": [
        "https://r-forge.r-project.org/projects/car/",
        "https://CRAN.R-project.org/package=car",
        "http://socserv.socsci.mcmaster.ca/jfox/Books/Companion/index.html"
      ],
      "authors": [
        {
          "name": "John Fox",
          "familyNames": [
            "Fox"
          ],
          "givenNames": [
            "John"
          ]
        },
```

### Easy to pick up, easy to throw away

Dockta is designed to make it easier to get started creating Docker images for your project. But it's also designed not to get in your way or restrict you from using bare Docker. You can easily, and individually, override any of the steps that Dockta takes to build an image.

- _Code analysis_: To stop Dockta doing code analysis and take over specifying your project's package dependencies, just remove the leading '.' from the `.DESCRIPTION`, `.requirements.txt` or `.package.json` file that Dockta generates.

- _Dockerfile generation_: Dockta aims to generate readable Dockerfiles that conform to best practices. They include comments on what each section does and are a good way to start learning how to write your own Dockerfiles. To stop Dockta generating a `.Dockerfile`, and start editing it yourself, just rename it to `Dockerfile`.

- _Image building_: Dockta manages incremental builds using a special comment in the `Dockerfile`, so you can stop using Dockta altogether and build the same image using Docker (it will just take longer if you change you project dependencies).

## Demo

<a href="https://asciinema.org/a/pOHpxUqIVkGdA1dqu7bENyxZk?size=medium&cols=120&autoplay=1" target="_blank"><img src="https://asciinema.org/a/pOHpxUqIVkGdA1dqu7bENyxZk.svg" /></a>

## Install

Dockta is available as a Node.js package with a command line interface (CLI). If you want to use Dockta to build Docker images, you will need to [install Docker](https://docs.docker.com/install/) if you don't already have it.

```bash
npm install @stencila/dockta
```

## Use

The command line tool has three primary commands `compile`, `build` and `execute`. To get an overview of the commands available use the `--help` option i.e.

```bash
dockta --help
```

To get more detailed help on a particular command, also include the command name e.g

```bash
dockta compile --help
```

### Compile a project

The `compile` command compiles a project folder into a specification of a software environment. It scans the folder for source code and package requirement files, parses them, and creates an `.environ.jsonld` file. This file contains the information needed to build a Docker image for your project.

For example, let's say your project folder has a single R file, `main.R` which uses the R package `lubridate` to print out the current time:

```R
lubridate::now()
```

Let's compile that project and inspect the compiled software environment. Change into the project directory and run the `compile` command.

```bash
dockta compile
```

You should find three new files in the folder created by Dockta:

- `.DESCRIPTION`: A R package description file containing a list of the R packages required and other meta-data

- `.envrion.jsonld`: A JSON-LD document containing structure meta-data on your project and all of its dependencies

- `.Dockerfile`: A `Dockerfile` generated from `.environ.jsonld`

To stop Dockta generating any of these files and start editing it yourself, remove the leading `.` from the name of the file you want to take over creating.

### Build a Docker image

Usually, you'll compile and build a Docker image for your project in one step using the `build` command. This command runs the `compile` command and builds a Docker image from the generated `.Dockerfile` (or handwritten `Dockerfile`):

```bash
dockta build
```

After the image has finished building you should have a new docker image on your machine, called `rdate`:

```bash
> docker images
REPOSITORY        TAG                 IMAGE ID            CREATED              SIZE
rdate             latest              545aa877bd8d        About a minute ago   766MB
```

If you want to build your image with bare Docker rename `.Dockerfile` to `Dockerfile` and run `docker build .` instead. This might be a good approach when you have finished the exploratory phase of your project (i.e. there is litte or no churn in your package dependencies) and want to create a more final image.

> 🛈 Docker images can get very large (2-3 GB is not unusual for an image with R and/or Python and associated packages).
> You might want to occasionally do a clean up of 'dangling' images using `docker image prune` to save disk space.
> See the Docker [documentation for more on cleaning up](https://docs.docker.com/config/pruning/) unused images and containers.

### Execute a Docker image

You can use Docker to run the created image. Or use Dockta's `execute` command to compile, build and run your image in one:

```bash
> dockta execute
2018-10-23 00:58:39
```

Dockta's `execute` also mounts the folder into the container and sets the users and group ids. This allows you to read and write files into the project folder from within the container. It's equivaluent to running Docker with these arguments:

```bash
docker run --rm --volume $(pwd):/work --workdir=/work --user=$(id -u):$(id -g) <image>
```

### Docter who?

Dockta compiles a meta-data tree of all the packages that your project relies on. Use the `who` command to get a list of the authors of those packages:

```bash
> dockta who
Roger Bivand (rgdal, sp), Tim Keitt (rgdal), Barry Rowlingson (rgdal), Edzer Pebesma (sp)
```

Use the `depth` option to restrict the listing to a particular depth in the dependency tree. For example, to list the authors of the packages that your project directly relies upon use:

```bash
> dockta who --depth=1
```

### Predefined images

This repository defines a number of compute environments that can be built using Dockta.

The `stencila/executa-all` image installs all known executor packages (e.g. `basha`, `pyla`) into a container. It is built, with the latest versions of those packages, and pushed to [Docker Hub](https://hub.docker.com/repository/docker/stencila/executa), on each push to master and daily at midnight UTC.

The image `stencila/executa-all` image is the base for other images, each of which add popular packages for various programming languages. See the [`images`](images) folder for the definitions of those environments.

#### Image versions

All images are built at least nightly (so that they have the latest versions of packages installed in them) and tagged with a dated build number. See the Docker Hub for the latest versions:

- [`stencila/executa-all`](https://hub.docker.com/r/stencila/executa-all/tags?page=1&ordering=last_updated)
- [`stencila/executa-midi`](https://hub.docker.com/r/stencila/executa-midi/tags?page=1&ordering=last_updated)

#### Getting the images

You can get the latest version using `docker pull` e.g.

```bash
docker pull stencila/executa-all
```

Or, grab a particular, date stamped, build e.g. the first build on 2020-10-22:

```bash
docker pull stencila/executa-all:20202022.1
```

Alternatively, you can build the image locally using `dockta`:

```bash
dockta build images/executa-all
```

#### Running the images

Run the images like this,

```bash
docker run -it --rm -p 9000:9000 stencila/executa-midi
```

That will serve Executa from within the container and make it available at ws://localhost:9000.

#### Extending the images

There are several ways that you can extend the images, for example to add a package that you need for your analysis.

##### Make a pull request

The `executa-midi` image is intended to be a fairly comprehensive image containing most of the commonly download packages for R and Python. We regularly query download stats from [CRAN](https://cran.r-project.org/) and [PyPI](https://pypi.org/) and take the top 150 most downloaded packages (minus some exclusions, plus some inclusions). The list of current packages are:

- [`DESCRIPTION`](images/executa-midi/DESCRIPTION) for R packages
- [`requirements.txt`](images/executa-midi/requirements.txt) for Python packages
- [`package.json`](images/executa-midi/package.json) for Node.js packages

If you think that a popular package is missing and should be included then please submit a pull request which adds the package to one of the following files:

- [`images/packages/r/executa-midi.json`](images/packages/r/executa-midi.json) for R packages
- [`images/packages/python/executa-midi.json`](images/packages/python/executa-midi.json) for python packages

##### Create your own image

You can create an image with extra packages by (a) creating a new folder with a new `DESCRIPTION`, `requirements.txt`, and/or `package.json` file that list those extra packages and (b) using the `--from` option. e.g.

```bash
cd my-custom-image/
dockta build --from stencila/executa-midi
```

##### Write your own `Dockerfile`

If you want the most control (and responsibility ;) you can always write your own `Dockerfile` using one of our images in the `FROM` directive e.g.

```Dockerfile
FROM stencila/executa-midi

# Use `root` user for installing new packages
USER root

# Install a Python package
RUN python3 -m pip install some-package

# Install a R package from a particular date
RUN install.packages("somePackage", repos="https://mran.microsoft.com/snapshot/2020-10-21")

# Go back to `guest` user for better security when the container is run
USER guest
```

You can run `docker build` on this Dockerfile, push it to a Docker container registry, and then specify it as image to use for your project on Stencila Hub.

## Contributors

We 💕 contributions! All contributions: ideas 🤔, examples 💡, bug reports 🐛, documentation 📖, code 💻, questions 💬. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Thanks 🙏 to these wonderful ✨ people who have contributed so far 💖!

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://remirampin.com/"><img src="https://avatars3.githubusercontent.com/u/426784?v=4" width="100px;" alt="Remi Rampin"/><br /><sub><b>Remi Rampin</b></sub></a><br /><a href="https://github.com/stencila/dockta/issues?q=author%3Aremram44" title="Bug reports">🐛</a> <a href="https://github.com/stencila/dockta/commits?author=remram44" title="Code">💻</a> <a href="#ideas-remram44" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://bbit.co.nz"><img src="https://avatars1.githubusercontent.com/u/292725?v=4" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/stencila/dockta/commits?author=beneboy" title="Code">💻</a> <a href="#ideas-beneboy" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://stenci.la"><img src="https://avatars2.githubusercontent.com/u/2358535?v=4" width="100px;" alt="Aleksandra Pawlik"/><br /><sub><b>Aleksandra Pawlik</b></sub></a><br /><a href="https://github.com/stencila/dockta/commits?author=apawlik" title="Code">💻</a> <a href="#example-apawlik" title="Examples">💡</a> <a href="https://github.com/stencila/dockta/issues?q=author%3Aapawlik" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/nokome"><img src="https://avatars0.githubusercontent.com/u/1152336?v=4" width="100px;" alt="Nokome Bentley"/><br /><sub><b>Nokome Bentley</b></sub></a><br /><a href="https://github.com/stencila/dockta/commits?author=nokome" title="Code">💻</a> <a href="https://github.com/stencila/dockta/commits?author=nokome" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://giorgiosironi.com"><img src="https://avatars3.githubusercontent.com/u/160299?v=4" width="100px;" alt="Giorgio Sironi"/><br /><sub><b>Giorgio Sironi</b></sub></a><br /><a href="#review-giorgiosironi" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/stencila/dockta/issues?q=author%3Agiorgiosironi" title="Bug reports">🐛</a> <a href="#ideas-giorgiosironi" title="Ideas, Planning, & Feedback">🤔</a> <a href="#question-giorgiosironi" title="Answering Questions">💬</a></td>
    <td align="center"><a href="http://bmpvieira.com"><img src="https://avatars3.githubusercontent.com/u/263386?v=4" width="100px;" alt="Bruno Vieira"/><br /><sub><b>Bruno Vieira</b></sub></a><br /><a href="https://github.com/stencila/dockta/commits?author=bmpvieira" title="Code">💻</a> <a href="#ideas-bmpvieira" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/stencila/dockta/commits?author=bmpvieira" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://gliptak.github.io/"><img src="https://avatars0.githubusercontent.com/u/50109?v=4" width="100px;" alt="Gábor Lipták"/><br /><sub><b>Gábor Lipták</b></sub></a><br /><a href="#infra-gliptak" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/stencila/dockta/issues?q=author%3Agliptak" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

## See also

There are several other projects that create Docker images from source code and/or requirements files including:

- [`alibaba/derrick`](https://github.com/alibaba/derrick)
- [`jupyter/repo2docker`](https://github.com/jupyter/repo2docker)
- [`Gueils/whales`](https://github.com/Gueils/whales)
- [`o2r-project/containerit`](https://github.com/o2r-project/containerit)
- [`openshift/source-to-image`](https://github.com/openshift/source-to-image)
- [`ViDA-NYU/reprozip`](https://github.com/ViDA-NYU/reprozip])

Dockta is similar to `repo2docker`, `containerit`, and `reprozip` in that it is aimed at researchers doing data analysis (and supports R) whereas most other tools are aimed at software developers (and don't support R). Dockta differs to these projects principally in that it:

- performs static code analysis for multiple languages to determine package requirements.

- uses package databases to determine package system dependencies and generate linked meta-data (`containerit` does this for R).

- quicker installation of language package dependencies (which can be useful during research projects where dependencies often change).

- by default, but optionally, installs Stencila packages so that Stencila client interfaces can execute code in the container.

The approach taken in Dockta to building Docker images is a mix of Dockerfile generation, as in `repo2docker`, and code injection and incremental builds as in `source-to-image`.

`reprozip` and its extension `reprounzip-docker` may be a better choice if you want to share your existing local environment as a Docker image with someone else.

`containerit` might suit you better if you only need support for R and don't want managed packaged installation.

`repo2docker` is probably a better choice if you want to run Jupyter notebooks or RStudio in your container and don't need source code scanning to detect your requirements.

`source-to-image` might suit you better if your focus is on web development (e.g. Ruby, Node.js) and want a more stable, feature complete implementation of incremental builds.

If you don't want to build a Docker image and just want a tool that helps determining the package dependencies of your source code check out:

- Node.js: [`detective`](https://github.com/browserify/detective)
- Python: [`modulefinder`](https://docs.python.org/3.7/library/modulefinder.html)
- R: [`requirements`](https://github.com/hadley/requirements)

## FAQ

_Why go to the effort of generating a JSON-LD intermediate representation instead of writing a Dockerfile directly?_

Having an intermediate representation of the software environment allows this data to be used for other purposes (e.g. software citations, publishing, archiving). It also allows us to reuse much of this code for build targets other than Docker (e.g. Nix) and sources other than code files (e.g. a GUI).

_Why is Dockta a Node.js package?_

We've implemented this as a Node.js package for easier integration into Stencila's Node.js based desktop and cloud deployments. We already had familiarity with using `dockerode` the Node.js package that we use to talk to Docker for incremental builds and container execution.

_Why is Dockta implemented in Typescript?_

Typescript's type-checking and type-annotations can reduce the number of runtime errors and improves developer experience. For this particular project, we wanted to use the Typescript type definitions for `SoftwarePackage`, `CreativeWork`, `Person` etc that are defined in [stencila/schema](https://github.com/stencila/schema).

_Why didn't you use, and contribute to, an existing project rather than creating a new tool_

When existing projects don't take the approach or provide the features you want, it's often a difficult decision to make whether to invest the time to understand and refactor an existing code base or to start fresh. In this case, we chose to start fresh for the reasons and differences outlined above. We felt it would take too much refactoring of existing projects to shoehorn in the approach we wanted to take. We also wanted to be able to reuse much of the code developed here in a sister project, [Nixster](https://github.com/stencila/nixster), which aims to make it easier for researchers to build Nix environments.

_I'd love to help out! Where do I start?_

See [CONTRIBUTING.md](CONTRIBUTING.md) (OK, so this isn't asked _that_ frequently. But it's worth a try eh :woman_shrugging:.)

## Acknowledgments

Dockta was inspired by, and combines ideas from, several similar tools including [`binder`](https://github.com/binder-project/binder), [`repo2docker`](https://github.com/jupyter/repo2docker), [`source-to-image`](https://github.com/openshift/source-to-image) and [`containerit`](https://github.com/o2r-project/containerit). It relies on many great open source projects, in particular:

- [CodeMeta](https://codemeta.github.io/)
- [`crandb`](https://github.com/metacran/crandb)
- [`dockerode`](https://www.npmjs.com/package/dockerode)
- [`docker-file-parser`](https://www.npmjs.com/package/docker-file-parser)
- [`npm/registry`](https://github.com/npm/registry)
- [`pypa`](https://warehouse.pypa.io)
- [`sysreqsdb`](https://github.com/r-hub/sysreqsdb)
- and of course, [Docker](https://www.docker.com/)
