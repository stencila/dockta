#!/usr/bin/env bash

# A script to download and install the latest version of the binary on Linux.

VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
curl -sLo /tmp/dockter-linux-x64.tar.gz https://github.com/stencila/dockter/releases/download/$VERSION/dockter-linux-x64.tar.gz
tar xvf /tmp/dockter-linux-x64.tar.gz
mkdir -p ~/.local/bin/
mv -f dockter ~/.local/bin/
rm -f /tmp/dockter-linux-x64.tar.gz
