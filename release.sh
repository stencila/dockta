#!/bin/sh

echo "Generating release $1"

# Update the version in Dockerfiles and DESCRIPTION files
sed -i -e "s!Version: .*!Version: $1!g" images/*/DESCRIPTION
