import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ExternalLink, RotateCcw, Info } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import raw from './data/products.json'
import meta from './data/meta.json'

type Cat = 'drink' | 'dairy' | 'tofu' | 'chicken' | 'seafood' | 'bar' | 'bread' | 'spread' | 'grain' | 'salad' | 'supplement'
type Product = {
  id: string; name: string; brand: string; category: Cat; serving: string; count: number
  protein: number | null; sugar: number | null; sugarLabel?: string; kcal: number | null; price: number
  priceSource: string; estimated: boolean; color: string; url?: string; coupangTitle?: string
  sweeteners?: string[]; note?: string; hidden?: boolean; priceDate?: string; plant?: boolean
  totalG?: number; packLabel?: string; image?: string
  offers?: Offer[]; danawaUrl?: string; offersDate?: string
}
type Offer = { store: string; price: number; ship: number; url: string; count?: number }
type Row = Product & {
  unit: number; ppg: number | null; per100: number | null; ratio: number | null; proteinFood: boolean
  bestStore: string; bestUnit: number; cheaperElsewhere: boolean
}
type SortKey = 'value' | 'protein' | 'sugar' | 'ratio' | 'price'
type Sweet = 'all' | 'noArtificial' | 'none'

const CAT_LABEL: Record<Cat, string> = {
  drink: '단백질 음료', dairy: '그릭요거트', tofu: '두부', chicken: '닭가슴살', seafood: '참치·수산물',
  bar: '프로틴바', bread: '고단백 빵', spread: '땅콩버터', grain: '통곡물 크래커', salad: '샐러드', supplement: '단백질 보충제',
}
const CAT_ORDER: Cat[] = ['drink', 'dairy', 'tofu', 'chicken', 'seafood', 'bar', 'bread', 'spread', 'grain', 'salad', 'supplement']
const WHOLE_CATS: Cat[] = ['spread', 'grain', 'salad']
const ARTIFICIAL = ['수크랄로스', '아세설팜칼륨', '아스파탐', '사카린']
const isArtificial = (s: string) => ARTIFICIAL.includes(s)
const SWEETS: { key: Sweet; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'noArtificial', label: '인공감미료 없음' },
  { key: 'none', label: '감미료 없음' },
]
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'value', label: '가성비순' },
  { key: 'protein', label: '단백질 많은순' },
  { key: 'sugar', label: '당류 적은순' },
  { key: 'ratio', label: '열량 대비 단백질순' },
  { key: 'price', label: '낮은 가격순' },
]

const offerUnit = (p: Product, o: Offer) => (o.price + o.ship) / (o.count ?? p.count)
const ROWS: Row[] = (raw as Product[]).filter((p) => !p.hidden).map((p) => {
  const proteinFood = (p.protein ?? 0) >= 10 && !WHOLE_CATS.includes(p.category)
  const unit = p.price / p.count
  let bestUnit = unit
  let bestStore = p.priceSource
  for (const o of p.offers ?? []) {
    const u = offerUnit(p, o)
    if (u < bestUnit) { bestUnit = u; bestStore = o.store }
  }
  return {
    ...p,
    proteinFood,
    unit,
    bestUnit,
    bestStore,
    cheaperElsewhere: bestUnit < unit - 0.5,
    ppg: proteinFood && p.protein ? bestUnit / p.protein : null,
    per100: p.totalG ? ((bestUnit * p.count) / p.totalG) * 100 : null,
    ratio: p.protein != null && p.kcal ? (p.protein * 4) / p.kcal : null,
  }
})

const won = (n: number) => Math.round(n).toLocaleString('ko-KR')
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const g = (n: number | null) => (n == null ? '—' : `${fmt(n)}g`)
const sugarText = (p: Product) => p.sugarLabel ?? g(p.sugar)
const linkFor = (p: Product) => p.url ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`
const dot = (d: string) => d.replace(/-/g, '.')
const PRICE_DATE = dot(ROWS.reduce((m, p) => (p.priceDate && p.priceDate > m ? p.priceDate : m), meta.priceDate))
const sweetOk = (p: Product, s: Sweet) =>
  s === 'all' || (s === 'none' ? !(p.sweeteners ?? []).length : !(p.sweeteners ?? []).some(isArtificial))
const packText = (p: Product) => p.packLabel ?? `${p.serving} × ${p.count}개`
const valueText = (p: Row) => (p.ppg != null ? { label: '단백질 1g당', v: p.ppg } : p.per100 != null ? { label: '100g당', v: p.per100 } : null)

function ProductArt({ p }: { p: Product }) {
  const c = p.color
  const big = p.protein != null ? `${fmt(p.protein)}g` : ''
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full" role="img" aria-label={`${p.name} 일러스트`}>
      <rect width="200" height="140" fill="#F4F6F5" />
      <circle cx="160" cy="28" r="46" fill={c} opacity="0.12" />
      {p.category === 'drink' && (
        <g transform="translate(70 18)">
          <path d="M8 22 L30 4 L52 22 Z" fill={c} opacity="0.75" />
          <rect x="8" y="22" width="44" height="88" rx="3" fill={c} />
          <rect x="14" y="44" width="32" height="34" rx="2" fill="#fff" opacity="0.92" />
          <text x="30" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{big}</text>
          <text x="30" y="72" textAnchor="middle" fontSize="7" fill="#555">{p.plant ? 'SOY' : 'PROTEIN'}</text>
          <rect x="40" y="0" width="5" height="16" rx="1" fill="#fff" stroke={c} strokeWidth="1.5" />
        </g>
      )}
      {p.category === 'dairy' && (
        <g transform="translate(58 26)">
          <path d="M4 18 L80 18 L72 96 Q42 104 12 96 Z" fill={c} />
          <rect x="0" y="8" width="84" height="12" rx="4" fill={c} opacity="0.7" />
          <ellipse cx="42" cy="56" rx="24" ry="18" fill="#fff" opacity="0.92" />
          <text x="42" y="55" textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{big}</text>
          <text x="42" y="66" textAnchor="middle" fontSize="7" fill="#555">GREEK</text>
        </g>
      )}
      {p.category === 'tofu' && (
        <g transform="translate(46 34)">
          <path d="M0 22 L30 4 L108 4 L78 22 Z" fill="#fff" stroke={c} strokeWidth="2" />
          <path d="M78 22 L108 4 L108 58 L78 76 Z" fill={c} opacity="0.55" />
          <rect x="0" y="22" width="78" height="54" fill={c} opacity="0.85" />
          <rect x="12" y="34" width="54" height="30" rx="3" fill="#fff" opacity="0.92" />
          <text x="39" y="49" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7A6A3C">{big}</text>
          <text x="39" y="59" textAnchor="middle" fontSize="7" fill="#555">두부</text>
        </g>
      )}
      {p.category === 'seafood' && (
        <g transform="translate(46 40)">
          <ellipse cx="54" cy="12" rx="54" ry="12" fill={c} opacity="0.65" />
          <rect x="0" y="12" width="108" height="52" fill={c} />
          <ellipse cx="54" cy="64" rx="54" ry="12" fill={c} />
          <rect x="18" y="22" width="72" height="30" rx="3" fill="#fff" opacity="0.92" />
          <text x="54" y="37" textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{big}</text>
          <text x="54" y="47" textAnchor="middle" fontSize="7" fill="#555">단백질</text>
        </g>
      )}
      {p.category === 'bar' && (
        <g transform="translate(100 74) rotate(-14)">
          <path d="M-74 -18 L-66 -22 L-66 22 L-74 18 Z" fill={c} opacity="0.7" />
          <rect x="-66" y="-22" width="132" height="44" rx="4" fill={c} />
          <path d="M66 -22 L74 -18 L74 18 L66 22 Z" fill={c} opacity="0.7" />
          <rect x="-40" y="-12" width="80" height="24" rx="2" fill="#fff" opacity="0.92" />
          <text x="0" y="4" textAnchor="middle" fontWeight="800" fill={c}><tspan fontSize="12">{big}</tspan><tspan fontSize="7" dx="3" fill="#555">PROTEIN</tspan></text>
        </g>
      )}
      {p.category === 'chicken' && (
        <g transform="translate(40 30)">
          <rect x="0" y="40" width="120" height="44" rx="6" fill="#fff" stroke="#D9DEDB" />
          <path d="M14 60 Q30 22 72 28 Q112 34 104 60 Q96 82 56 80 Q20 78 14 60 Z" fill={c} />
          <ellipse cx="62" cy="56" rx="22" ry="13" fill="#fff" opacity="0.92" />
          <text x="62" y="55" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B0533F">{big}</text>
          <text x="62" y="65" textAnchor="middle" fontSize="7" fill="#555">생가슴살</text>
        </g>
      )}
      {p.category === 'spread' && (
        <g transform="translate(66 20)">
          <rect x="6" y="0" width="56" height="16" rx="3" fill="#3B3B3B" />
          <path d="M2 16 L66 16 L68 100 Q34 108 0 100 Z" fill={c} />
          <rect x="10" y="40" width="48" height="34" rx="3" fill="#fff" opacity="0.92" />
          <text x="34" y="55" textAnchor="middle" fontSize="9" fontWeight="800" fill={c}>PEANUT</text>
          <text x="34" y="66" textAnchor="middle" fontSize="7" fill="#555">99.5%</text>
        </g>
      )}
      {p.category === 'grain' && (
        <g transform="translate(46 36)">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * 6} ${i * 16})`}>
              <rect x="0" y="0" width="96" height="22" rx="3" fill={c} opacity={1 - i * 0.18} />
              {[14, 34, 54, 74].map((x) => <circle key={x} cx={x} cy="11" r="2" fill="#fff" opacity="0.6" />)}
            </g>
          ))}
          <text x="54" y="88" textAnchor="middle" fontSize="8" fontWeight="800" fill="#6B5330">WHOLE GRAIN</text>
        </g>
      )}
      {p.category === 'salad' && (
        <g transform="translate(46 30)">
          <circle cx="34" cy="38" r="20" fill="#7DBB5E" />
          <circle cx="60" cy="30" r="22" fill={c} />
          <circle cx="84" cy="40" r="18" fill="#A9CF6B" />
          <circle cx="48" cy="44" r="8" fill="#D9534F" />
          <path d="M0 48 L108 48 Q100 92 54 92 Q8 92 0 48 Z" fill="#fff" stroke="#D9DEDB" strokeWidth="2" />
          <text x="54" y="72" textAnchor="middle" fontSize="8" fontWeight="800" fill={c}>무농약 채소</text>
        </g>
      )}
    </svg>
  )
}

function ProductImage({ p }: { p: Product }) {
  const [broken, setBroken] = useState(false)
  if (!p.image || broken) return <ProductArt p={p} />
  return (
    <div className="grid h-full w-full place-items-center bg-white">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-full w-full object-contain p-2"
      />
    </div>
  )
}

function Filters({
  sugarMax, setSugarMax, protMin, setProtMin, sweet, setSweet, onReset,
}: {
  sugarMax: number; setSugarMax: (n: number) => void; protMin: number; setProtMin: (n: number) => void
  sweet: Sweet; setSweet: (s: Sweet) => void; onReset: () => void
}) {
  return (
    <div className="space-y-7">
      <div>
        <span className="mb-3 block text-[13px] font-bold text-ink">감미료</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="감미료 조건">
          {SWEETS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSweet(o.key)}
              aria-pressed={sweet === o.key}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${sweet === o.key ? 'border-brand bg-brand text-white' : 'border-line text-sub hover:text-ink'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-ink">1회 당류</span>
          <span className="text-[13px] font-bold text-brand">{sugarMax >= 5 ? '전체' : sugarMax === 0 ? '0g만' : `${fmt(sugarMax)}g 이하`}</span>
        </div>
        <Slider id="sugar-max" min={0} max={5} step={0.5} value={[sugarMax]} onValueChange={(v) => setSugarMax(v[0])} />
        <div className="mt-2 flex justify-between text-[11px] text-sub"><span>0g</span><span>5g</span></div>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-ink">1회 단백질</span>
          <span className="text-[13px] font-bold text-brand">{protMin === 0 ? '전체' : `${protMin}g 이상`}</span>
        </div>
        <Slider id="prot-min" min={0} max={30} step={2} value={[protMin]} onValueChange={(v) => setProtMin(v[0])} />
        <div className="mt-2 flex justify-between text-[11px] text-sub"><span>0g</span><span>30g</span></div>
      </div>
      <button onClick={onReset} className="flex items-center gap-1.5 text-[13px] text-sub hover:text-ink">
        <RotateCcw className="h-3.5 w-3.5" /> 조건 초기화
      </button>
      <div className="rounded-md bg-mint p-3 text-[12px] leading-relaxed text-brand-dark">
        수크랄로스와 아세설팜칼륨은 인공감미료로, 알룰로스와 스테비아, 나한과, 말티톨은 대체당으로 따로 표시했어요.
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<'all' | Cat>('all')
  const [sugarMax, setSugarMax] = useState(5)
  const [protMin, setProtMin] = useState(0)
  const [sweet, setSweet] = useState<Sweet>('all')
  const [sort, setSort] = useState<SortKey>('value')

  const reset = () => { setQuery(''); setCat('all'); setSugarMax(5); setProtMin(0); setSweet('all'); setSort('value') }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = ROWS.filter((p) =>
      (cat === 'all' || p.category === cat) && (p.sugar ?? 0) <= sugarMax && (p.protein ?? 0) >= protMin && sweetOk(p, sweet) &&
      (!q || (p.name + p.brand + CAT_LABEL[p.category] + (p.sweeteners ?? []).join('') + (p.plant ? '식물성 두유' : '')).toLowerCase().includes(q)))
    const by: Record<SortKey, (a: Row, b: Row) => number> = {
      value: (a, b) =>
        a.ppg != null && b.ppg != null ? a.ppg - b.ppg
          : a.ppg != null ? -1 : b.ppg != null ? 1
          : (a.per100 ?? 1e9) - (b.per100 ?? 1e9),
      protein: (a, b) => (b.protein ?? -1) - (a.protein ?? -1),
      sugar: (a, b) => (a.sugar ?? 99) - (b.sugar ?? 99),
      ratio: (a, b) => (b.ratio ?? -1) - (a.ratio ?? -1),
      price: (a, b) => a.price - b.price,
    }
    return out.sort(by[sort])
  }, [query, cat, sugarMax, protMin, sweet, sort])

  const best = useMemo(() => ROWS.filter((p) => p.ppg != null).sort((a, b) => (a.ppg ?? 0) - (b.ppg ?? 0)).slice(0, 3), [])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ROWS.length }
    ROWS.forEach((p) => { c[p.category] = (c[p.category] ?? 0) + 1 })
    return c
  }, [])
  const tableRows = useMemo(() => [...ROWS].sort((a, b) => {
    if (a.proteinFood !== b.proteinFood) return a.proteinFood ? -1 : 1
    return a.ppg != null && b.ppg != null ? a.ppg - b.ppg : (a.per100 ?? 1e9) - (b.per100 ?? 1e9)
  }), [])

  return (
    <div className="min-h-screen bg-white font-sans text-ink">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-1.5 text-[12px]">
          <span className="truncate opacity-80">이 사이트는 제휴 링크를 포함하고 있어요</span>
          <span className="hidden shrink-0 opacity-80 sm:inline">쿠팡과 주요 쇼핑몰 판매가 기준 {PRICE_DATE}</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 md:gap-8">
          <a href="#" onClick={(e) => { e.preventDefault(); reset() }} className="flex shrink-0 items-center gap-2" aria-label="그램당 홈">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-[17px] font-black italic text-white">g</span>
            <span className="text-[21px] font-black tracking-tight">그램당</span>
          </a>
          <label className="relative min-w-0 flex-1 md:max-w-[520px]">
            <span className="sr-only">상품 검색</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" />
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="두부, 그릭요거트, 닭가슴살, 브랜드 검색"
              className="h-11 w-full rounded-full border-2 border-brand bg-white pl-10 pr-4 text-[15px] outline-none placeholder:text-sub/70 focus:ring-4 focus:ring-brand/15"
            />
          </label>
          <nav className="hidden items-center gap-5 text-[14px] font-medium lg:flex">
            <a href="#compare" className="hover:text-brand">비교표</a>
            <a href="#guide" className="hover:text-brand">고르는 법</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-line bg-mint">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-8 md:grid-cols-[1.2fr_1fr] md:items-center md:py-10">
            <div>
              <p className="mb-2 text-[13px] font-bold text-brand">설탕 없는 건강식 가격비교</p>
              <h1 className="text-[28px] font-black leading-[1.25] tracking-tight [text-wrap:balance] md:text-[38px]">
                같은 단백질 20g,<br />어디서 사야 제일 쌀까요?
              </h1>
              <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-sub">
                설탕을 넣지 않은 단백질 식품과 두부, 그릭요거트, 통곡물, 채소를 골랐어요. 단백질 식품은 <b className="text-ink">단백질 1g당 가격</b>으로, 나머지는 100g당 가격으로 비교해요.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-[0_1px_0_#DCE7E1,0_8px_24px_-12px_rgba(8,97,62,.35)]">
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="font-bold">오늘의 가성비 TOP 3</span>
                <span className="text-sub">단백질 1g당</span>
              </div>
              <ol className="divide-y divide-line">
                {best.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[12px] font-black ${i === 0 ? 'bg-brand text-white' : 'bg-mint text-brand'}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{p.name} <span className="text-[12px] text-sub">{p.bestStore}</span></span>
                    <span className="shrink-0 text-[16px] font-black tabular-nums text-brand">{won(p.ppg ?? 0)}원</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex gap-1 overflow-x-auto border-b border-line pt-4" role="tablist" aria-label="카테고리">
            {(['all', ...CAT_ORDER.filter((c) => counts[c])] as ('all' | Cat)[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={cat === k}
                onClick={() => setCat(k)}
                className={`-mb-px shrink-0 border-b-[3px] px-3 pb-3 text-[15px] font-bold transition-colors ${cat === k ? 'border-brand text-ink' : 'border-transparent text-sub hover:text-ink'}`}
              >
                {k === 'all' ? '전체' : CAT_LABEL[k]} <span className="text-[12px] font-medium text-sub">{counts[k]}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-8 py-6 lg:grid-cols-[220px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h2 className="mb-5 text-[15px] font-black">조건</h2>
                <Filters sugarMax={sugarMax} setSugarMax={setSugarMax} protMin={protMin} setProtMin={setProtMin} sweet={sweet} setSweet={setSweet} onReset={reset} />
              </div>
            </aside>

            <section className="min-w-0" aria-label="상품 목록">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] text-sub">상품 <b className="text-ink">{list.length}</b>개</p>
                <Sheet>
                  <SheetTrigger className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-medium lg:hidden">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> 조건
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl pb-[max(24px,env(safe-area-inset-bottom))]">
                    <SheetHeader className="mb-6 text-left"><SheetTitle>조건</SheetTitle></SheetHeader>
                    <Filters sugarMax={sugarMax} setSugarMax={setSugarMax} protMin={protMin} setProtMin={setProtMin} sweet={sweet} setSweet={setSweet} onReset={reset} />
                  </SheetContent>
                </Sheet>
              </div>
              <div className="mb-5 flex gap-x-4 gap-y-2 overflow-x-auto whitespace-nowrap text-[13px]" role="group" aria-label="정렬">
                {SORTS.map((s) => (
                  <button key={s.key} onClick={() => setSort(s.key)} className={sort === s.key ? 'font-bold text-ink' : 'text-sub hover:text-ink'}>
                    {sort === s.key && <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-brand align-middle" />}
                    {s.label}
                  </button>
                ))}
              </div>

              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center text-sub">
                  <p>조건에 맞는 상품이 없어요. 당류나 단백질 기준을 조금 넓혀 보세요.</p>
                  <button onClick={reset} className="mt-4 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white">조건 초기화</button>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5">
                  {list.map((p, i) => {
                    const v = valueText(p)
                    return (
                      <li key={p.id} className="flex min-w-0 flex-col">
                        <a href={linkFor(p)} target="_blank" rel="noopener sponsored" className="group flex flex-1 flex-col">
                          <div className="relative aspect-[10/7] max-w-full overflow-hidden rounded-lg border border-line">
                            <ProductImage p={p} />
                            {sort === 'value' && i < 3 && p.ppg != null && (
                              <span className="absolute left-0 top-0 rounded-br-lg bg-brand px-2 py-1 text-[12px] font-black text-white">{i + 1}위</span>
                            )}
                            {p.sugar === 0 && (
                              <span className="absolute bottom-2 right-2 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-brand">당류 0g</span>
                            )}
                          </div>
                          <p className="mt-3 text-[12px] text-sub">{p.brand} · {CAT_LABEL[p.category]}</p>
                          <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug group-hover:underline md:text-[15px]">{p.name}</h3>
                          <p className="mt-1 text-[12px] text-sub">{packText(p)}</p>
                          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-[11px] font-medium text-sub">{p.priceSource}</span>
                            <span className="text-[18px] font-black tabular-nums md:text-[20px]">{won(p.price)}원</span>
                            {!p.packLabel && <span className="text-[12px] text-sub">개당 {won(p.unit)}원</span>}
                          </div>
                          {v && (
                            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                              <span className="inline-flex items-baseline gap-1 rounded bg-mint px-2 py-1">
                                <span className="text-[11px] font-medium text-brand-dark">{v.label}</span>
                                <span className="text-[15px] font-black tabular-nums text-brand">{won(v.v)}원</span>
                              </span>
                              {(p.offers ?? []).length > 0 && <span className="text-[11px] text-sub">{p.bestStore} 기준</span>}
                            </div>
                          )}
                          <dl className="mt-3 grid grid-cols-3 border-t border-line pt-2 text-center">
                            <div><dt className="text-[11px] text-sub">단백질</dt><dd className="text-[13px] font-bold tabular-nums">{g(p.protein)}</dd></div>
                            <div className="border-x border-line"><dt className="text-[11px] text-sub">당류</dt><dd className="text-[13px] font-bold tabular-nums">{sugarText(p)}</dd></div>
                            <div><dt className="text-[11px] text-sub">열량</dt><dd className="text-[13px] font-bold tabular-nums">{p.kcal == null ? '—' : `${p.kcal}kcal`}</dd></div>
                          </dl>
                          <p className="mt-1 text-center text-[10px] text-sub">{p.serving} 기준</p>
                          <p className="mt-2 text-[12px] leading-snug">
                            {(p.sweeteners ?? []).length === 0 ? (
                              <span className="font-medium text-brand">감미료 없음</span>
                            ) : (
                              <>
                                <span className="text-sub">감미료 </span>
                                {(p.sweeteners ?? []).map((s, j) => (
                                  <span key={s} className={isArtificial(s) ? 'font-medium text-[#B4533A]' : 'font-medium text-ink'}>{j ? ', ' : ''}{s}</span>
                                ))}
                              </>
                            )}
                          </p>
                          {p.note && <p className="mt-1 text-[11px] leading-snug text-sub">{p.note}</p>}
                          <p className="mt-2 flex items-center gap-1 text-[11px] text-sub">
                            {p.estimated && <Info className="h-3 w-3" />}
                            {p.estimated ? '예시 가격' : `${p.priceSource} ${dot(p.priceDate ?? meta.priceDate)} 기준`}
                          </p>
                        </a>
                        {(p.offers ?? []).length > 0 && (
                          <div className="mt-3 rounded-md bg-[#F6F8F7] px-2.5 py-2">
                            <p className="mb-1 flex items-center justify-between text-[11px] text-sub">
                              <span className="font-bold text-ink">다른 쇼핑몰</span>
                              <span>배송비 포함</span>
                            </p>
                            <ul className="space-y-0.5">
                              {(p.offers ?? []).slice(0, 2).map((o) => (
                                <li key={o.url}>
                                  <a href={o.url} target="_blank" rel="noopener nofollow" className="flex items-baseline justify-between gap-2 py-0.5 text-[12px] hover:underline">
                                    <span className="min-w-0 truncate">{o.store}{o.count && o.count !== p.count ? ` ${o.count}개` : ''}</span>
                                    <span className={`shrink-0 font-bold tabular-nums ${offerUnit(p, o) < p.unit - 0.5 ? 'text-brand' : 'text-ink'}`}>{won(o.price + o.ship)}원</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                            {p.danawaUrl && (
                              <a href={p.danawaUrl} target="_blank" rel="noopener nofollow" className="mt-1 block text-[11px] text-sub underline-offset-2 hover:underline">
                                전체 쇼핑몰 가격 보기
                              </a>
                            )}
                          </div>
                        )}
                        <a href={linkFor(p)} target="_blank" rel="noopener sponsored" className="mt-3 flex items-center justify-center gap-1 rounded-md border border-ink py-2 text-[13px] font-bold transition-colors hover:bg-ink hover:text-white">
                          {p.priceSource}에서 보기 <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <section id="compare" className="scroll-mt-24 border-t border-line py-10">
            <h2 className="text-[22px] font-black">한눈에 비교</h2>
            <p className="mt-1 text-[14px] text-sub">수치는 각 상품의 표시 기준량이에요. 빨간 글씨는 인공감미료예요.</p>
            <div className="mt-5 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[980px] text-[13px]">
                <thead className="bg-[#F6F8F7] text-left text-sub">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">상품</th>
                    <th className="px-3 py-2.5 font-medium">기준</th>
                    <th className="px-3 py-2.5 text-right font-medium">단백질</th>
                    <th className="px-3 py-2.5 text-right font-medium">당류</th>
                    <th className="px-3 py-2.5 text-right font-medium">열량</th>
                    <th className="px-3 py-2.5 font-medium">감미료</th>
                    <th className="px-3 py-2.5 text-right font-medium">쿠팡</th>
                    <th className="px-3 py-2.5 font-medium">가장 싼 곳</th>
                    <th className="px-3 py-2.5 text-right font-medium">비교 가격</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {tableRows.map((p) => {
                    const v = valueText(p)
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2.5"><span className="text-sub">{CAT_LABEL[p.category]}</span> <span className="font-medium">{p.name}</span></td>
                        <td className="px-3 py-2.5 text-sub">{p.serving}</td>
                        <td className="px-3 py-2.5 text-right">{g(p.protein)}</td>
                        <td className="px-3 py-2.5 text-right">{sugarText(p)}</td>
                        <td className="px-3 py-2.5 text-right">{p.kcal == null ? '—' : `${p.kcal}kcal`}</td>
                        <td className="px-3 py-2.5 text-[12px]">
                          {(p.sweeteners ?? []).length ? (p.sweeteners ?? []).map((s, j) => (
                            <span key={s} className={isArtificial(s) ? 'text-[#B4533A]' : ''}>{j ? ', ' : ''}{s}</span>
                          )) : '없음'}
                        </td>
                        <td className="px-3 py-2.5 text-right"><a href={linkFor(p)} target="_blank" rel="noopener sponsored" className="hover:underline">{won(p.price)}원</a></td>
                        <td className="px-3 py-2.5">{p.cheaperElsewhere ? <span className="font-medium text-brand">{p.bestStore}</span> : <span className="text-sub">{p.priceSource}</span>}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-brand">{v ? `${v.label} ${won(v.v)}원` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="guide" className="scroll-mt-24 border-t border-line py-10">
            <h2 className="text-[22px] font-black">고르는 법</h2>
            <Accordion type="single" collapsible defaultValue="rule" className="mt-4 max-w-[760px]">
              <AccordionItem value="rule">
                <AccordionTrigger className="text-left text-[15px] font-bold">어떤 기준으로 상품을 골랐나요?</AccordionTrigger>
                <AccordionContent className="space-y-2 text-[14px] leading-relaxed text-sub">
                  <p>모든 상품은 원재료에 설탕이나 자당, 포도당, 과당, 물엿, 시럽, 맥아추출물 같은 당을 따로 넣지 않은 제품이에요. 원재료는 판매처에 표시된 원재료명을 직접 확인했어요.</p>
                  <p>단백질 음료와 프로틴바처럼 가공한 단백질 식품은 1회 제공량 기준 단백질 10g 이상, 당류 2g 이하인 것만 골랐어요. 두부와 무가당 그릭요거트, 땅콩버터, 통곡물, 채소는 그 자체로 건강한 식품이라 단백질 기준을 두지 않았고, 우유나 콩에서 나온 당은 5g까지 허용했어요.</p>
                  <p>닭가슴살은 원재료에 아질산나트륨이나 질산염 같은 발색제가 들어간 제품과 훈제 제품, 설탕으로 양념한 제품을 뺐어요.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="nitrite">
                <AccordionTrigger className="text-left text-[15px] font-bold">왜 발색제와 훈제 제품을 뺐나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  세계보건기구 산하 국제암연구소(IARC)는 햄이나 소시지처럼 염장, 발색, 훈연한 가공육을 대장암과 관련된 1군 발암물질로 분류했어요. 가공육 속 아질산염과 질산염은 몸속에서 니트로소화합물을 만들 수 있고, 훈연 과정에서는 다환방향족탄화수소가 생길 수 있어요. 그래서 이런 성분이 없는 생 닭가슴살처럼 가공이 적은 제품을 담았어요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sweet">
                <AccordionTrigger className="text-left text-[15px] font-bold">감미료는 어떻게 구분했나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  수크랄로스와 아세설팜칼륨은 인공감미료로 빨간 글씨로 표시해요. 알룰로스, 스테비아, 나한과추출물, 말티톨, 폴리글리시톨은 대체당으로 검은 글씨로 표시해요. 말티톨 같은 당알코올은 한 번에 많이 먹으면 배가 불편할 수 있어요. 감미료를 피하고 싶다면 감미료 조건에서 고를 수 있어요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ppg">
                <AccordionTrigger className="text-left text-[15px] font-bold">비교 가격은 어떻게 계산하나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  단백질 식품은 총 가격을 들어 있는 단백질 총량으로 나눠요. 예를 들어 단백질 20g짜리 음료 24개가 38,990원이면 38,990원을 480g으로 나눠서 1g당 약 81원이 돼요. 두부, 요거트, 땅콩버터, 크래커, 채소는 단백질보다 식품 자체가 중요해서 총 중량 100g당 가격으로 비교해요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ratio">
                <AccordionTrigger className="text-left text-[15px] font-bold">열량 대비 단백질은 뭔가요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  단백질은 1g에 약 4kcal를 내요. 단백질 그램 수에 4를 곱해서 전체 열량으로 나누면 열량 중 몇 퍼센트가 단백질에서 오는지 알 수 있어요. 같은 단백질이라도 이 비율이 높을수록 지방이나 탄수화물이 적다는 뜻이에요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="price">
                <AccordionTrigger className="text-left text-[15px] font-bold">가격은 얼마나 자주 바뀌나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  판매처 가격은 할인 행사에 따라 수시로 바뀌어요. 쿠팡 가격은 매일 아침 갱신하고, 11번가, G마켓, 옥션, 롯데ON 같은 다른 쇼핑몰 가격은 다나와 가격비교에서 같은 구성 상품을 찾아 배송비를 더한 값으로 적었어요. 가성비 순위는 이 중 가장 싼 곳을 기준으로 계산해요. 카드에 적힌 날짜의 가격이라서 구매 직전에 판매처 페이지에서 최종 가격을 꼭 확인해 주세요.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-[#F6F8F7]">
        <div className="mx-auto grid max-w-[1180px] gap-3 px-4 py-8 text-[12px] leading-relaxed text-sub">
          <div className="flex items-center gap-2 text-ink">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[13px] font-black italic text-white">g</span>
            <span className="text-[15px] font-black">그램당</span>
          </div>
          <p className="font-medium text-ink">이 사이트는 쿠팡 파트너스 활동의 일환으로 이에 따른 일정액의 수수료를 제공받습니다.</p>
          <p>영양성분은 제조사 표시 기준이며 맛에 따라 조금씩 다를 수 있어요. 특정 질병의 예방이나 치료를 위한 제품이 아니에요.</p>
          <p>운영자 정보와 문의 이메일은 사이트 공개 전에 입력이 필요해요.</p>
          <p>© {new Date().getFullYear()} 그램당</p>
        </div>
      </footer>
    </div>
  )
}
