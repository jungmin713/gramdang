# 그램당

저당 고단백 식품을 단백질 1g당 가격으로 비교하는 사이트예요. https://gramdang.netlify.app

## 구조
- `src/data/products.json` 상품 목록과 영양성분, 쿠팡 파트너스 링크
- `src/data/meta.json` 가격 기준일
- `scripts/build.sh` 사이트를 `site/` 폴더로 빌드
- `site/` Netlify가 그대로 배포하는 완성본
- `.github/workflows/daily-update.yml` 매일 오전 7시 쿠팡 가격 갱신

## 매일 자동 갱신 켜기
쿠팡 파트너스 API 승인이 나면 저장소 Settings > Secrets and variables > Actions 에
`COUPANG_ACCESS_KEY`, `COUPANG_SECRET_KEY` 두 값을 넣으면 돼요. 키가 없을 때는 아무것도 바꾸지 않아요.

## 상품 추가
`products.json` 에 항목을 넣고 `bash scripts/build.sh` 를 실행한 다음 커밋하면 Netlify가 자동으로 배포해요.
