#!/usr/bin/env bash

# A script to download and install the latest version of Dockter

case $(uname) in
    'Linux')
        VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
        curl -sLo /tmp/dockter-linux-x64.tar.gz https://github.com/stencila/dockter/releases/download/$VERSION/dockter-linux-x64.tar.gz
        tar xvf /tmp/dockter-linux-x64.tar.gz
        mkdir -p ~/.local/bin/
        mv -f dockter ~/.local/bin/
        rm -f /tmp/dockter-linux-x64.tar.gz
        ;;
    'Darwin')
        VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        curl -sLO https://github.com/stencila/dockter/releases/download/$VERSION/dockter-macos-x64.tar.gz
        tar xvf dockter-macos-x64.tar.gz
        sudo mv dockter /usr/local/bin/
        ;;
    *)
        echo "Sorry, I don't know how to install on this OS, please see https://github.com/stencila/dockter#install"
esac
