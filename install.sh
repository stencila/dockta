#!/usr/bin/env bash

# A script to download and install the latest version of Dockter

OS=$(uname)
if [[ "$OS" == "Linux" || "$OS" == "Darwin" ]]; then
    case "$OS" in
        'Linux')
            PLATFORM="linux-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
            else
                VERSION=$1
            fi
            INSTALL_PATH="$HOME/.local/bin/"
            ;;
        'Darwin')
            PLATFORM="macos-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/dockter/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
            else
                VERSION=$1
            fi
            INSTALL_PATH="/usr/local/bin/"
            ;;
    esac
    curl -Lo /tmp/dockter.tar.gz https://github.com/stencila/dockter/releases/download/$VERSION/dockter-$PLATFORM.tar.gz
    tar xvf /tmp/dockter.tar.gz
    mkdir -p $INSTALL_PATH
    mv -f dockter $INSTALL_PATH
    rm -f /tmp/dockter.tar.gz
else
    echo "Sorry, I don't know how to install on this OS, please see https://github.com/stencila/dockter#install"
fi
