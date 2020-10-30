#!/usr/bin/env bash

# Script for compiling package lists and Dockerfiles for images

npx ts-node generate.ts python/executa-midi.json r/executa-midi.json
sed -i -e "s!Date: .*!Date: $(date --utc --date='2 days ago' --iso)!g" executa-midi/DESCRIPTION
npx ts-node ../src/cli compile --from stencila/executa-all executa-midi
