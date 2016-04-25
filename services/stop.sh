#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

# Check if the machine is currently stopped
[ "$(docker-machine status pmpy)" == "Stopped" ] && exit 0

# Setup the docker environment so docker-compose works
eval $(docker-machine env pmpy)

docker-compose stop && docker-compose rm -f
docker-machine stop pmpy

echo "Playground is closed"