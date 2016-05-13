#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

if hash vboxmanage 2>/dev/null && hash docker-machine 2>/dev/null; then
  echo "Found docker-machine an virtual box, creating a new machine (pmpy)"
else
  echo "Either docker-machine or virtualbox is unavailable."
  echo "If you are running the docker beta or native, feel free to continue"
  echo
  exit 0
fi

# Create the docker-machine if it doesn't alread exist
if [[ -z "$(docker-machine status pmpy)" ]] ; then
  echo 'Creating host: pmpy'
  docker-machine create --driver virtualbox --virtualbox-hostonly-cidr "10.10.0.1/24" pmpy
fi

# Start it if it isn't already started
if [[ $(docker-machine status pmpy) != *Running* ]] ; then
  docker-machine start pmpy

  # Setup the docker environment so docker-compose works
  eval $(docker-machine env pmpy)

  echo ""
  echo "Starting services"
  docker-compose up -d

  function map_ports {
    echo "$1"
    for port in `docker port $1 | cut -d'-' -f1`;
    do
        port_num=`echo ${port} | cut -d'/' -f1`
        port_type=`echo ${port} | cut -d'/' -f2`
        echo "- Create rule natpf1 for ${port_type} port ${port_num}"
        VBoxManage controlvm "pmpy" natpf1 delete "${port_type}-port${port_num}" &>/dev/null
        VBoxManage controlvm "pmpy" natpf1 "${port_type}-port${port_num},${port_type},,${port_num},,${port_num}"
    done
  }

  echo ""
  map_ports services_consul_1
  echo ""
  map_ports services_vault_1
fi

echo ""
docker-machine env pmpy
echo ""

