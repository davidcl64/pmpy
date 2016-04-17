#!/usr/bin/env bash

# Get the location of the start script
dir=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Use that location as the working directory
cd $dir

# Create the docker-machine if it doesn't alread exist
docker-machine create --driver virtualbox --virtualbox-hostonly-cidr "10.10.0.1/24" pmpy

# Start it if it isn't already started
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

echo ""
docker-machine env pmpy
echo ""

