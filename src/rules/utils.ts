export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatKRWShort(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000
    return man % 1 === 0 ? `${man}만` : `${man.toFixed(1)}만`
  }
  return amount.toLocaleString('ko-KR')
}

export function toYYYYMM(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function toYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseYYYYMM(s: string): { year: number; month: number } {
  const [year, month] = s.split('-').map(Number)
  return { year, month }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
export const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// UTC 버그 없는 로컬 날짜 문자열
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 2026 한국 공휴일
export const KR_HOLIDAYS: Record<string, string> = {
  '2026-01-01': '신정',
  '2026-02-16': '설날연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날연휴',
  '2026-03-01': '삼일절',
  '2026-05-01': '근로자의날',
  '2026-05-05': '어린이날',
  '2026-05-25': '부처님오신날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-09-21': '추석연휴',
  '2026-09-22': '추석',
  '2026-09-23': '추석연휴',
  '2026-10-03': '개천절',
  '2026-10-09': '한글날',
  '2026-12-25': '크리스마스',
}
