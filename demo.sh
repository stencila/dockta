#!/usr/bin/env bash

# Script for creating CLI demo

# Include the demoing code
. demo-magic.sh
clear

# Set some options
DEMO_PROMPT=$BLUE"$ "
DEMO_CMD_COLOR=$GREEN

# Run the demo!

p "# First we'll change into one of the example projects"
pe "cd tests/fixtures/r-rgdal"

p "# And take a look at the files in it"
pe "ls"
sleep 1

p "# The 'main' file is what Dockter will execute within a container"
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
sleep 2

p "# Now lets execute this project"
pe "dockter execute \$PWD"
sleep 2

p "# The end (thanks for watching!)"
sleep 2

exit
