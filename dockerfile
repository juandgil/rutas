FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
