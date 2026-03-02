#!/bin/bash
set -e
ENV=${1:-staging}

# Ortak fonksiyon: deploy-public hazirla
prepare_deploy() {
  rm -rf deploy-public && mkdir -p deploy-public/_next

  # HTML ve RSC dosyalarini kopyala (client-side navigation icin RSC gerekli)
  cp .next/server/app/*.html deploy-public/ 2>/dev/null || true
  cp .next/server/app/*.rsc deploy-public/ 2>/dev/null || true

  # Segment dosyalarini kopyala (client-side navigation icin)
  for segdir in .next/server/app/*.segments; do
    [ -d "$segdir" ] || continue
    d=$(basename "$segdir")
    mkdir -p "deploy-public/$d"
    cp "$segdir"/*.rsc "deploy-public/$d/" 2>/dev/null || true
  done

  for dir in .next/server/app/*/; do
    d=$(basename "$dir")
    # Icon dosyalarini ve segment klasorlerini atla
    case "$d" in favicon.ico|icon.png|apple-icon.png|*.segments) continue ;; esac
    mkdir -p "deploy-public/$d"
    cp "$dir"*.html "deploy-public/$d/" 2>/dev/null || true
    cp "$dir"*.rsc "deploy-public/$d/" 2>/dev/null || true
    # Segment dosyalari
    for segdir in "$dir"*.segments; do
      [ -d "$segdir" ] || continue
      sd=$(basename "$segdir")
      mkdir -p "deploy-public/$d/$sd"
      cp "$segdir"/*.rsc "deploy-public/$d/$sd/" 2>/dev/null || true
    done
    # Nested routes
    for subdir in "$dir"*/; do
      [ -d "$subdir" ] || continue
      sd=$(basename "$subdir")
      case "$sd" in *.segments) continue ;; esac
      mkdir -p "deploy-public/$d/$sd"
      cp "$subdir"*.html "deploy-public/$d/$sd/" 2>/dev/null || true
      cp "$subdir"*.rsc "deploy-public/$d/$sd/" 2>/dev/null || true
      # Nested segment dosyalari
      for segdir in "$subdir"*.segments; do
        [ -d "$segdir" ] || continue
        ssd=$(basename "$segdir")
        mkdir -p "deploy-public/$d/$sd/$ssd"
        cp "$segdir"/*.rsc "deploy-public/$d/$sd/$ssd/" 2>/dev/null || true
      done
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
