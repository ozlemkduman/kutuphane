#!/bin/bash
set -e
ENV=${1:-staging}

if [ "$ENV" = "staging" ]; then
  # 1. .env.staging ile build
  cd apps/web
  cp .env.production .env.production.bak
  cp .env.staging .env.production
  npx next build
  mv .env.production.bak .env.production
  # 2. deploy-public hazirla
  rm -rf deploy-public && mkdir -p deploy-public/_next
  cp .next/server/app/*.html deploy-public/ 2>/dev/null || true
  for dir in .next/server/app/*/; do
    d=$(basename "$dir"); mkdir -p "deploy-public/$d"
    cp "$dir"*.html "deploy-public/$d/" 2>/dev/null || true
    # Nested routes
    for subdir in "$dir"*/; do
      [ -d "$subdir" ] && sd=$(basename "$subdir") && mkdir -p "deploy-public/$d/$sd" && cp "$subdir"*.html "deploy-public/$d/$sd/" 2>/dev/null || true
    done
  done
  cp -r .next/static deploy-public/_next/static
  # 3. Firebase staging deploy
  firebase deploy --only hosting:staging
  cd ../..
  echo "Staging: https://kitaphane-staging.web.app"

elif [ "$ENV" = "production" ]; then
  # .env.local'i yedekle
  cd apps/web
  [ -f .env.local ] && mv .env.local .env.local.bak
  npx next build
  [ -f .env.local.bak ] && mv .env.local.bak .env.local
  # deploy-public hazirla (ayni mantik)
  rm -rf deploy-public && mkdir -p deploy-public/_next
  cp .next/server/app/*.html deploy-public/ 2>/dev/null || true
  for dir in .next/server/app/*/; do
    d=$(basename "$dir"); mkdir -p "deploy-public/$d"
    cp "$dir"*.html "deploy-public/$d/" 2>/dev/null || true
    for subdir in "$dir"*/; do
      [ -d "$subdir" ] && sd=$(basename "$subdir") && mkdir -p "deploy-public/$d/$sd" && cp "$subdir"*.html "deploy-public/$d/$sd/" 2>/dev/null || true
    done
  done
  cp -r .next/static deploy-public/_next/static
  # Firebase production deploy
  firebase deploy --only hosting:production
  cd ../..
  echo "Production: https://birkitapaldim.com"
fi
