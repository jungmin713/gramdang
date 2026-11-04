#!/usr/bin/env bash
# 사이트를 site/ 폴더로 빌드해요. GitHub Pages가 이 폴더를 그대로 배포해요.
set -euo pipefail
export SITE_URL="${SITE_URL:-https://jungmin713.github.io/gramdang}"
node seo/prerender.mjs
rm -rf dist bundle.html .parcel-cache
pnpm exec parcel build index.html --dist-dir dist --no-source-maps
pnpm exec html-inline dist/index.html > bundle.html
node seo/finalize.mjs
