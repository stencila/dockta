#!/usr/bin/env bash

alias dockta='node ../dist/cli.js'

dockta --version
dockta compile executa-all
dockta compile --from stencila/executa-all executa-midi
