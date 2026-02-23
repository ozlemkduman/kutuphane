# NestJS API Production Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma için gerekli
RUN apk add --no-cache openssl

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Prisma client oluştur
RUN npx prisma generate

# Kaynak kodları kopyala ve derle
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl curl

# Production bağımlılıkları
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Build çıktısını kopyala
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Başlatmadan önce migration çalıştır
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
