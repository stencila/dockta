#!/usr/bin/env bash

# Script for creating CLI demo

# Include the demoing code
. demo-magic.sh
clear

# Set some options
DEMO_PROMPT=$BLUE"$ "
DEMO_CMD_COLOR=$GREEN

# Run the demo!

p "# First we'll change into one of the R example projects"
pe "cd tests/fixtures/r-spatial"

p "# And take a look at the files in it"
pe "ls"
sleep 1

p "# The 'main.R' file is what Dockter will execute within a container"
p "# It reads in some spatial data and plots it"
pe "cat main.R"
sleep 1

p "# Let's start by compiling this project"
pe "dockter compile"
sleep 1

p "# You'll see that Dockter has created several new files, prefixed with a dot"
pe "ls -a"
sleep 2

p "# .DESCRIPTION is a R package description file, based on the packages used in main.R"
pe "cat .DESCRIPTION"
sleep 3

p "# .environ.jsonld is a JSON-LD file which describes the project, and it's dependendies, as linked data"
pe "cat .environ.jsonld | head -n 30"
sleep 3

p "# The .Dockerfile is generated from this information..."
pe "cat .Dockerfile"
sleep 3

p "# Okay, so let's build this thing!"
pe "dockter build \$PWD"
sleep 3

p "# Let's check that it's built by listing the Docker images on this machine"
pe "docker images | head -n 5"
p "# Note that the image r-spatial was just created"
sleep 2

p "# Now we can execute this project"
pe "dockter execute \$PWD"
sleep 2

p "# That started a container using the new image, mounted the project directory into the container and ran main.R"
p "# The project folder now has a new file in it, homicide.png, created by R from within the container"
pe "ls"
sleep 2

p "# Check out the docs for more things you can do with Dockter. Thanks for watching!"
sleep 2

exit
