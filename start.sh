#!/bin/bash

# Iniciar Redis en segundo plano
redis-server --daemonize yes

# Esperar a que Redis esté realmente listo (hasta 10 intentos)
for i in {1..10}; do
  if redis-cli ping > /dev/null 2>&1; then
    echo "Redis está listo"
    break
  fi
  echo "Esperando a Redis... intento $i"
  sleep 2
done

# Iniciar la aplicación Node.js
npm start 