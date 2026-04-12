import { db } from './index'
import { generateId } from '../rules/utils'
import type { LessonEntry, ChoreoEntry, MonthClose } from '../types'

// ─────────────────────────────────────────────────────────────
// 날짜 헬퍼
// ─────────────────────────────────────────────────────────────
function d(month: 2 | 3, day: number): string {
  return `2026-0${month}-${String(day).padStart(2, '0')}`
}

// ─────────────────────────────────────────────────────────────
// 2월 레슨
// ─────────────────────────────────────────────────────────────
const FEB_LESSONS: Omit<LessonEntry, 'id' | 'createdAt'>[] = [
  // ── 윤선쌤 ──
  { date: d(2,9),  teacherId:'yoonsun', location:'지하', type:'individual', students:[{name:'서윤',  minutes:80, fee:112000}] },
  { date: d(2,18), teacherId:'yoonsun', location:'지하', type:'individual', students:[{name:'서윤',  minutes:45, fee:63000},{name:'리령', minutes:35, fee:49000}] },
  { date: d(2,19), teacherId:'yoonsun', location:'목동', type:'individual', students:[{name:'서윤',  minutes:55, fee:77000}] },
  { date: d(2,23), teacherId:'yoonsun', location:'지하', type:'individual', students:[{name:'민아',  minutes:40, fee:56000},{name:'주희', minutes:40, fee:56000}] },
  { date: d(2,24), teacherId:'yoonsun', location:'목동', type:'individual', students:[{name:'서윤',  minutes:30, fee:42000}] },

  // ── 보람쌤 ──
  { date: d(2,9),  teacherId:'boram', location:'지하', type:'individual', students:[{name:'이레', minutes:45, fee:63000},{name:'하람', minutes:35, fee:49000}] },
  { date: d(2,16), teacherId:'boram', location:'목동', type:'individual', students:[{name:'이레', minutes:80, fee:112000},{name:'해온', minutes:80, fee:112000}] },
  { date: d(2,18), teacherId:'boram', location:'지하', type:'individual', students:[{name:'진',   minutes:80, fee:112000}] },
  { date: d(2,20), teacherId:'boram', location:'목동', type:'individual', students:[{name:'이레', minutes:25, fee:35000},{name:'해온', minutes:25, fee:35000},{name:'윤서', minutes:60, fee:84000}] },
  { date: d(2,23), teacherId:'boram', location:'지하', type:'individual', students:[{name:'해온', minutes:80, fee:112000}] },
  { date: d(2,23), teacherId:'boram', location:'목동', type:'individual', students:[{name:'진',   minutes:60, fee:84000}] },
  { date: d(2,24), teacherId:'boram', location:'목동', type:'individual', students:[{name:'하람', minutes:50, fee:70000},{name:'해온', minutes:30, fee:42000}] },
  { date: d(2,27), teacherId:'boram', location:'목동', type:'individual', students:[{name:'하람', minutes:60, fee:84000},{name:'윤서', minutes:50, fee:70000}] },

  // ── 오쌤 ──
  { date: d(2,6),  teacherId:'oh', location:'지하', type:'individual', students:[{name:'소이', minutes:40, fee:56000},{name:'예주', minutes:40, fee:56000}] },
  { date: d(2,9),  teacherId:'oh', location:'지하', type:'individual', students:[{name:'소이', minutes:40, fee:56000},{name:'예주', minutes:40, fee:56000}] },
  { date: d(2,16), teacherId:'oh', location:'지하', type:'individual', students:[{name:'예주', minutes:40, fee:56000},{name:'소이', minutes:40, fee:56000}] },
  { date: d(2,27), teacherId:'oh', location:'지하', type:'individual', students:[{name:'예주', minutes:80, fee:112000}] },

  // ── 변쌤 ──
  { date: d(2,10), teacherId:'byun', location:'제2', type:'individual', students:[{name:'수안', minutes:40, fee:56000},{name:'서인', minutes:40, fee:56000}] },
  { date: d(2,24), teacherId:'byun', location:'제2', type:'individual', students:[{name:'희선', minutes:40, fee:56000},{name:'루다', minutes:40, fee:56000}] },

  // ── 나희쌤 ──
  { date: d(2,11), teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'세량', minutes:55, fee:77000},{name:'수아', minutes:25, fee:35000},{name:'지아', minutes:60, fee:84000},{name:'민주', minutes:60, fee:84000}] },
  { date: d(2,16), teacherId:'nahee', location:'지하', type:'individual', students:[{name:'민주', minutes:40, fee:56000},{name:'세령', minutes:20, fee:28000},{name:'세량', minutes:35, fee:49000},{name:'도윤', minutes:25, fee:35000}] },
  { date: d(2,18), teacherId:'nahee', location:'지하', type:'individual', students:[{name:'지요', minutes:50, fee:70000},{name:'세령', minutes:30, fee:42000}] },
  { date: d(2,25), teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'세량', minutes:40, fee:56000},{name:'지요', minutes:40, fee:56000}] },

  // ── 전주 ──
  { date: d(2,7), teacherId:'jeonju', location:'지하', type:'individual', travelFee:200000, accommodationFee:40000,
    students:[{name:'강희', minutes:110, fee:154000}] },
  { date: d(2,7), teacherId:'jeonju', location:'지상', type:'individual',
    students:[{name:'민아', minutes:110, fee:154000},{name:'혜림', minutes:110, fee:154000}] },
  { date: d(2,8), teacherId:'jeonju', location:'지상', type:'individual',
    students:[{name:'로이', minutes:110, fee:154000},{name:'혜은', minutes:110, fee:154000}] },

  // ── 지쌤 ──
  { date: d(2,15), teacherId:'ji', location:'목동', type:'individual', students:[{name:'유나', minutes:80, fee:112000}] },

  // ── 최쌤 ──
  { date: d(2,4),  teacherId:'choi', location:'김포', type:'individual', students:[{name:'동한', minutes:50, fee:70000},{name:'유하', minutes:40, fee:56000},{name:'지원', minutes:60, fee:84000}] },
  { date: d(2,5),  teacherId:'choi', location:'태릉', type:'individual', students:[{name:'유성', minutes:80, fee:112000},{name:'유재', minutes:80, fee:112000}] },
  { date: d(2,10), teacherId:'choi', location:'목동', type:'individual', students:[{name:'지원', minutes:55, fee:77000}] },
  { date: d(2,12), teacherId:'choi', location:'김포', type:'individual', students:[{name:'효린', minutes:30, fee:42000},{name:'동한', minutes:50, fee:70000},{name:'서영', minutes:50, fee:70000},{name:'하율', minutes:50, fee:70000}] },
  { date: d(2,17), teacherId:'choi', location:'목동', type:'individual', students:[{name:'지원', minutes:50, fee:70000, offIceFee:50000}] },
  { date: d(2,19), teacherId:'choi', location:'태릉', type:'individual', students:[{name:'유성', minutes:45, fee:63000},{name:'유재', minutes:35, fee:49000},{name:'현겸', minutes:40, fee:56000},{name:'하빈', minutes:40, fee:56000}] },
  { date: d(2,23), teacherId:'choi', location:'과천', type:'individual', students:[
    {name:'지원', minutes:80, fee:112000},
    {name:'규진', minutes:0, fee:70000, unpaid:true},
    {name:'현겸', minutes:0, fee:280000, unpaid:true},
    {name:'아라', minutes:0, fee:70000, unpaid:true},
  ]},
]

// ─────────────────────────────────────────────────────────────
// 3월 레슨
// ─────────────────────────────────────────────────────────────
const MAR_LESSONS: Omit<LessonEntry, 'id' | 'createdAt'>[] = [
  // ── 윤선쌤 ──
  { date: d(3,10), teacherId:'yoonsun', location:'목동', type:'individual', students:[{name:'서윤', minutes:50, fee:70000}] },
  { date: d(3,16), teacherId:'yoonsun', location:'목동', type:'individual', students:[{name:'서윤', minutes:45, fee:63000},{name:'예주', minutes:30, fee:42000},{name:'민소', minutes:30, fee:42000}] },

  // ── 보람쌤 ──
  { date: d(3,6),  teacherId:'boram', location:'목동', type:'individual', students:[{name:'해온', minutes:60, fee:84000},{name:'이레', minutes:50, fee:70000}] },
  { date: d(3,9),  teacherId:'boram', location:'지하', type:'individual', students:[{name:'해온', minutes:40, fee:56000},{name:'이레', minutes:40, fee:56000}] },
  { date: d(3,20), teacherId:'boram', location:'목동', type:'individual', students:[{name:'윤서', minutes:70, fee:98000},{name:'진', minutes:40, fee:56000}] },

  // ── 오쌤 ──
  { date: d(3,3),  teacherId:'oh', location:'목동', type:'individual', students:[{name:'예주', minutes:50, fee:70000},{name:'미아', minutes:30, fee:42000}] },
  { date: d(3,6),  teacherId:'oh', location:'지하', type:'individual', students:[{name:'소이', minutes:30, fee:42000},{name:'미아', minutes:10, fee:14000},{name:'예주', minutes:30, fee:42000}] },
  { date: d(3,13), teacherId:'oh', location:'지하', type:'individual', students:[{name:'예주', minutes:50, fee:70000},{name:'소이', minutes:30, fee:42000}] },
  { date: d(3,17), teacherId:'oh', location:'목동', type:'individual', students:[{name:'소이', minutes:25, fee:35000}] },

  // ── 변쌤 ──
  { date: d(3,3),  teacherId:'byun', location:'제2', type:'individual', students:[{name:'서인', minutes:50, fee:70000}] },
  { date: d(3,17), teacherId:'byun', location:'제2', type:'individual', students:[{name:'서인', minutes:45, fee:63000}] },
  { date: d(3,31), teacherId:'byun', location:'제2', type:'individual', students:[{name:'아인', minutes:25, fee:35000},{name:'희선', minutes:25, fee:35000}] },

  // ── 나희쌤 ──
  { date: d(3,4),  teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'세량', minutes:55, fee:77000},{name:'도윤', minutes:25, fee:35000}] },
  { date: d(3,9),  teacherId:'nahee', location:'지하', type:'individual', students:[{name:'도윤', minutes:40, fee:56000},{name:'세량', minutes:40, fee:56000}] },
  { date: d(3,11), teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'세량', minutes:50, fee:70000},{name:'소윤', minutes:30, fee:42000},{name:'민주', minutes:50, fee:70000},{name:'지요', minutes:30, fee:42000},{name:'세령', minutes:30, fee:42000}] },
  { date: d(3,18), teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'수아', minutes:30, fee:42000},{name:'도윤', minutes:30, fee:42000},{name:'유진', minutes:30, fee:42000}] },
  { date: d(3,23), teacherId:'nahee', location:'지하', type:'individual', students:[{name:'세량', minutes:40, fee:56000},{name:'소윤', minutes:40, fee:56000}] },
  { date: d(3,25), teacherId:'nahee', location:'롯데', type:'individual', students:[{name:'금별', minutes:45, fee:63000},{name:'세량', minutes:35, fee:49000},{name:'지아', minutes:40, fee:56000},{name:'유진', minutes:40, fee:56000},{name:'민주', minutes:30, fee:42000}] },
  { date: d(3,30), teacherId:'nahee', location:'지하', type:'individual', students:[{name:'세량', minutes:45, fee:63000},{name:'금별', minutes:35, fee:49000}] },

  // ── 지쌤 ──
  { date: d(3,6),  teacherId:'ji', location:'지하', type:'individual', students:[{name:'유나', minutes:40, fee:56000},{name:'유이', minutes:40, fee:56000}] },

  // ── 은선쌤 ──
  { date: d(3,3),  teacherId:'eunsun', location:'목동', type:'individual', students:[{name:'지현', minutes:60, fee:84000}] },
  { date: d(3,10), teacherId:'eunsun', location:'목동', type:'individual', students:[{name:'지현', minutes:60, fee:84000}] },

  // ── 최쌤 ──
  { date: d(3,2),  teacherId:'choi', location:'오프', type:'individual', students:[{name:'지원', minutes:0, fee:100000, offIceFee:100000}] },
  { date: d(3,3),  teacherId:'choi', location:'목동', type:'individual', students:[{name:'지원', minutes:50, fee:70000}] },
  { date: d(3,4),  teacherId:'choi', location:'김포', type:'individual', students:[{name:'유하', minutes:50, fee:70000}] },
  { date: d(3,16), teacherId:'choi', location:'목동', type:'individual', students:[{name:'가은', minutes:50, fee:70000}] },
  { date: d(3,18), teacherId:'choi', location:'김포', type:'individual', students:[{name:'아라', minutes:25, fee:35000},{name:'지수', minutes:25, fee:35000},{name:'유하', minutes:50, fee:70000},{name:'가은', minutes:50, fee:70000}] },
  { date: d(3,19), teacherId:'choi', location:'태릉', type:'individual', students:[{name:'유재', minutes:80, fee:112000},{name:'유성', minutes:80, fee:112000}] },
  { date: d(3,23), teacherId:'choi', location:'목동', type:'individual', students:[{name:'은담', minutes:80, fee:112000}] },
  { date: d(3,24), teacherId:'choi', location:'목동', type:'individual', students:[{name:'유하', minutes:50, fee:70000}] },
  { date: d(3,25), teacherId:'choi', location:'김포', type:'individual', students:[{name:'은담', minutes:50, fee:70000},{name:'가은', minutes:50, fee:70000},{name:'루다', minutes:50, fee:70000}] },
  { date: d(3,29), teacherId:'choi', location:'목동', type:'individual', students:[{name:'지원', minutes:80, fee:112000}] },
  // 전체레슨 (최쌤 그룹)
  { date: d(3,5),  teacherId:'choi', location:'태릉', type:'semi', note:'전체레슨',
    students:[{name:'채연', minutes:40, fee:56000},{name:'유재', minutes:80, fee:112000+144000}] },
  { date: d(3,24), teacherId:'choi', location:'태릉', type:'semi', note:'전체레슨',
    students:[{name:'유재', minutes:70, fee:126000},{name:'유성', minutes:70, fee:0}] },
  { date: d(3,26), teacherId:'choi', location:'태릉', type:'semi', note:'전체레슨',
    students:[{name:'유재', minutes:70, fee:126000},{name:'유성', minutes:70, fee:0}] },
]

// ─────────────────────────────────────────────────────────────
// 안무 (1월 청구완료, 2월 청구완료, 3월 미청구)
// ─────────────────────────────────────────────────────────────
const CHOREOS: Omit<ChoreoEntry, 'id' | 'createdAt'>[] = [
  // 1월 청구완료
  { studentName:'민주',    teacherId:'nahee',  level:'advanced_novice_sp',  totalFee:1100000, billedMonth:'2026-01', startMonth:'2026-01',
    sessions:[{sessionNum:'end', date:'2026-01-31'}] },
  { studentName:'하람',    teacherId:'boram',  level:'revision',            totalFee:300000,  billedMonth:'2026-01', startMonth:'2026-01',
    sessions:[{sessionNum:'end', date:'2026-01-31'}] },

  // 2월 청구완료
  { studentName:'윤서',    teacherId:'boram',  level:'basic_novice_fs',     totalFee:1000000, billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },
  { studentName:'유나',    teacherId:'ji',     level:'revision',            totalFee:300000,  billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },
  { studentName:'진',      teacherId:'boram',  level:'basic_novice_fs',     totalFee:1000000, billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },
  { studentName:'유하',    teacherId:'choi',   level:'junior_fs',           totalFee:1700000, billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },
  { studentName:'가은',    teacherId:'choi',   level:'junior_fs',           totalFee:1700000, billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },
  { studentName:'다온',    teacherId:'yoonsun',level:'revision',            totalFee:300000,  billedMonth:'2026-02', startMonth:'2026-02',
    sessions:[{sessionNum:'end', date:'2026-02-28'}] },

  // 3월 미청구
  { studentName:'유진',    teacherId:'nahee',  level:'junior_fs',           totalFee:1700000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'Madeline',teacherId:'boram',  level:'basic_novice_fs',     totalFee:1000000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'서윤',    teacherId:'yoonsun',level:'revision',            totalFee:300000,  billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:1, date:'2026-03-01'},{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'지원',    teacherId:'choi',   level:'senior_fs',           totalFee:1900000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'지원',    teacherId:'choi',   level:'revision',            totalFee:300000,  billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'은담',    teacherId:'choi',   level:'advanced_novice_fs',  totalFee:1300000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'서윤',    teacherId:'yoonsun',level:'junior_fs',           totalFee:1700000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'유이',    teacherId:'ji',     level:'junior_fs',           totalFee:1700000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'지요',    teacherId:'nahee',  level:'revision',            totalFee:300000,  billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'예주',    teacherId:'oh',     level:'basic_novice_fs',     totalFee:1000000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
  { studentName:'민소',    teacherId:'yoonsun',level:'basic_novice_fs',     totalFee:1000000, billedMonth:null, startMonth:'2026-03',
    sessions:[{sessionNum:'end', date:'2026-03-31'}] },
]

// ─────────────────────────────────────────────────────────────
// 월 마감
// ─────────────────────────────────────────────────────────────
const CLOSES: Omit<MonthClose, 'id'>[] = [
  { month:'2026-01', closedAt: new Date('2026-01-31').getTime(), lessonTotal:1900500, choreoTotal:1400000, grandTotal:3300500 },
  { month:'2026-02', closedAt: new Date('2026-02-28').getTime(), lessonTotal:6584000, choreoTotal:6000000, grandTotal:12584000 },
]

// ─────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────
export async function seedHistoricalData() {
  const existingCount = await db.lessons.count()
  if (existingCount > 0) return  // 이미 데이터 있으면 스킵

  const now = Date.now()

  const lessons: LessonEntry[] = [
    ...FEB_LESSONS.map(l => ({ ...l, id: generateId(), createdAt: now } as LessonEntry)),
    ...MAR_LESSONS.map(l => ({ ...l, id: generateId(), createdAt: now } as LessonEntry)),
  ]
  const choreos: ChoreoEntry[] = CHOREOS.map(c => ({ ...c, id: generateId(), createdAt: now }))
  const closes: MonthClose[] = CLOSES.map(c => ({ ...c, id: generateId() }))

  await db.lessons.bulkAdd(lessons)
  await db.choreos.bulkAdd(choreos)
  await db.monthClose.bulkAdd(closes)
}
