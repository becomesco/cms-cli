#!/bin/bash

port=1280
app_name="bcms"

docker stop ${app_name}
docker rm ${app_name}
docker rmi ${app_name}

docker build . -t ${app_name}
docker run -d -p ${port}:${port} --env-file .env --name ${app_name} ${app_name}