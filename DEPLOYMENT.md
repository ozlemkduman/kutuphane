# Kütüphane Yönetim Sistemi - Deployment Rehberi

## Mimari

- **Frontend**: Cloudflare Pages (Next.js)
- **API + Database**: Control Plane (NestJS + PostgreSQL)

---

## 1. Control Plane (API + PostgreSQL)

### İlk Kurulum

1. [Control Plane CLI](https://docs.controlplane.com/quickstart) kurun:
```bash
npm install -g @controlplane/cli
cpln login
```

2. GVC ve workload oluşturun:
```bash
cd apps/api
cpln apply -f cpln.yaml --org YOUR_ORG
```

3. Docker image oluşturup push edin:
```bash
cpln image build --name kutuphane-api --dir . --org YOUR_ORG
```

4. Secret'ları ayarlayın (Control Plane dashboard veya CLI):
   - `DATABASE_URL` — PostgreSQL connection string
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `CORS_ORIGINS` — Cloudflare Pages URL'i
   - `ENCRYPTION_KEY` — `openssl rand -hex 32`

5. Health check doğrulayın:
```bash
curl https://YOUR-API.cpln.app/api/health
# {"status":"ok"}
```

### Güncelleme

```bash
cd apps/api
cpln image build --name kutuphane-api --dir . --org YOUR_ORG
```

---

## 2. Cloudflare Pages (Frontend)

### İlk Kurulum

1. [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages > Create a project
2. GitHub reposunu bağlayın
3. **Framework preset**: Next.js
4. Build ayarları:
   - **Root directory**: `apps/web`
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
5. Environment variables ekleyin:
   - `NEXT_PUBLIC_API_URL` = Control Plane API URL
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Güncelleme

GitHub'a push ettiğinizde otomatik deploy olur.

---

## 3. Firebase Ayarları

1. [Firebase Console](https://console.firebase.google.com) > Authentication
2. Sign-in method: Email/Password ve Google'ı etkinleştirin
3. Authorized domains: Cloudflare Pages URL'inizi ekleyin
4. Project Settings > Service Accounts > Generate new private key

---

## Lokal Geliştirme

```bash
docker compose up -d  # PostgreSQL başlat
cd apps/api && npm run dev
cd apps/web && npm run dev
```
