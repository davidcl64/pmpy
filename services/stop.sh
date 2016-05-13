#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

# Check if both vboxmanage and docker-machine are installed - use them if they are
if hash vboxmanage 2>/dev/null && hash docker-machine 2>/dev/null; then
    # Check if the machine is currently stopped
    [ "$(docker-machine status pmpy)" == "Stopped" ] && exit 0

    # Setup the docker environment so docker-compose works
    eval $(docker-machine env pmpy)

    docker-compose stop && docker-compose rm -f --all
    docker-machine stop pmpy
else
    docker-compose stop && docker-compose rm -f --all
fi


echo "Playground is closed"