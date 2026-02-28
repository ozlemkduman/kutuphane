# NestJS API Production Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --ignore-scripts

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Non-root user (dosya kopyalamadan ÖNCE oluştur)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

RUN apk add --no-cache openssl curl && chown nestjs:nodejs /app

# Dosyaları doğrudan doğru sahiplikle kopyala
COPY --chown=nestjs:nodejs package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --chown=nestjs:nodejs prisma ./prisma/
RUN npx prisma generate

COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || (echo 'Migration failed, resolving...' && npx prisma migrate resolve --rolled-back 20260227_add_passive_students 2>&1; npx prisma migrate deploy 2>&1) || true; node dist/src/main.js"]
