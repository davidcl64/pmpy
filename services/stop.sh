#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

# Setup the docker environment so docker-compose works
eval $(docker-machine env pmpy)

docker-compose stop && docker-compose rm -f
docker-machine stop pmpy