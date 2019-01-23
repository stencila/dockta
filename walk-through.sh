#!/usr/bin/env bash

# Script for creating Dockter CLI walkthrough presenting the key features.

# Include the demoing code
. demo-magic.sh
clear

# Set some options
DEMO_PROMPT=$BLUE"$ "
DEMO_CMD_COLOR=$GREEN

# Do some clean up first
rm tests/fixtures/r-spatial/*.png 2> /dev/null


# Run the demo!
p '# This is a walkthrough presenting key features of Dockter - a tool helping build reproducible environments for non-experts'
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
p "# The project folder now has a new file in it, plot.png, created by R from within the container"
pe "ls"
sleep 2

p "# Now we've executed the project and created a reproducible figure. Give credit where credit is due!"
p "# The who command lists all the contributors of all the packages that your project depends upon"
pe "dockter who"

p "# If you add, remove or update a package in your project, Dockter will run \"intelligent\" rebuild."
p "# Let's try this on another example using some Python code"
pe "ls tests/fixtures/py-requirements"
sleep 2

p "# This Python project already has a `requirements.txt` file with packages needed. Dockter will use it to build the Dockerfile"
pe "cat tests/fixtures/py-requirements/requirements.txt"
sleep 2

p "# Let's build the image for the project"
pe "dockter build $PWD"
sleep 2

p "# Now we should see the image on the list"
pe "docker images"
sleep 2

p "# Let's add anoter Python package to `requirements.txt`"
pe "echo \"arrow==0.12.1\" >> tests/fixtures/py-requirements/requirements.txt" 
sleep 2

p "# The arrow package should now be added to the list in the requirements.txt file"
pe "cat tests/fixtures/py-requirements/requirements.txt"
sleep 2

p "# Let's see what happens when Dockter will rebuild the image"
pe "dockter build $PWD"
sleep 2

p "# We can view all docker images"
pe "docker images"
sleep 2

p "# Now we can check the history for this particular image that we just rebuilt"
pe "docker history $PWD"
sleep 2

p "# Check out the docs (https://github.com/stencila/dockter#readme) for more things you can do with Dockter."
p "# Thanks for watching!"
sleep 2

p "# This demo was created using"
pe "dockter --version"
sleep 2

exit
