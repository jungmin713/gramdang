// 상품 데이터로 index.html, robots.txt, sitemap.xml 을 만들어요.
// 사용법: SITE_URL=https://내도메인.com node seo/prerender.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const SITE_URL = (process.env.SITE_URL || 'https://gramdang.example.com').replace(/\/$/, '')
const products = JSON.parse(readFileSync('src/data/products.json', 'utf8'))
const CAT = { drink: '단백질 음료', bar: '프로틴바', chicken: '닭가슴살' }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const won = (n) => Math.round(n).toLocaleString('ko-KR')

const rows = products
  .map((p) => ({ ...p, ppg: p.price / (p.count * p.protein) }))
  .sort((a, b) => a.ppg - b.ppg)

const list = `<ol>${rows
  .map((p) => `<li><h2>${esc(p.name)}</h2><p>${esc(CAT[p.category])} ${esc(p.brand)} ${esc(p.serving)} ${p.count}개입. 1회 단백질 ${p.protein}g, 당류 ${esc(p.sugarLabel ?? p.sugar + 'g')}, 열량 ${p.kcal}kcal. 단백질 1g당 약 ${won(p.ppg)}원.</p>${p.url ? `<p><a href="${esc(p.url)}" rel="sponsored noopener">쿠팡에서 보기</a></p>` : ''}</li>`)
  .join('')}</ol>`

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: '그램당', url: `${SITE_URL}/`, inLanguage: 'ko-KR' },
    {
      '@type': 'ItemList',
      name: '저당 고단백 식품 단백질 1g당 가격 순위',
      itemListElement: rows.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          brand: { '@type': 'Brand', name: p.brand },
          category: CAT[p.category],
          description: `1회 제공량 ${p.serving} 기준 단백질 ${p.protein}g, 당류 ${p.sugarLabel ?? p.sugar + 'g'}, 열량 ${p.kcal}kcal`,
        },
      })),
    },
  ],
}

const html = readFileSync('seo/index.template.html', 'utf8')
  .replaceAll('__SITE_URL__', SITE_URL)
  .replace('__JSONLD__', JSON.stringify(jsonld).replace(/</g, '\\u003c'))
  .replace('__STATIC_LIST__', list)
writeFileSync('index.html', html)

mkdirSync('public', { recursive: true })
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
const today = new Date().toISOString().slice(0, 10)
writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>\n</urlset>\n`,
)
console.log('done:', SITE_URL)

// 번들 뒤에 넣을 head 링크 (번들러가 외부 링크를 파일로 착각하지 않게 따로 보관)
writeFileSync(
  'seo/head-links.html',
  readFileSync('seo/head-links.template.html', 'utf8').replaceAll('__SITE_URL__', SITE_URL),
)
