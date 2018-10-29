#!/usr/bin/env bash

VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
curl -sLO https://github.com/stencila/dockter/releases/download/$VERSION/dockter-macos-x64.tar.gz
tar xvf dockter-macos-x64.tar.gz
mv dockter ~/.local/bin/
