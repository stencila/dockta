#!/usr/bin/env bash

# Script for creating CLI demo

# Include the demoing code
. demo-magic.sh
clear

# Set some options
DEMO_PROMPT=$BLUE"$ "
DEMO_CMD_COLOR=$GREEN

# Do some clean up first
rm -f tests/fixtures/r-spatial/*.png

# Run the demo!

p "# First we'll change into one of the R example projects"
pe "cd tests/fixtures/r-spatial"

p "# And take a look at the files in it"
pe "ls"
sleep 1

p "# The 'main.R' file is what Dockta will execute within a container"
p "# It reads in some spatial data and plots it"
pe "cat main.R"
sleep 1

p "# Let's start by compiling this project"
pe "dockta compile"
sleep 1

p "# You'll see that Dockta has created several new files, prefixed with a dot"
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
pe "dockta build"
sleep 3

p "# Let's check that it's built by listing the Docker images on this machine"
pe "docker images | head -n 5"
p "# Note that the image r-spatial was just created"
sleep 2

p "# Now we can execute this project"
pe "dockta execute"
sleep 2

p "# That started a container using the new image, mounted the project directory into the container and ran main.R"
p "# The project folder now has a new file in it, plot.png, created by R from within the container"
pe "ls"
sleep 2

p "# Now we've executed the project and created a reproducible figure. Give credit where credit is due!"
p "# The who command lists all the contributors of all the packages that your project depends upon"
pe "dockta who"

p "# Check out the docs (https://github.com/stencila/dockta#readme) for more things you can do with Dockta."
p "# Thanks for watching!"
sleep 2

p "# This demo was created using"
pe "dockta --version"
sleep 2

exit
