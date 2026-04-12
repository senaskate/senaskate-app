import type { LessonType, PriceConfig } from '../types'

export function calcLessonFee(minutes: number, type: LessonType, config: PriceConfig): number {
  const ratePerMin = config[type === 'individual' ? 'individual' : type === 'semi' ? 'semi' : 'group']
  return Math.round(minutes * ratePerMin)
}

export function detectLessonType(studentCount: number): LessonType {
  if (studentCount >= 4) return 'group'
  if (studentCount >= 2) return 'semi'
  return 'individual'
}

// 세미 판단: 2-3명이면 물어봐야 함 (각각 개인일 수도)
export function needsSemiConfirm(studentCount: number): boolean {
  return studentCount >= 2 && studentCount <= 3
}
