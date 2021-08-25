FROM ubuntu:20.04

# Install system dependencies
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y \
      curl \
      python3 \
      python3-pip \
      software-properties-common

# Install recent Node.js from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash \
 && apt-get install -y nodejs \
 && npm config --global set user root

# Install recent R from CRAN
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E298A3A825C0D65DFD57CBB651716619E084DAB9 \
 && add-apt-repository 'deb https://cloud.r-project.org/bin/linux/ubuntu focal-cran40/' \
 && apt-get update \
 && apt-get install -y r-base \
 && rm -rf /var/lib/apt/lists/*

# Install necessary libs for Encoda
# See https://github.com/stencila/encoda/blob/master/Dockerfile
RUN apt-get update \
 && apt-get install -y \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libgbm1 \
      libgconf-2-4 \
      libgtk-3-0 \
      libgtk2.0-0 \
      libnotify-dev \
      libnss3 \
      libpangocairo-1.0-0 \
      libxcomposite1 \
      libxrandr2 \
      libxss1 \
      libxtst6 \
      xauth \
      xvfb \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Install executors
# The EXECUTORS_LATEST argument can be set at the current time e.g.
#    docker build --build-arg EXECUTORS_LATEST=$(date --iso=seconds) ...
# to force a reinstall of the latest version of executors where the version is not pinned
# (by busting the Docker cache with a new RUN layer)
ARG EXECUTORS_LATEST=false
RUN echo "Forcing install of latest executors: ${EXECUTORS_LATEST}"
RUN npm install --global @stencila/executa
RUN npm install --global @stencila/encoda@0.116.1
RUN npm install --global @stencila/basha
RUN npm install --global @stencila/jupita
RUN R -e 'install.packages("remotes"); remotes::install_github("stencila/rasta")'

# Temporary fix. Install Typscript to avoid this
# https://dev.azure.com/stencila/stencila/_build/results?buildId=2035&view=logs&j=1b7bf37f-59a6-5457-eae3-62ce29cb19a4&t=9d3843fb-f716-59bf-683b-829e70871150&l=3860
# which seems to be caused by TS being a peer dependency of Typedoc
RUN npm install --global typescript

# Install Jupyter kernels
RUN python3 -m pip install ipykernel

# Setup container user prior to registering executors
RUN useradd --create-home guest
WORKDIR /home/guest
USER guest

# Register executors so that they can be discovered by Executa
RUN basha register
RUN node /usr/lib/node_modules/@stencila/encoda/dist/encoda.js register
RUN jupita register
RUN R -e 'rasta::register()'

# Register Jupyter kernels so that they can be discovered by Jupita
RUN python3 -m ipykernel install --user

# Serve Executa on external address so that host can connect
CMD executa serve --ws=0.0.0.0:9000 --debug
