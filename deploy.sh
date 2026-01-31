#!/bin/bash

# ============================================
# Kütüphane Deployment Script
# ============================================
# Kullanım: ./deploy.sh [komut]
# Komutlar: setup, start, stop, restart, logs, ssl, backup

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonksiyonlar
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# .env.production kontrolü
check_env() {
    if [ ! -f .env.production ]; then
        log_error ".env.production dosyası bulunamadı!"
        log_info "Oluşturmak için: cp .env.production.example .env.production"
        exit 1
    fi
    source .env.production
}

# İlk kurulum
setup() {
    log_info "Kurulum başlatılıyor..."

    # Docker kontrolü
    if ! command -v docker &> /dev/null; then
        log_error "Docker yüklü değil! https://docs.docker.com/engine/install/"
        exit 1
    fi

    # Docker Compose kontrolü
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose yüklü değil!"
        exit 1
    fi

    check_env

    # Gerekli dizinleri oluştur
    mkdir -p certbot/conf certbot/www
    mkdir -p apps/api/uploads

    log_info "Kurulum tamamlandı. SSL için: ./deploy.sh ssl"
}

# SSL sertifikası al (Let's Encrypt)
ssl() {
    check_env

    if [ -z "$DOMAIN" ]; then
        log_error "DOMAIN değişkeni .env.production'da tanımlı değil!"
        exit 1
    fi

    log_info "SSL sertifikası alınıyor: $DOMAIN, $API_DOMAIN"

    # Önce nginx'i SSL olmadan başlat (challenge için)
    docker compose -f docker-compose.prod.yml up -d nginx

    # Certbot ile sertifika al
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d $API_DOMAIN

    log_info "SSL sertifikası alındı. Nginx yeniden başlatılıyor..."
    docker compose -f docker-compose.prod.yml restart nginx

    log_info "SSL kurulumu tamamlandı!"
}

# Servisleri başlat
start() {
    check_env
    log_info "Servisler başlatılıyor..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
    log_info "Servisler başlatıldı!"
    docker compose -f docker-compose.prod.yml ps
}

# Servisleri durdur
stop() {
    log_info "Servisler durduruluyor..."
    docker compose -f docker-compose.prod.yml down
    log_info "Servisler durduruldu."
}

# Servisleri yeniden başlat
restart() {
    log_info "Servisler yeniden başlatılıyor..."
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
    log_info "Servisler yeniden başlatıldı!"
}

# Logları göster
logs() {
    docker compose -f docker-compose.prod.yml logs -f --tail=100 $1
}

# Veritabanı yedekle
backup() {
    check_env
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Veritabanı yedekleniyor: $BACKUP_FILE"
    docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
    log_info "Yedekleme tamamlandı: $BACKUP_FILE"
}

# Durum kontrolü
status() {
    docker compose -f docker-compose.prod.yml ps
}

# Veritabanı migration
migrate() {
    log_info "Migration çalıştırılıyor..."
    docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
    log_info "Migration tamamlandı!"
}

# Yardım
help() {
    echo "Kullanım: ./deploy.sh [komut]"
    echo ""
    echo "Komutlar:"
    echo "  setup    - İlk kurulum (dizinler, kontroller)"
    echo "  ssl      - Let's Encrypt SSL sertifikası al"
    echo "  start    - Servisleri başlat"
    echo "  stop     - Servisleri durdur"
    echo "  restart  - Servisleri yeniden başlat"
    echo "  logs     - Logları göster (opsiyonel: servis adı)"
    echo "  status   - Servis durumlarını göster"
    echo "  backup   - Veritabanı yedeği al"
    echo "  migrate  - Veritabanı migration çalıştır"
    echo "  help     - Bu yardım mesajı"
}

# Ana komut
case "${1:-help}" in
    setup)   setup ;;
    ssl)     ssl ;;
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    logs)    logs $2 ;;
    status)  status ;;
    backup)  backup ;;
    migrate) migrate ;;
    help)    help ;;
    *)       log_error "Bilinmeyen komut: $1"; help; exit 1 ;;
esac
