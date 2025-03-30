FROM node:20-slim

# Instalar Redis
RUN apt-get update && apt-get install -y redis-server

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de producción y desarrollo
RUN npm ci

# Instalar tipos adicionales
RUN npm install --save-dev @types/morgan

# Copiar código fuente
COPY . .

# Añadir archivo .env para producción si no existe
RUN if [ ! -f .env ]; then echo "NODE_ENV=production" > .env; fi

# Script para iniciar Redis y la aplicación
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Variables de entorno para PubSub y otros servicios
ENV PORT=8080
ENV NODE_ENV=production
ENV USER_ID=juan-gil-prod
ENV GOOGLE_CLOUD_PROJECT_ID=pruebadesarrollosenior
ENV PUBSUB_ENABLED=true
ENV CACHE_ENABLED=true
ENV HIGH_LOAD_MODE=true
ENV LOG_LEVEL=info

# Configuraciones de Redis y DB
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV DB_HOST=/cloudsql/pruebadesarrollosenior:us-central1:rutas-db
ENV DB_PORT=5432
ENV DB_NAME=rutas_db
ENV DB_USER=app_user
ENV DB_PASSWORD=PdYNH%0*%M<^Yu`1

# Compilar la aplicación TypeScript
RUN npm run build

# Eliminar dependencias de desarrollo después de la compilación
RUN npm ci --omit=dev

# Exponer el puerto
EXPOSE 8080

# Usar el script de inicio
CMD ["/start.sh"]
