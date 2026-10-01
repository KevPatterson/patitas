FROM node:20-alpine AS builder
WORKDIR /app

# Copiar todo el código
COPY . .

# Instalar todas las dependencias
RUN npm ci

# Construir la aplicación
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiar package files
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar los archivos construidos
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
