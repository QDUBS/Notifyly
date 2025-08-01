# Development configuration
FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npm run build

# Production configuration
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npm run build

CMD ["node", "dist/main"]