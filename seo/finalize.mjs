// bundle.html 에 head 링크를 넣고 배포용 폴더(site/)를 만들어요.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
const links = readFileSync('seo/head-links.html', 'utf8')
let html = readFileSync('bundle.html', 'utf8')
const slot = /<meta name="?x-head-links"? content="?slot"?\s*\/?>/
if (!slot.test(html)) throw new Error('head 링크 자리가 번들에 없어요')
html = html.replace(slot, links)
// 인증 태그는 검사기가 정확히 읽도록 따옴표를 붙인 원래 모양으로 되돌려요
html = html.replace(/<meta name="?(google|naver)-site-verification"? content="?([^"\s>]+)"?\s*\/?>/g,
  (_, s, c) => `<meta name="${s}-site-verification" content="${c}" />`)
// 번들러가 <head> 태그를 생략하고 큰 <style> 을 맨 앞에 두어서
// 검색엔진 인증기가 메타 태그를 head 밖으로 볼 수 있어요. 명시적인 <head> 로 다시 짜요.
{
  const start = html.search(/<html[^>]*>/i)
  const htmlTag = html.match(/<html[^>]*>/i)[0]
  const bodyIdx = html.search(/<body[\s>]/i)
  let head = html.slice(start + htmlTag.length, bodyIdx).replace(/<\/?head[^>]*>/gi, '')
  const pick = (re) => { const out = head.match(re) || []; head = head.replace(re, ''); return out.join('\n') }
  const charset = pick(/<meta charset[^>]*>/gi)
  const viewport = pick(/<meta name="?viewport"?[^>]*>/gi)
  const title = pick(/<title>[\s\S]*?<\/title>/gi)
  const metas = pick(/<meta [^>]*>/gi)
  const links = pick(/<link [^>]*>/gi)
  const ld = pick(/<script type="?application\/ld\+json"?>[\s\S]*?<\/script>/gi)
  html = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n' +
    [charset, viewport, title, metas, links, ld].filter(Boolean).join('\n') +
    '\n' + head.trim() + '\n</head>\n' + html.slice(bodyIdx)
}
mkdirSync('site', { recursive: true })
writeFileSync('site/index.html', html)
copyFileSync('public/robots.txt', 'site/robots.txt')
copyFileSync('public/sitemap.xml', 'site/sitemap.xml')
console.log('site/ ready')
