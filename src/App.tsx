import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, ExternalLink, RotateCcw, Info } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import raw from './data/products.json'
import meta from './data/meta.json'

type Cat = 'drink' | 'bar' | 'chicken'
type Product = {
  id: string; name: string; brand: string; category: Cat; serving: string; count: number
  protein: number; sugar: number; sugarLabel?: string; kcal: number; price: number
  priceSource: string; estimated: boolean; color: string; url?: string; coupangTitle?: string
}
type Row = Product & { unit: number; ppg: number; ratio: number }
type SortKey = 'ppg' | 'protein' | 'sugar' | 'ratio' | 'unit'

const CAT_LABEL: Record<Cat, string> = { drink: '단백질 음료', bar: '프로틴바', chicken: '닭가슴살' }
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'ppg', label: '가성비순' },
  { key: 'protein', label: '단백질 많은순' },
  { key: 'sugar', label: '당류 적은순' },
  { key: 'ratio', label: '열량 대비 단백질순' },
  { key: 'unit', label: '개당 가격순' },
]

const ROWS: Row[] = (raw as Product[]).map((p) => ({
  ...p,
  unit: p.price / p.count,
  ppg: p.price / (p.count * p.protein),
  ratio: (p.protein * 4) / p.kcal,
}))

const won = (n: number) => Math.round(n).toLocaleString('ko-KR')
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const sugarText = (p: Product) => p.sugarLabel ?? `${fmt(p.sugar)}g`
const linkFor = (p: Product) => p.url ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(p.name)}`
const PRICE_DATE = meta.priceDate.replace(/-/g, '.')

function ProductArt({ p }: { p: Product }) {
  const c = p.color
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full" role="img" aria-label={`${p.name} 패키지 일러스트`}>
      <rect width="200" height="140" fill="#F4F6F5" />
      <circle cx="160" cy="28" r="46" fill={c} opacity="0.12" />
      {p.category === 'drink' && (
        <g transform="translate(70 18)">
          <path d="M8 22 L30 4 L52 22 Z" fill={c} opacity="0.75" />
          <rect x="8" y="22" width="44" height="88" rx="3" fill={c} />
          <rect x="14" y="44" width="32" height="34" rx="2" fill="#fff" opacity="0.92" />
          <text x="30" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{fmt(p.protein)}g</text>
          <text x="30" y="72" textAnchor="middle" fontSize="7" fill="#555">PROTEIN</text>
          <rect x="40" y="0" width="5" height="16" rx="1" fill="#fff" stroke={c} strokeWidth="1.5" />
        </g>
      )}
      {p.category === 'bar' && (
        <g transform="translate(100 74) rotate(-14)">
          <path d="M-74 -18 L-66 -22 L-66 22 L-74 18 Z" fill={c} opacity="0.7" />
          <rect x="-66" y="-22" width="132" height="44" rx="4" fill={c} />
          <path d="M66 -22 L74 -18 L74 18 L66 22 Z" fill={c} opacity="0.7" />
          <rect x="-40" y="-12" width="80" height="24" rx="2" fill="#fff" opacity="0.92" />
          <text x="0" y="4" textAnchor="middle" fontWeight="800" fill={c}><tspan fontSize="12">{fmt(p.protein)}g</tspan><tspan fontSize="7" dx="3" fill="#555">PROTEIN</tspan></text>
        </g>
      )}
      {p.category === 'chicken' && (
        <g transform="translate(52 20)">
          <path d="M6 8 Q48 -4 90 8 L96 92 Q48 104 0 92 Z" fill={c} />
          <path d="M6 8 Q48 -4 90 8 L91 18 Q48 6 5 18 Z" fill="#fff" opacity="0.35" />
          <ellipse cx="48" cy="56" rx="30" ry="22" fill="#fff" opacity="0.92" />
          <text x="48" y="54" textAnchor="middle" fontSize="11" fontWeight="800" fill={c}>{fmt(p.protein)}g</text>
          <text x="48" y="66" textAnchor="middle" fontSize="7" fill="#555">단백질</text>
        </g>
      )}
    </svg>
  )
}

function Filters({
  sugarMax, setSugarMax, protMin, setProtMin, onReset,
}: { sugarMax: number; setSugarMax: (n: number) => void; protMin: number; setProtMin: (n: number) => void; onReset: () => void }) {
  return (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-ink">1회 당류</span>
          <span className="text-[13px] font-bold text-brand">{sugarMax === 0 ? '0g만' : `${fmt(sugarMax)}g 이하`}</span>
        </div>
        <Slider id="sugar-max" min={0} max={2} step={0.5} value={[sugarMax]} onValueChange={(v) => setSugarMax(v[0])} />
        <div className="mt-2 flex justify-between text-[11px] text-sub"><span>0g</span><span>2g</span></div>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-ink">1회 단백질</span>
          <span className="text-[13px] font-bold text-brand">{protMin}g 이상</span>
        </div>
        <Slider id="prot-min" min={8} max={24} step={2} value={[protMin]} onValueChange={(v) => setProtMin(v[0])} />
        <div className="mt-2 flex justify-between text-[11px] text-sub"><span>8g</span><span>24g</span></div>
      </div>
      <button onClick={onReset} className="flex items-center gap-1.5 text-[13px] text-sub hover:text-ink">
        <RotateCcw className="h-3.5 w-3.5" /> 조건 초기화
      </button>
      <div className="rounded-md bg-mint p-3 text-[12px] leading-relaxed text-brand-dark">
        식품 표시기준에서 저당은 100g당 당류 5g 미만, 음료는 100ml당 2.5g 미만이에요.
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<'all' | Cat>('all')
  const [sugarMax, setSugarMax] = useState(2)
  const [protMin, setProtMin] = useState(8)
  const [sort, setSort] = useState<SortKey>('ppg')

  const reset = () => { setQuery(''); setCat('all'); setSugarMax(2); setProtMin(8); setSort('ppg') }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = ROWS.filter((p) =>
      (cat === 'all' || p.category === cat) && p.sugar <= sugarMax && p.protein >= protMin &&
      (!q || (p.name + p.brand + CAT_LABEL[p.category]).toLowerCase().includes(q)))
    const by: Record<SortKey, (a: Row, b: Row) => number> = {
      ppg: (a, b) => a.ppg - b.ppg,
      protein: (a, b) => b.protein - a.protein,
      sugar: (a, b) => a.sugar - b.sugar || a.ppg - b.ppg,
      ratio: (a, b) => b.ratio - a.ratio,
      unit: (a, b) => a.unit - b.unit,
    }
    return out.sort(by[sort])
  }, [query, cat, sugarMax, protMin, sort])

  const best = useMemo(() => [...ROWS].sort((a, b) => a.ppg - b.ppg).slice(0, 3), [])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ROWS.length }
    ROWS.forEach((p) => { c[p.category] = (c[p.category] ?? 0) + 1 })
    return c
  }, [])

  return (
    <div className="min-h-screen bg-white font-sans text-ink">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-1.5 text-[12px]">
          <span className="truncate opacity-80">이 사이트는 제휴 링크를 포함하고 있어요</span>
          <span className="hidden shrink-0 opacity-80 sm:inline">쿠팡 판매가 기준 {PRICE_DATE}</span>
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
              placeholder="닭가슴살, 프로틴바, 브랜드 검색"
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
              <p className="mb-2 text-[13px] font-bold text-brand">저당 고단백 식품 가격비교</p>
              <h1 className="text-[28px] font-black leading-[1.25] tracking-tight [text-wrap:balance] md:text-[38px]">
                같은 단백질 20g,<br />어디서 사야 제일 쌀까요?
              </h1>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-sub">
                당류 2g 이하 제품만 골라서 포장 가격이 아닌 <b className="text-ink">단백질 1g당 가격</b>으로 줄 세웠어요.
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
                    <span className="min-w-0 flex-1 truncate text-[14px]">{p.name}</span>
                    <span className="shrink-0 text-[16px] font-black tabular-nums text-brand">{won(p.ppg)}원</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex gap-1 overflow-x-auto border-b border-line pt-4" role="tablist" aria-label="카테고리">
            {(['all', 'drink', 'bar', 'chicken'] as const).map((k) => (
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
                <h2 className="mb-5 text-[15px] font-black">영양 조건</h2>
                <Filters sugarMax={sugarMax} setSugarMax={setSugarMax} protMin={protMin} setProtMin={setProtMin} onReset={reset} />
              </div>
            </aside>

            <section className="min-w-0" aria-label="상품 목록">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] text-sub">상품 <b className="text-ink">{list.length}</b>개</p>
                <div className="flex items-center gap-2">
                  <Sheet>
                    <SheetTrigger className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] font-medium lg:hidden">
                      <SlidersHorizontal className="h-3.5 w-3.5" /> 영양 조건
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl pb-[max(24px,env(safe-area-inset-bottom))]">
                      <SheetHeader className="mb-6 text-left"><SheetTitle>영양 조건</SheetTitle></SheetHeader>
                      <Filters sugarMax={sugarMax} setSugarMax={setSugarMax} protMin={protMin} setProtMin={setProtMin} onReset={reset} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <div className="mb-5 flex gap-x-4 gap-y-2 overflow-x-auto whitespace-nowrap text-[13px]" role="group" aria-label="정렬">
                {SORTS.map((s) => (
                  <button key={s.key} onClick={() => setSort(s.key)} className={`relative pl-0 ${sort === s.key ? 'font-bold text-ink' : 'text-sub hover:text-ink'}`}>
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
                  {list.map((p, i) => (
                    <li key={p.id} className="flex min-w-0 flex-col">
                      <a href={linkFor(p)} target="_blank" rel="noopener sponsored" className="group flex flex-1 flex-col">
                        <div className="relative aspect-[10/7] max-w-full overflow-hidden rounded-lg">
                          <ProductArt p={p} />
                          {sort === 'ppg' && i < 3 && (
                            <span className="absolute left-0 top-0 rounded-br-lg bg-brand px-2 py-1 text-[12px] font-black text-white">{i + 1}위</span>
                          )}
                          {p.sugar === 0 && (
                            <span className="absolute bottom-2 right-2 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-brand">당류 0g</span>
                          )}
                        </div>
                        <p className="mt-3 text-[12px] text-sub">{p.brand}</p>
                        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug group-hover:underline md:text-[15px]">{p.name}</h3>
                        <p className="mt-1 text-[12px] text-sub">{p.serving} × {p.count}개</p>
                        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-[18px] font-black tabular-nums md:text-[20px]">{won(p.price)}원</span>
                          <span className="text-[12px] text-sub">개당 {won(p.unit)}원</span>
                        </div>
                        <div className="mt-1.5 inline-flex w-fit items-baseline gap-1 rounded bg-mint px-2 py-1">
                          <span className="text-[11px] font-medium text-brand-dark">단백질 1g당</span>
                          <span className="text-[15px] font-black tabular-nums text-brand">{won(p.ppg)}원</span>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 border-t border-line pt-2 text-center">
                          <div><dt className="text-[11px] text-sub">단백질</dt><dd className="text-[13px] font-bold tabular-nums">{fmt(p.protein)}g</dd></div>
                          <div className="border-x border-line"><dt className="text-[11px] text-sub">당류</dt><dd className="text-[13px] font-bold tabular-nums">{sugarText(p)}</dd></div>
                          <div><dt className="text-[11px] text-sub">열량</dt><dd className="text-[13px] font-bold tabular-nums">{p.kcal}kcal</dd></div>
                        </dl>
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-sub">
                          {p.estimated && <Info className="h-3 w-3" />}
                          {p.estimated ? '예시 가격' : `${p.priceSource} ${PRICE_DATE} 기준`}
                        </p>
                        <span className="mt-3 flex items-center justify-center gap-1 rounded-md border border-ink py-2 text-[13px] font-bold transition-colors group-hover:bg-ink group-hover:text-white">
                          최저가 보러가기 <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section id="compare" className="scroll-mt-24 border-t border-line py-10">
            <h2 className="text-[22px] font-black">한눈에 비교</h2>
            <p className="mt-1 text-[14px] text-sub">모든 수치는 1회 제공량 기준이에요.</p>
            <div className="mt-5 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead className="bg-[#F6F8F7] text-left text-sub">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">상품</th>
                    <th className="px-3 py-2.5 text-right font-medium">단백질</th>
                    <th className="px-3 py-2.5 text-right font-medium">당류</th>
                    <th className="px-3 py-2.5 text-right font-medium">열량</th>
                    <th className="px-3 py-2.5 text-right font-medium">열량 중 단백질</th>
                    <th className="px-3 py-2.5 text-right font-medium">1g당 가격</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {[...ROWS].sort((a, b) => a.ppg - b.ppg).map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5"><span className="text-sub">{CAT_LABEL[p.category]}</span> <span className="font-medium">{p.name}</span></td>
                      <td className="px-3 py-2.5 text-right">{fmt(p.protein)}g</td>
                      <td className="px-3 py-2.5 text-right">{sugarText(p)}</td>
                      <td className="px-3 py-2.5 text-right">{p.kcal}kcal</td>
                      <td className="px-3 py-2.5 text-right">{Math.round(p.ratio * 100)}%</td>
                      <td className="px-3 py-2.5 text-right font-bold text-brand">{won(p.ppg)}원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="guide" className="scroll-mt-24 border-t border-line py-10">
            <h2 className="text-[22px] font-black">고르는 법</h2>
            <Accordion type="single" collapsible className="mt-4 max-w-[760px]">
              <AccordionItem value="ppg">
                <AccordionTrigger className="text-left text-[15px] font-bold">단백질 1g당 가격은 어떻게 계산하나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  총 가격을 들어 있는 단백질 총량으로 나눠요. 예를 들어 단백질 20g짜리 음료 24개가 38,990원이면 38,990원을 480g으로 나눠서 1g당 약 81원이 돼요. 포장 단위가 달라도 같은 기준으로 비교할 수 있어요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="lowsugar">
                <AccordionTrigger className="text-left text-[15px] font-bold">저당 제품은 기준이 있나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  식품 표시기준에서 저당이라고 표시하려면 100g당 당류가 5g 미만이어야 하고 음료는 100ml당 2.5g 미만이어야 해요. 이 사이트는 그보다 엄격하게 1회 제공량 기준 당류 2g 이하 제품만 담고 있어요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ratio">
                <AccordionTrigger className="text-left text-[15px] font-bold">열량 중 단백질 비율은 뭔가요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  단백질은 1g에 약 4kcal를 내요. 단백질 그램 수에 4를 곱해서 전체 열량으로 나누면 열량 중 몇 퍼센트가 단백질에서 오는지 알 수 있어요. 같은 단백질이라도 이 비율이 높을수록 지방이나 탄수화물이 적다는 뜻이에요.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="price">
                <AccordionTrigger className="text-left text-[15px] font-bold">가격은 얼마나 자주 바뀌나요?</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-sub">
                  판매처 가격은 할인 행사에 따라 수시로 바뀌어요. 사이트에 표시된 가격은 위쪽에 적힌 날짜의 쿠팡 판매가라서 구매 직전에 판매처 페이지에서 최종 가격을 꼭 확인해 주세요.
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
