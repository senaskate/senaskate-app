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
