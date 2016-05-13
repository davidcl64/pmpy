#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

# Setup the docker environment so docker-compose works
eval $(docker-machine env pmpy 2>/dev/null)

echo ""
echo "Stopping and removing services"
docker-compose stop && docker-compose rm -f

echo ""
echo "Starting services"
docker-compose up -d

echo ""
docker-machine env pmpy 2>/dev/null
echo ""