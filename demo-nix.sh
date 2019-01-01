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
pe "cd tests/fixtures/multi-lang-for-nix"

p "# And take a look at the files in it"
pe "ls"
sleep 1

p "# The 'script.R' file has one dependency"
pe "cat script.R"
sleep 1

p "# The 'script.py' file has two dependencies"
pe "cat script.py"
sleep 1

p "# The 'script.js' file has Dat as a dependency"
pe "cat script.js"
sleep 1

p "# Let's start by compiling this project with Nix support"
pe "dockter compile --nix"
sleep 1

p "# You'll see that Dockter has created several new files, prefixed with a dot"
pe "ls -a"
sleep 2

p "# .DESCRIPTION is a R package description file, based on the packages used in script.R"
pe "cat .DESCRIPTION"
sleep 3

p "# .environ.jsonld is a JSON-LD file which describes the project, and it's dependendies, as linked data"
pe "cat .environ.jsonld | head -n 30"
sleep 3

p "# The .Dockerfile is generated from this information..."
pe "cat .Dockerfile"
sleep 3

p "# The .default.nix is also generated from this information, but looks more simple than the Dockerfile"
pe "cat .default.nix"
sleep 3

p "# The .nixDockerfile is based on NixOS rather than Ubuntu, and relies on the .default.nix file"
pe "cat .nixDockerfile"
sleep 3

p "# Okay, so let's build this thing!"
pe "dockter build \$PWD --nix"
sleep 3

p "# Let's check that it's built by listing the Docker images on this machine"
pe "docker images | head -n 5"
p "# Note that the image multi-lang-for-nix was just created"
sleep 2

p "# Now we can execute this project environment in a container running nix-shell"
p "# This is going to take a while the first time since all dependencies need to be fetched (by Nix inside Docker)"
pe "dockter execute \$PWD --nix"
sleep 2

# Inside the container we can demo thar Dat, R, Python, are installed in Nix hashed folders
# and explain why this is important
# > which python
# > which R
# > which dat
# And their dependencies
# > python -c 'import numpy ; print(numpy.version.version)'
# > Rscript -e 'packageVersion("babynames")'
# and then exit

p "# All the packages fetched by Nix got installed inside a reusable Docker volume"
pe "docker volume list"
sleep 2

p "# If we execute this project again, it should be much faster to launch"
pe "dockter execute \$PWD --nix"
sleep 2

p "# Now let's switch to another project that only relies on Python"
pe "cd ../py-for-nix"
sleep 1

p "# Let's compile this new project"
pe "dockter compile --nix"
sleep 2

p "# We can see that .default.nix has less dependencies"
pe "cat .default.nix"
sleep 2

p "# Let's build it!"
pe "dockter build \$PWD --nix"
sleep 2

p "# Now, let's check our docker images again and see that we have a new image"
pe "docker images | head -n 5"
sleep 2

p "# Let's execute it! This should be fast since we already got Python in the shared Nix store"
pe "dockter execute \$PWD --nix"
sleep 2

# Show that Python is installed but not Dat or R
# > which python
# > which R

p "# Check out the docs for more things you can do with Dockter. Thanks for watching!"
sleep 2

exit
