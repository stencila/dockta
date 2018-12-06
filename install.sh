#!/usr/bin/env bash

# A script to download and install the latest version of Dockter

OS=$(uname)
if [[ "$OS" == "Linux" || "$OS" == "Darwin" ]]; then
    case "$OS" in
        'Linux')
            PLATFORM="linux-x64"
            VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
            INSTALL_PATH="$HOME/.local/bin/"
            ;;
        'Darwin')
            PLATFORM="macos-x64"
            VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
            INSTALL_PATH="/usr/local/bin/"
            ;;
    esac
    curl -Lo /tmp/dockter-linux-x64.tar.gz https://github.com/stencila/dockter/releases/download/$VERSION/dockter-$PLATFORM.tar.gz
    tar xvf /tmp/dockter-linux-x64.tar.gz
    mkdir -p $INSTALL_PATH
    mv -f dockter $INSTALL_PATH
    rm -f /tmp/dockter-linux-x64.tar.gz
else
    echo "Sorry, I don't know how to install on this OS, please see https://github.com/stencila/dockter#install"
fi
