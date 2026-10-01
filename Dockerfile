FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluyendo dev) - v2
RUN npm ci && npm list vite esbuild

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiar solo las dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar los archivos construidos
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]
