# Kütüphane Yönetim Sistemi - Deployment Rehberi

## Mimari

- **Frontend**: Cloudflare Pages (Next.js static export)
- **API**: Control Plane (NestJS, scale-to-zero)
- **Database**: Neon PostgreSQL (serverless)

## Gereksinimler

- [Cloudflare](https://dash.cloudflare.com) hesabı (ücretsiz)
- [Control Plane](https://controlplane.com) hesabı (~$2-8/ay)
- [Neon](https://neon.tech) hesabı (ücretsiz tier)
- [Firebase](https://console.firebase.google.com) projesi (authentication)

---

## 1. Neon PostgreSQL Kurulumu

1. [Neon Console](https://console.neon.tech)'da yeni proje oluşturun
2. Connection string'leri alın:
   - **Pooled** (runtime): `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/kutuphane_db?sslmode=require`
   - **Direct** (migrations): `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/kutuphane_db?sslmode=require` (non-pooled)

3. Migration çalıştırın:
```bash
cd apps/api
DATABASE_URL="pooled-url" DIRECT_DATABASE_URL="direct-url" npx prisma migrate deploy
```

---

## 2. Control Plane (API) Deploy

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
   - `DATABASE_URL` - Neon pooled connection string
   - `DIRECT_DATABASE_URL` - Neon direct connection string
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `CORS_ORIGINS` - Cloudflare Pages URL'i
   - `ENCRYPTION_KEY` - `openssl rand -hex 32`

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

## 3. Cloudflare Pages (Frontend) Deploy

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

## 4. Firebase Ayarları

1. [Firebase Console](https://console.firebase.google.com) > Authentication
2. Sign-in method: Email/Password ve Google'ı etkinleştirin
3. Authorized domains: Cloudflare Pages URL'inizi ekleyin
4. Project Settings > Service Accounts > Generate new private key

---

## Maliyet

| Servis | Maliyet |
|--------|---------|
| Cloudflare Pages | $0 (ücretsiz) |
| Neon PostgreSQL | $0 (ücretsiz tier, 0.5GB) |
| Control Plane | ~$2-8/ay (scale-to-zero) |
| Firebase Auth | $0 (50K kullanıcıya kadar) |
| **Toplam** | **~$2-8/ay** |

---

## Sorun Giderme

### API yanıt vermiyor
```bash
# Health check
curl https://YOUR-API.cpln.app/api/health

# Control Plane logları
cpln workload logs api --org YOUR_ORG --gvc kutuphane-api
```

### Database bağlantı hatası
- Neon dashboard'dan connection string'i doğrulayın
- `?sslmode=require` parametresinin olduğundan emin olun

### Frontend API'ye bağlanamıyor
- CORS_ORIGINS'de Cloudflare Pages URL'inin doğru olduğunu kontrol edin
- NEXT_PUBLIC_API_URL'in doğru ayarlandığını kontrol edin

## Lokal Geliştirme

```bash
docker compose up -d  # PostgreSQL başlat
cd apps/api && npm run dev
cd apps/web && npm run dev
```
