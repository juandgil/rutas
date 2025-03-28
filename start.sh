#!/bin/bash

# Iniciar Redis en segundo plano
redis-server --daemonize yes

# Esperar a que Redis esté listo
sleep 2

# Iniciar la aplicación Node.js
npm start 