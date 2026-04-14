// ─── 선생님 ───────────────────────────────────────────────
export type TeacherId = string

export interface Teacher {
  id: TeacherId
  name: string          // 윤선쌤, 보람쌤 …
  color: string         // hex
  students: string[]    // 담당 학생 이름 목록
}

// ─── 레슨 유형 ────────────────────────────────────────────
export type LessonType = 'individual' | 'semi' | 'group'

export interface LessonEntry {
  id: string
  date: string          // YYYY-MM-DD
  startTime?: string    // HH:mm (선택)
  teacherId: TeacherId
  location: string
  students: StudentLesson[]
  type: LessonType
  note?: string
  endTime?: string      // 명시적 종료 시간 (칩 표시용)
  // 전주 전용
  travelFee?: number    // 출장비
  accommodationFee?: number  // 숙소비
  createdAt: number
}

export interface StudentLesson {
  name: string
  minutes: number
  fee: number           // 계산된 금액
  unpaid?: boolean
  offIceFee?: number    // 오프아이스 추가금액
}

// ─── 안무 ─────────────────────────────────────────────────
export type ChoreoLevel =
  | 'basic_novice_fs'
  | 'advanced_novice_sp'
  | 'advanced_novice_fs'
  | 'junior_senior_sp'
  | 'junior_fs'
  | 'senior_fs'
  | 'revision'          // 수정 30만
  | 'revision_40'       // 수정 40만 (별도 명시 시)

export interface ChoreoEntry {
  id: string
  studentName: string
  teacherId: TeacherId
  level: ChoreoLevel
  sessions: ChoreoSession[]   // 회차 이력
  totalFee: number
  billedMonth: string | null  // YYYY-MM, null = 미청구
  startMonth: string          // YYYY-MM
  createdAt: number
}

export interface ChoreoSession {
  sessionNum: number | 'end'
  date: string               // YYYY-MM-DD
  note?: string
}

// ─── 개인 일정 ────────────────────────────────────────────
export interface PersonalEvent {
  id: string
  date: string          // YYYY-MM-DD
  startTime: string     // HH:mm
  endTime: string       // HH:mm
  title: string
  color: string         // hex
  note?: string
  allDay?: boolean
  createdAt: number
}

// ─── 월 마감 ──────────────────────────────────────────────
export interface MonthClose {
  id: string
  month: string         // YYYY-MM
  closedAt: number
  lessonTotal: number
  choreoTotal: number
  grandTotal: number
}

// ─── 단가 설정 ────────────────────────────────────────────
export interface PriceConfig {
  individual: number    // 원/분  기본 1400
  semi: number          // 원/분  기본 1800
  group: number         // 원/분  기본 2500
  choreo: Record<ChoreoLevel, number>
}

// ─── 장소 목록 ────────────────────────────────────────────
export const LOCATIONS = ['김포', '롯데', '목동', '지하', '지상', '제2', '태릉', '과천', '세종', '공주', '안양', '현진집', '기타'] as const
export type Location = typeof LOCATIONS[number]

// ─── 안무 레벨 표시명 ─────────────────────────────────────
export const CHOREO_LABELS: Record<ChoreoLevel, string> = {
  basic_novice_fs: 'Basic novice FS',
  advanced_novice_sp: 'Advanced novice SP',
  advanced_novice_fs: 'Advanced novice FS',
  junior_senior_sp: 'Junior / Senior SP',
  junior_fs: 'Junior FS',
  senior_fs: 'Senior FS',
  revision: '수정 (30만)',
  revision_40: '수정 (40만)',
}

export const DEFAULT_PRICES: PriceConfig = {
  individual: 1400,
  semi: 1800,
  group: 2500,
  choreo: {
    basic_novice_fs: 1000000,
    advanced_novice_sp: 1100000,
    advanced_novice_fs: 1300000,
    junior_senior_sp: 1500000,
    junior_fs: 1700000,
    senior_fs: 1900000,
    revision: 300000,
    revision_40: 400000,
  },
}
