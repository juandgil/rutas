FROM node:20-slim

# Instalar Redis
RUN apt-get update && apt-get install -y redis-server

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias, incluyendo devDependencies
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación TypeScript
RUN npm run build

# Eliminar dependencias de desarrollo después de la compilación
RUN npm ci --only=production

# Script para iniciar Redis y la aplicación
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV PORT=8080
ENV NODE_ENV=production

# Usar el script de inicio
CMD ["/start.sh"]
