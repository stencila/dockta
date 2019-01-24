#!/usr/bin/env bash

# Script for creating Dockter CLI walkthrough presenting the key features.

# Include the demoing code
. demo-magic.sh
clear

# Set some themeing options
DEMO_PROMPT=$BLUE"$ "
DEMO_CMD_COLOR=$GREEN

# For a live, manual walkthough (-i.e. without using the -n flag where we press
# enter for each command) we want 'instant' typing (by undefining TYPE_SPEED)
TYPE_SPEED=

# Do some clean up first
rm tests/fixtures/r-spatial/*.png 2> /dev/null

# Run the demo!
p "# Welcome to this walkthrough presenting the key features of Dockter\n"

p "# First we'll change into one of the R example projects"
pe "cd tests/fixtures/r-spatial"

p "# And take a look at the files in it"
pe "ls"
sleep 1

p "# The 'main.R' file reads in some spatial data and plots it"
pe "cat main.R"
sleep 1

p "# Let's start by using Dockter to 'compile' this project"
pe "dockter compile"
sleep 1

p "# You'll see that Dockter has created several new files, prefixed with a dot"
pe "ls -a"
sleep 2

p "# .DESCRIPTION is a R package description file which Dockter has generated for you"
p "# based on the packages used in main.R"
pe "cat .DESCRIPTION"
sleep 3

p "# .environ.jsonld is a JSON-LD file which describes the project, and it's dependendencies, as linked data"
pe "cat .environ.jsonld | head -n 30"
sleep 3

p "# The .Dockerfile is generated from this information"
pe "cat .Dockerfile"
sleep 3

p "# Okay, so let's build this thing!"
pe "dockter build"
sleep 3

p "# Let's check that it's built by listing the Docker images on this machine"
pe "docker images | head -n 5"
sleep 2

p "# Note that the image r-spatial was just created and it has two tags: 'latest' and 'system' "
p "# These two tags are used by Dockter's incremental builds"

p "# We can have a look into the layers of the Docker image that we just built"
pe "docker history r-spatial"
sleep 2
p "# If you add, remove or update a package in your project, Dockter will do an \"intelligent\", incremental rebuild."
p "# Let's see how incremental build works in practice"
pe "echo \"library(forcats)\" >> main.R" 
sleep 2

pe "cat main.R"
sleep 2

p "# The R code now requires a new library to be available. Let's then recompile the project"
pe "dockter compile"
sleep 2

p "# Let's check that Dockter has added that package to the files that it generates."
pe "cat .DESCRIPTION"
sleep 3

pe "cat .Dockerfile"
sleep 3

p "# Let's then rebuild the image"
pe "dockter build"
sleep 2

p "# The Docker history will show us how the images were updated"
pe "docker history r-spatial"
sleep 3

p "# Now we can execute this project"
pe "dockter execute"
sleep 2

p "# That started a container using the new image, mounted the project directory into the container and ran main.R"
p "# The project folder now has a new file in it, plot.png, created by R from within the container"
pe "ls -lt"
sleep 2

p "# Now we've executed the project and created a reproducible figure. Give credit where credit is due!"
p "# The who command lists all the contributors of all the packages that your project depends upon"
pe "dockter who"

p "# Let's try this on another example using some Python code"
pe "cd ../py-weather"
pe "ls"
sleep 2

p "# Let's see what we mean by \"east to pick up, easy to throw away\". As it is now, the project does not have a requirements.txt file. "
p "# Dockter will create it for us"
pe "dockter compile"
sleep 2

pe "ls -a"
sleep 2

p "# The packages required for the project should now be in the file"
pe "cat .requirements.txt"
sleep 2

p "# If we want to now be in charge, we need to rename the requirements.txt file"
pe "mv .requirements.txt requirements.txt"
sleep 2

p "# Let's add anoter Python package to `requirements.txt`"
pe "echo -e '\ndateutil==2.5.7' >> requirements.txt" 
sleep 2

p "# The dateutil package should now be added to the list in the requirements.txt file"
pe "cat requirements.txt"
sleep 2

p "# Let's build the image for the project. Dockter will pick up the new package from the requirements.txt file."
pe "dockter build"
sleep 2

p "# Now we should see the image on the list"
pe "docker images"
sleep 2


p "# Check out the docs (https://github.com/stencila/dockter#readme) for more things you can do with Dockter."
p "# Thanks for watching!"
sleep 2

p "# This demo was created using"
pe "dockter --version"
sleep 2

exit
