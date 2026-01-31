# Kütüphane Yönetim Sistemi - Deployment Rehberi

## Gereksinimler

- Ubuntu 20.04+ veya Debian 11+
- Docker 24+
- Docker Compose v2
- Domain adı (örn: kutuphane.example.com)
- DNS ayarları (A record sunucu IP'sine yönlendirilmiş)

## Hızlı Kurulum

### 1. Sunucuya Bağlanın

```bash
ssh root@SUNUCU_IP
```

### 2. Docker Kurulumu (yoksa)

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Projeyi Klonlayın

```bash
git clone https://github.com/KULLANICI/kutuphane.git
cd kutuphane
```

### 4. Environment Dosyasını Oluşturun

```bash
cp .env.production.example .env.production
nano .env.production
```

Aşağıdaki değerleri doldurun:
- `DOMAIN` - Ana domain (örn: kutuphane.okul.com)
- `API_DOMAIN` - API domain (örn: api.kutuphane.okul.com)
- `DB_PASSWORD` - Güçlü bir şifre
- `FIREBASE_*` - Firebase credentials
- `ENCRYPTION_KEY` - `openssl rand -hex 32` ile oluşturun

### 5. Nginx Config'i Güncelleyin

```bash
nano nginx/conf.d/kutuphane.conf
```

`kutuphane.example.com` yerine kendi domain'inizi yazın.

### 6. Kurulumu Başlatın

```bash
chmod +x deploy.sh
./deploy.sh setup
./deploy.sh ssl      # SSL sertifikası al
./deploy.sh start    # Servisleri başlat
```

### 7. Kontrol Edin

```bash
./deploy.sh status
./deploy.sh logs     # Tüm loglar
./deploy.sh logs api # Sadece API logları
```

## Deploy Komutları

| Komut | Açıklama |
|-------|----------|
| `./deploy.sh setup` | İlk kurulum |
| `./deploy.sh ssl` | SSL sertifikası al |
| `./deploy.sh start` | Servisleri başlat |
| `./deploy.sh stop` | Servisleri durdur |
| `./deploy.sh restart` | Yeniden başlat |
| `./deploy.sh logs` | Logları göster |
| `./deploy.sh status` | Durum kontrolü |
| `./deploy.sh backup` | DB yedekle |
| `./deploy.sh migrate` | DB migration |

## Firebase Ayarları

1. [Firebase Console](https://console.firebase.google.com)'a gidin
2. Authentication > Sign-in method > Email/Password ve Google'ı etkinleştirin
3. Authentication > Settings > Authorized domains > Domain'inizi ekleyin
4. Project Settings > Service Accounts > Generate new private key

## DNS Ayarları

```
A    kutuphane.okul.com      → SUNUCU_IP
A    api.kutuphane.okul.com  → SUNUCU_IP
```

## Güncelleme

```bash
git pull
./deploy.sh restart
```

## Sorun Giderme

### Logları kontrol et
```bash
./deploy.sh logs api
./deploy.sh logs web
./deploy.sh logs nginx
```

### Container'a bağlan
```bash
docker compose -f docker-compose.prod.yml exec api sh
```

### Veritabanını sıfırla
```bash
./deploy.sh stop
docker volume rm kutuphane_postgres_data
./deploy.sh start
```

## Yedekleme

### Manuel yedek
```bash
./deploy.sh backup
```

### Otomatik yedek (cron)
```bash
crontab -e
# Her gün saat 03:00'da yedek al
0 3 * * * cd /root/kutuphane && ./deploy.sh backup
```
