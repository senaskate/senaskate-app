import type { ChoreoEntry } from '../types'

// 안무가 해당 월에 청구 가능한지 (billedMonth가 없고 "끝" 처리된 것)
export function isBillableInMonth(choreo: ChoreoEntry, month: string): boolean {
  if (choreo.billedMonth) return false // 이미 청구됨
  const ended = choreo.sessions.some(s => s.sessionNum === 'end')
  if (!ended) return false
  // "끝" 처리된 날짜가 해당 월이거나 이전
  const endSession = choreo.sessions.find(s => s.sessionNum === 'end')
  if (!endSession) return false
  const endMonth = endSession.date.substring(0, 7) // YYYY-MM
  return endMonth <= month
}

// 해당 월에 청구할 안무 목록
export function getBillableChoreos(choreos: ChoreoEntry[], month: string): ChoreoEntry[] {
  return choreos.filter(c => isBillableInMonth(c, month))
}

// 아직 청구 안 된 진행중 안무 (이월 대상)
export function getCarryOverChoreos(choreos: ChoreoEntry[]): ChoreoEntry[] {
  return choreos.filter(c => !c.billedMonth && !c.sessions.some(s => s.sessionNum === 'end'))
}
