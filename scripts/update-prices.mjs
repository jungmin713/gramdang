// 쿠팡 파트너스 Open API로 상품 가격을 새로 받아와요.
// 필요한 환경변수: COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY
// 키가 없으면 아무것도 바꾸지 않고 끝나요 (API 승인 전에도 안전하게 돌아가요).
import { createHmac } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const AK = process.env.COUPANG_ACCESS_KEY
const SK = process.env.COUPANG_SECRET_KEY
const PRODUCTS = 'src/data/products.json'
const META = 'src/data/meta.json'

if (!AK || !SK) {
  console.log('쿠팡 API 키가 없어서 가격 갱신을 건너뛰어요.')
  process.exit(0)
}

const HOST = 'https://api-gateway.coupang.com'
const SEARCH = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search'

function signedDate() {
  const d = new Date().toISOString() // 2026-11-01T22:00:00.000Z
  return d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) + 'T' + d.slice(11, 13) + d.slice(14, 16) + d.slice(17, 19) + 'Z'
}

async function call(method, path, query) {
  const dt = signedDate()
  const sig = createHmac('sha256', SK).update(dt + method + path + query).digest('hex')
  const res = await fetch(`${HOST}${path}${query ? '?' + query : ''}`, {
    method,
    headers: {
      Authorization: `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${dt}, signature=${sig}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const products = JSON.parse(readFileSync(PRODUCTS, 'utf8'))
let updated = 0
let changed = false

for (const p of products) {
  const keyword = p.coupangTitle ?? p.name
  try {
    const query = `keyword=${encodeURIComponent(keyword)}&limit=10`
    const json = await call('GET', SEARCH, query)
    const list = json?.data?.productData ?? []
    const hit =
      list.find((x) => p.coupangProductId && String(x.productId) === String(p.coupangProductId)) ??
      list.find((x) => norm(x.productName) === norm(keyword))
    if (!hit) {
      console.log(`못 찾음: ${keyword}`)
      continue
    }
    updated++
    if (!p.coupangProductId) { p.coupangProductId = String(hit.productId); changed = true }
    if (Number(hit.productPrice) !== p.price) {
      console.log(`${p.name}: ${p.price} → ${hit.productPrice}`)
      p.price = Number(hit.productPrice)
      changed = true
    }
    if (!p.url && hit.productUrl) { p.url = hit.productUrl; changed = true }
  } catch (e) {
    console.log(`오류 (${keyword}): ${e.message}`)
  }
  await sleep(1500)
}

if (updated > 0) {
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) // 한국 날짜
  writeFileSync(META, JSON.stringify({ priceDate: today }))
  changed = true
}
if (changed) writeFileSync(PRODUCTS, JSON.stringify(products, null, 2) + '\n')
console.log(`가격 확인 ${updated}/${products.length}개`)
