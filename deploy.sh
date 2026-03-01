#!/bin/bash
set -e
ENV=${1:-staging}

# Ortak fonksiyon: deploy-public hazirla
prepare_deploy() {
  rm -rf deploy-public && mkdir -p deploy-public/_next
  cp .next/server/app/*.html deploy-public/ 2>/dev/null || true
  for dir in .next/server/app/*/; do
    d=$(basename "$dir")
    # Icon dosyalarini atla (bunlar klasor degil dosya olacak)
    case "$d" in favicon.ico|icon.png|apple-icon.png) continue ;; esac
    mkdir -p "deploy-public/$d"
    cp "$dir"*.html "deploy-public/$d/" 2>/dev/null || true
    # Nested routes
    for subdir in "$dir"*/; do
      [ -d "$subdir" ] && sd=$(basename "$subdir") && mkdir -p "deploy-public/$d/$sd" && cp "$subdir"*.html "deploy-public/$d/$sd/" 2>/dev/null || true
    done
  done
  cp -r .next/static deploy-public/_next/static
  # Favicon, icon, apple-icon (.body dosyalari gercek icerik)
  [ -f .next/server/app/favicon.ico.body ] && cp .next/server/app/favicon.ico.body deploy-public/favicon.ico
  [ -f .next/server/app/icon.png.body ] && cp .next/server/app/icon.png.body deploy-public/icon.png
  [ -f .next/server/app/apple-icon.png.body ] && cp .next/server/app/apple-icon.png.body deploy-public/apple-icon.png
  # Public klasorundeki dosyalar (manifest, ikonlar, logo)
  cp public/site.webmanifest deploy-public/ 2>/dev/null || true
  cp public/icon-192.png public/icon-512.png public/apple-touch-icon.png public/logo-kitap.png deploy-public/ 2>/dev/null || true
}

if [ "$ENV" = "staging" ]; then
  # .env.staging ile build
  cd apps/web
  cp .env.production .env.production.bak
  cp .env.staging .env.production
  npx next build
  mv .env.production.bak .env.production
  prepare_deploy
  firebase deploy --only hosting:staging
  cd ../..
  echo "Staging: https://kitaphane-staging.web.app"

elif [ "$ENV" = "production" ]; then
  cd apps/web
  [ -f .env.local ] && mv .env.local .env.local.bak
  npx next build
  [ -f .env.local.bak ] && mv .env.local.bak .env.local
  prepare_deploy
  firebase deploy --only hosting:production
  cd ../..
  echo "Production: https://birkitapaldim.com"
fi
