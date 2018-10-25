## Using Dockter

This document will take you through using Dockter to make your work reproducible and easy to reuse.

#### Prerequisites

You should have some basic working knowledge of Docker. [This hands-on tutorial](https://ome.github.io/training-docker/) is a good way to start. You can also
check out the [Katakoda set of Docker courses](https://www.katacoda.com/courses/docker).

#### Motivation

We encourage you to have a look at the above courses but the idea behind Dockter is that you don't need to master Docker. Dockter does most of the things for you
in order to set up a reproducible research environment.

Dockter is a tool to make it easier for researchers to create reproducible research environments. It generates a Docker image for a research project based on the source code in it. That means that you don’t need to learn a new file format (`Dockerfiles`) to create Docker images.

In addition, Dockter manages the image building process to better fit your everyday workflow (determines package system dependencies, manages builds) and generates JSON-LD meta-data describing the image (from which citations etc can be generated).

#### 1. Install

a) Download the latest stable binary package (ready to run) [for your operating system](https://github.com/stencila/dockter/releases):

b) Copy the binary file into the folder where you would like Dockter to be (eg. `Applications` on your Mac OS, or `Program Files` on Windows). 

c) Once the file is downloaded, rename it to `dockter`  Dockter is a command line tool (at least for now) so you need to interact with it through the terminal (on Windows it will be Power Shell). 

**Basic use**

```
  dockter compile [folder] [format]  Compile a project to a software environment
  dockter build [folder]             Build a Docker image for project
  dockter execute [folder] [format]  Execute a project
```


#### 2. Dockter for R

Dockter can create a software environment file which reflects the requirements to run the project written in R.
The software environment file is a file in `JSON` or `yaml` format with comprehensive meta data about the project.
Dockter parses the folder with the R project for `R` and `Rmd` files and extracts the relevant information.

 * For each R package installed or loaded, the meta data is retrieved from [CRAN](http://crandb.r-pkg.org).
 * System dependencies for each package are obtained from [R-Hub](https://sysreqs.r-hub.io/pkg/xml2).
 * Meta data about the authors, title, abstract and so on.

Try out Dockter on the `example.R` file included in this folder. 

```
dockter compile dockter/doc 
```

You will see the output on your screen in `JSON` and two files: `.Dockerfile` and `.DESCRIPTION` generated in the project folder:

`.Dockerfile` will look more or less like the one below:

```
# Generated by Dockter 2018-10-23T09:17:23.748Z
# To stop Dockter generating this file and start editing it yourself, rename it to "Dockerfile".

FROM ubuntu:16.04

ENV TZ="Etc/UTC"

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      apt-transport-https \
      ca-certificates \
      software-properties-common

RUN apt-add-repository "deb https://mran.microsoft.com/snapshot/2018-10-22/bin/linux/ubuntu xenial/" \
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      r-base \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# dockter

COPY .DESCRIPTION DESCRIPTION
RUN bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockter/src/install.R)"

COPY environment-example.R environment-example.R
COPY example.R example.R

CMD Rscript environment-example.R
```
#### 3. Dockter for Python

Dockter can create a software environment file which reflects the requirements to run the project written in Python.
The software environment file is a file in `JSON` or `yaml` format with comprehensive meta data about the project.
Dockter parses the folder with the Python project for `py` files and extracts the relevant information.

#### 4. Real-life example

To demonstrate convenience of using Dockter, try running it for one of the [Software Carpentry modules](https://github.com/swcarpentry/r-novice-inflammation)
for learning R. The repository with the module contains a range of source code files, including 'python`, `JS`, `Rmd` and `R`. 
First, clone the repository on your machine:

```
git clone https://github.com/swcarpentry/r-novice-inflammation.git
```

Run `dockter compile` on the whole directory:

```
dockter compile r-novice-inflammation
```

Then, `dockter build` to create a `Docker` image so that the module can be run (note, `dockter` will likely have to download and install a number
of packages, this may take a while):

```
dockter build r-novice-inflammation
```

Check if the image is there:

```
docker images
```

And you should see the image on the list:

```                                 TAG                 IMAGE ID            CREATED             SIZE
rnoviceinflammation                        latest              149d3dc3fc73        20 minutes ago      1.12GB
```

#### Resources

[A beginner's guide to containters](https://medium.freecodecamp.org/a-beginner-friendly-introduction-to-containers-vms-and-docker-79a9e3e119b)

