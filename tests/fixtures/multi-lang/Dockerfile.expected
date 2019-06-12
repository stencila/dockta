FROM ubuntu:18.04

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      apt-transport-https \
      ca-certificates \
      curl \
      software-properties-common

RUN curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - \
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9
RUN apt-add-repository "deb https://deb.nodesource.com/node_10.x bionic main" \
 && apt-add-repository "deb https://mran.microsoft.com/snapshot/2018-11-04/bin/linux/ubuntu bionic-cran35/"

ENV TZ="Etc/UTC"

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      libcurl4-openssl-dev \
      libssl-dev \
      make \
      nodejs \
      python3 \
      python3-pip \
      r-base \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1001 -s /bin/bash docktauser
WORKDIR /home/docktauser

# dockta

COPY .package.json package.json
COPY .requirements.txt requirements.txt
COPY .DESCRIPTION DESCRIPTION

RUN npm install package.json \
 && pip3 install --requirement requirements.txt \
 && bash -c "Rscript <(curl -sL https://unpkg.com/@stencila/dockta/src/install.R)"

COPY script.js script.js
COPY script.py script.py
COPY script.R script.R

USER docktauser
