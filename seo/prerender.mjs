// 상품 데이터로 index.html, robots.txt, sitemap.xml 을 만들어요.
// 사용법: SITE_URL=https://내도메인.com node seo/prerender.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const SITE_URL = (process.env.SITE_URL || 'https://gramdang.example.com').replace(/\/$/, '')
const products = JSON.parse(readFileSync('src/data/products.json', 'utf8')).filter((p) => !p.hidden)
const CAT = { drink: '단백질 음료', dairy: '그릭요거트', tofu: '두부', chicken: '닭가슴살', seafood: '참치·수산물', bar: '프로틴바', spread: '땅콩버터', grain: '통곡물 크래커', salad: '샐러드', supplement: '단백질 보충제' }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const won = (n) => Math.round(n).toLocaleString('ko-KR')

const rows = products
  .map((p) => ({ ...p, ppg: (p.protein ?? 0) >= 10 && !['spread', 'grain', 'salad'].includes(p.category) ? p.price / (p.count * p.protein) : null, per100: p.totalG ? (p.price / p.totalG) * 100 : null }))
  .sort((a, b) => (a.ppg ?? 1e6 + (a.per100 ?? 0)) - (b.ppg ?? 1e6 + (b.per100 ?? 0)))

const list = `<ol>${rows
  .map((p) => `<li><h2>${esc(p.name)}</h2><p>${esc(CAT[p.category])} ${esc(p.brand)} ${esc(p.serving)} ${p.count}개입. ${esc(p.serving)} 기준 ${p.protein != null ? `단백질 ${p.protein}g, 당류 ${esc(p.sugarLabel ?? p.sugar + 'g')}, 열량 ${p.kcal}kcal` : '생채소로 영양성분 표시 없음'}. 감미료 ${esc((p.sweeteners ?? []).join(', ') || '없음')}. ${p.ppg != null ? `단백질 1g당 약 ${won(p.ppg)}원` : p.per100 != null ? `100g당 약 ${won(p.per100)}원` : ''}.</p>${p.url ? `<p><a href="${esc(p.url)}" rel="sponsored noopener">쿠팡에서 보기</a></p>` : ''}</li>`)
  .join('')}</ol>`

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: '그램당', url: `${SITE_URL}/`, inLanguage: 'ko-KR' },
    {
      '@type': 'ItemList',
      name: '설탕 없는 건강식 가격 비교',
      itemListElement: rows.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          brand: { '@type': 'Brand', name: p.brand },
          category: CAT[p.category],
          description: p.protein != null ? `${p.serving} 기준 단백질 ${p.protein}g, 당류 ${p.sugarLabel ?? p.sugar + 'g'}, 열량 ${p.kcal}kcal` : '무농약 생채소',
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
