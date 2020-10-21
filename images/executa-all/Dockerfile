FROM ubuntu:19.10

# Install system dependencies
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y \
      curl \
      python3 \
      python3-pip \
      software-properties-common

# Install recent Node.js from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash \
 && apt-get install -y nodejs \
 && npm config --global set user root

# Config for Puppeteer to run in Docker (for Encoda)
# Alternative approaches may be possible in the future
# See https://github.com/stencila/encoda/blob/master/Dockerfile
RUN curl -sL https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
 && apt-get update \
 && apt-get install -y --no-install-recommends google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
 && rm -rf /var/lib/apt/lists/*
RUN echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/userns.conf

# Install recent R from CRAN
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
 && add-apt-repository 'deb https://cloud.r-project.org/bin/linux/ubuntu eoan-cran35/' \
 && apt-get update \
 && apt-get install -y r-base \
 && rm -rf /var/lib/apt/lists/*

# Install executors
# The EXECUTORS_LATEST argument can be set at the current time e.g.
#    docker build --build-arg EXECUTORS_LATEST=$(date --iso=seconds) ...
# to force a reinstall of the latest version of all executors
# (by busting the Docker cache with a new RUN layer)
ARG EXECUTORS_LATEST=false
RUN echo "Forcing install of latest executors: ${EXECUTORS_LATEST}"
RUN npm install --global @stencila/executa
RUN npm install --global @stencila/encoda
RUN npm install --global @stencila/basha
RUN pip3 install stencila-pyla
RUN R -e 'install.packages("remotes"); remotes::install_github("stencila/rasta")'

# Temporary fix. Install Typscript to avoid this
# https://dev.azure.com/stencila/stencila/_build/results?buildId=2035&view=logs&j=1b7bf37f-59a6-5457-eae3-62ce29cb19a4&t=9d3843fb-f716-59bf-683b-829e70871150&l=3860
# which seems to be caused by TS being a peer dependency of Typedoc
RUN npm install --global typescript

# Setup container user prior to registering executors
RUN useradd --create-home guest
WORKDIR /home/guest
USER guest

# Register executors so that they can be discovered by Executa
RUN basha register
RUN node /usr/lib/node_modules/@stencila/encoda/dist/encoda.js register
RUN python3 -m stencila.pyla register
RUN R -e 'rasta::register()'

# Serve Executa on external address so that host can connect
CMD executa serve --ws=0.0.0.0:9000 --debug
