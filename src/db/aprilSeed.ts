import { db } from './index'
import { generateId } from '../rules/utils'
import type { LessonEntry, PersonalEvent } from '../types'

const APRIL_SEED_VERSION = '3'
const SEED_VERSION_KEY = 'senaskate_april_seed_v'

function d(day: number) {
  return `2026-04-${String(day).padStart(2, '0')}`
}

// ── 4월 레슨 ──────────────────────────────────────────────────
const APR_LESSONS: Omit<LessonEntry, 'id' | 'createdAt'>[] = [
  // ─ Wed Apr 1 ─
  { date:d(1), teacherId:'choi',  location:'김포', startTime:'12:00', endTime:'15:00', type:'individual',
    students:[{name:'동한',minutes:60,fee:84000},{name:'하율',minutes:90,fee:126000},{name:'지수',minutes:60,fee:84000}] },
  { date:d(1), teacherId:'nahee', location:'롯데', startTime:'21:00', endTime:'00:30', type:'individual',
    students:[{name:'세량',minutes:90,fee:126000},{name:'소윤',minutes:90,fee:126000},{name:'도윤',minutes:60,fee:84000}] },

  // ─ Thu Apr 2 ─
  { date:d(2), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(2), teacherId:'shin', location:'태릉', startTime:'13:00', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(2), teacherId:'shin', location:'태릉', startTime:'14:30', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(2), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'지우',minutes:120,fee:168000}] },
  { date:d(2), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },

  // ─ Fri Apr 3 (전주 출장) ─
  { date:d(3), teacherId:'jeonju', location:'세종', startTime:'13:30', type:'individual',
    students:[{name:'강희',minutes:90,fee:126000}] },
  { date:d(3), teacherId:'jeonju', location:'공주', startTime:'16:00', type:'individual',
    students:[{name:'혜림',minutes:150,fee:210000}] },
  { date:d(3), teacherId:'jeonju', location:'전주', startTime:'20:00', type:'individual',
    students:[{name:'혜은',minutes:150,fee:210000}] },

  // ─ Sat Apr 4 (전주 출장) ─
  { date:d(4), teacherId:'jeonju', location:'공주', startTime:'13:00', type:'individual',
    students:[{name:'민아',minutes:120,fee:168000}] },
  { date:d(4), teacherId:'jeonju', location:'전주', startTime:'18:00', type:'individual',
    students:[{name:'로이',minutes:120,fee:168000}] },

  // ─ Mon Apr 6 ─
  { date:d(6), teacherId:'choi', location:'과천', startTime:'11:00', type:'individual', students:[{name:'지원',minutes:90,fee:126000}] },
  { date:d(6), teacherId:'choi', location:'과천', startTime:'12:30', type:'individual', students:[{name:'은담',minutes:60,fee:84000}] },

  // ─ Tue Apr 7 ─
  { date:d(7), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(7), teacherId:'shin', location:'태릉', startTime:'13:00', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(7), teacherId:'shin', location:'목동', startTime:'14:30', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(7), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'지우',minutes:120,fee:168000}] },
  { date:d(7), teacherId:'shin', location:'목동', startTime:'23:00', type:'individual', students:[{name:'한나',minutes:90,fee:126000}] },

  // ─ Wed Apr 8 ─
  { date:d(8), teacherId:'choi', location:'김포', startTime:'11:00', endTime:'15:00', type:'individual',
    students:[{name:'동한',minutes:60,fee:84000},{name:'하율',minutes:90,fee:126000},{name:'지수',minutes:60,fee:84000},{name:'유하',minutes:50,fee:70000}] },
  { date:d(8), teacherId:'ji', location:'현진집', startTime:'14:00', type:'individual',
    students:[{name:'현지',minutes:60,fee:84000}] },
  { date:d(8), teacherId:'nahee', location:'롯데', startTime:'21:00', endTime:'00:30', type:'individual',
    students:[{name:'세량',minutes:90,fee:126000},{name:'소윤',minutes:90,fee:126000}] },

  // ─ Thu Apr 9 ─
  { date:d(9), teacherId:'shin', location:'태릉', startTime:'10:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(9), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(9), teacherId:'shin', location:'태릉', startTime:'14:30', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(9), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'지우',minutes:120,fee:168000}] },
  { date:d(9), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },

  // ─ Sun Apr 12 ─
  { date:d(12), teacherId:'boram', location:'목동', startTime:'20:00', type:'individual', students:[{name:'해온',minutes:90,fee:126000}] },
  { date:d(12), teacherId:'boram', location:'목동', startTime:'21:30', type:'individual', students:[{name:'이레',minutes:90,fee:126000}] },
  { date:d(12), teacherId:'boram', location:'목동', startTime:'23:00', type:'individual', students:[{name:'윤서',minutes:90,fee:126000}] },

  // ─ Mon Apr 13 ─
  { date:d(13), teacherId:'choi', location:'김포', startTime:'11:00', type:'individual', students:[{name:'동한',minutes:90,fee:126000}] },
  { date:d(13), teacherId:'choi', location:'김포', startTime:'12:30', type:'individual', students:[{name:'하율',minutes:90,fee:126000}] },
  { date:d(13), teacherId:'choi', location:'김포', startTime:'14:00', type:'individual', students:[{name:'지수',minutes:60,fee:84000}] },

  // ─ Tue Apr 14 ─
  { date:d(14), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'지우',minutes:120,fee:168000}] },
  { date:d(14), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },

  // ─ Wed Apr 15 ─
  { date:d(15), teacherId:'choi', location:'김포', startTime:'11:00', endTime:'15:00', type:'individual',
    students:[{name:'동한',minutes:60,fee:84000},{name:'하율',minutes:90,fee:126000},{name:'지수',minutes:60,fee:84000}] },

  // ─ Thu Apr 16 ─
  { date:d(16), teacherId:'shin', location:'태릉', startTime:'10:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(16), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(16), teacherId:'shin', location:'태릉', startTime:'13:00', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(16), teacherId:'shin', location:'태릉', startTime:'14:30', type:'individual', students:[{name:'지우',minutes:90,fee:126000}] },
  { date:d(16), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },

  // ─ Fri Apr 17 (전주 출장) ─
  { date:d(17), teacherId:'jeonju', location:'세종', startTime:'13:30', type:'individual',
    students:[{name:'강희',minutes:90,fee:126000}] },
  { date:d(17), teacherId:'jeonju', location:'공주', startTime:'16:00', type:'individual',
    students:[{name:'혜림',minutes:150,fee:210000}] },
  { date:d(17), teacherId:'jeonju', location:'전주', startTime:'20:00', type:'individual',
    students:[{name:'혜은',minutes:150,fee:210000}] },

  // ─ Sat Apr 18 (전주 출장) ─
  { date:d(18), teacherId:'jeonju', location:'공주', startTime:'13:00', type:'individual',
    students:[{name:'민아',minutes:120,fee:168000}] },
  { date:d(18), teacherId:'jeonju', location:'전주', startTime:'18:00', type:'individual',
    students:[{name:'로이',minutes:120,fee:168000}] },

  // ─ Sun Apr 19 ─
  { date:d(19), teacherId:'boram', location:'목동', startTime:'21:00', type:'individual', students:[{name:'해온',minutes:90,fee:126000}] },
  { date:d(19), teacherId:'boram', location:'목동', startTime:'22:30', type:'individual', students:[{name:'이레',minutes:90,fee:126000}] },

  // ─ Mon Apr 20 ─
  { date:d(20), teacherId:'nahee', location:'지하', startTime:'12:00', type:'individual', students:[{name:'세량',minutes:90,fee:126000}] },
  { date:d(20), teacherId:'nahee', location:'지하', startTime:'13:00', type:'individual', students:[{name:'소윤',minutes:150,fee:210000}] },
  { date:d(20), teacherId:'shin',  location:'목동', startTime:'21:00', type:'individual', students:[{name:'지우',minutes:120,fee:168000}] },

  // ─ Tue Apr 21 ─
  { date:d(21), teacherId:'boram', location:'목동', startTime:'09:00', type:'individual', students:[{name:'해온',minutes:90,fee:126000}] },
  { date:d(21), teacherId:'boram', location:'목동', startTime:'10:30', type:'individual', students:[{name:'이레',minutes:90,fee:126000}] },
  { date:d(21), teacherId:'boram', location:'목동', startTime:'12:00', type:'individual', students:[{name:'윤서',minutes:120,fee:168000}] },
  { date:d(21), teacherId:'byun',  location:'제2',  startTime:'14:00', type:'individual', students:[{name:'서인',minutes:60,fee:84000}] },
  { date:d(21), teacherId:'shin',  location:'목동', startTime:'21:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },
  { date:d(21), teacherId:'shin',  location:'목동', startTime:'23:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },

  // ─ Wed Apr 22 ─
  { date:d(22), teacherId:'choi', location:'김포', startTime:'11:00', endTime:'15:00', type:'individual',
    students:[{name:'동한',minutes:60,fee:84000},{name:'하율',minutes:90,fee:126000},{name:'지수',minutes:60,fee:84000}] },
  { date:d(22), teacherId:'nahee', location:'롯데', startTime:'21:00', endTime:'00:30', type:'individual',
    students:[{name:'세량',minutes:90,fee:126000},{name:'금별',minutes:90,fee:126000}] },

  // ─ Thu Apr 23 ─
  { date:d(23), teacherId:'shin', location:'태릉', startTime:'10:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(23), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(23), teacherId:'shin', location:'태릉', startTime:'13:00', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(23), teacherId:'shin', location:'태릉', startTime:'14:30', type:'individual', students:[{name:'지우',minutes:90,fee:126000}] },
  { date:d(23), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },
  { date:d(23), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'아진',minutes:120,fee:168000}] },

  // ─ Fri Apr 24 ─
  { date:d(24), teacherId:'boram',   location:'목동', startTime:'10:00', type:'individual', students:[{name:'해온',minutes:120,fee:168000}] },
  { date:d(24), teacherId:'nahee',   location:'지하', startTime:'12:00', type:'individual', students:[{name:'세량',minutes:90,fee:126000}] },
  { date:d(24), teacherId:'yoonsun', location:'지하', startTime:'15:00', type:'individual', students:[{name:'서윤',minutes:90,fee:126000}] },
  { date:d(24), teacherId:'yoonsun', location:'지하', startTime:'16:00', type:'individual', students:[{name:'민아',minutes:120,fee:168000}] },

  // ─ Sun Apr 26 ─
  { date:d(26), teacherId:'boram', location:'목동', startTime:'20:00', type:'individual', students:[{name:'해온',minutes:90,fee:126000}] },
  { date:d(26), teacherId:'boram', location:'목동', startTime:'21:30', type:'individual', students:[{name:'이레',minutes:90,fee:126000}] },
  { date:d(26), teacherId:'boram', location:'목동', startTime:'23:00', type:'individual', students:[{name:'윤서',minutes:90,fee:126000}] },

  // ─ Mon Apr 27 ─
  { date:d(27), teacherId:'yoonsun', location:'지하', startTime:'08:00', type:'individual', students:[{name:'서윤',minutes:120,fee:168000}] },
  { date:d(27), teacherId:'yoonsun', location:'목동', startTime:'10:00', type:'individual', students:[{name:'리령',minutes:60,fee:84000}] },
  { date:d(27), teacherId:'yoonsun', location:'지하', startTime:'11:00', type:'individual', students:[{name:'민아',minutes:60,fee:84000}] },
  { date:d(27), teacherId:'yoonsun', location:'지하', startTime:'12:00', type:'individual', students:[{name:'주희',minutes:90,fee:126000}] },
  { date:d(27), teacherId:'yoonsun', location:'안양', startTime:'14:00', type:'individual', students:[{name:'다온',minutes:90,fee:126000}] },

  // ─ Tue Apr 28 ─
  { date:d(28), teacherId:'boram', location:'목동', startTime:'09:00', type:'individual', students:[{name:'해온',minutes:90,fee:126000}] },
  { date:d(28), teacherId:'boram', location:'목동', startTime:'10:30', type:'individual', students:[{name:'이레',minutes:90,fee:126000}] },
  { date:d(28), teacherId:'boram', location:'목동', startTime:'12:00', type:'individual', students:[{name:'윤서',minutes:120,fee:168000}] },
  { date:d(28), teacherId:'byun',  location:'제2',  startTime:'14:00', type:'individual', students:[{name:'서인',minutes:60,fee:84000}] },
  { date:d(28), teacherId:'shin',  location:'목동', startTime:'21:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },
  { date:d(28), teacherId:'shin',  location:'목동', startTime:'23:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },

  // ─ Wed Apr 29 ─
  { date:d(29), teacherId:'choi',  location:'김포', startTime:'11:00', endTime:'15:00', type:'individual',
    students:[{name:'동한',minutes:60,fee:84000},{name:'하율',minutes:90,fee:126000},{name:'지수',minutes:60,fee:84000}] },
  { date:d(29), teacherId:'nahee', location:'롯데', startTime:'21:00', endTime:'00:30', type:'individual',
    students:[{name:'세량',minutes:90,fee:126000},{name:'소윤',minutes:90,fee:126000}] },

  // ─ Thu Apr 30 ─
  { date:d(30), teacherId:'shin', location:'태릉', startTime:'10:00', type:'individual', students:[{name:'아진',minutes:90,fee:126000}] },
  { date:d(30), teacherId:'shin', location:'태릉', startTime:'11:30', type:'individual', students:[{name:'예인',minutes:90,fee:126000}] },
  { date:d(30), teacherId:'shin', location:'태릉', startTime:'13:00', type:'individual', students:[{name:'수현',minutes:90,fee:126000}] },
  { date:d(30), teacherId:'shin', location:'태릉', startTime:'14:30', type:'individual', students:[{name:'지우',minutes:90,fee:126000}] },
  { date:d(30), teacherId:'shin', location:'태릉', startTime:'16:00', type:'individual', students:[{name:'한나',minutes:120,fee:168000}] },
  { date:d(30), teacherId:'shin', location:'목동', startTime:'21:00', type:'individual', students:[{name:'아진',minutes:120,fee:168000}] },
]

// ── 4월 개인 일정 ─────────────────────────────────────────────
const APR_PERSONAL: Omit<PersonalEvent, 'id' | 'createdAt'>[] = [
  // 전주 출장 Apr 3-5 (다중일)
  { date:d(3), endDate:d(5), allDay:true, title:'전주', color:'#14b8a6', startTime:'00:00', endTime:'23:59' },
  // 식목일 Apr 5
  { date:d(5), allDay:true, title:'식목일', color:'#6b7280', startTime:'00:00', endTime:'23:59' },
  // GTKF Apr 6, 13
  { date:d(6),  allDay:false, title:'GTKF', color:'#8b5cf6', startTime:'14:00', endTime:'18:00' },
  { date:d(13), allDay:false, title:'GTKF', color:'#8b5cf6', startTime:'14:00', endTime:'18:00' },
  // 일본 Apr 11-12 (다중일)
  { date:d(11), endDate:d(12), allDay:true, title:'일본', color:'#3b82f6', startTime:'00:00', endTime:'23:59' },
  // 현진 Apr 14, 25
  { date:d(14), allDay:false, title:'현진', color:'#10b981', startTime:'09:00', endTime:'10:00' },
  { date:d(25), allDay:false, title:'현진', color:'#10b981', startTime:'10:00', endTime:'11:00' },
  // 전주 출장 Apr 17-18 (다중일)
  { date:d(17), endDate:d(18), allDay:true, title:'전주', color:'#14b8a6', startTime:'00:00', endTime:'23:59' },
  // 근로자의 날 May 1
  { date:'2026-05-01', allDay:true, title:'근로자의 날', color:'#ef4444', startTime:'00:00', endTime:'23:59' },
]

export async function seedAprilData() {
  // 버전 체크 — 버전이 같으면 스킵
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY)
  if (storedVersion === APRIL_SEED_VERSION) return

  // 기존 4월 데이터 삭제
  const aprilLessons = await db.lessons
    .where('date').between('2026-04-01', '2026-04-30', true, true).toArray()
  if (aprilLessons.length > 0) await db.lessons.bulkDelete(aprilLessons.map(l => l.id))

  const aprilPersonal = await db.personalEvents
    .where('date').between('2026-04-01', '2026-05-02', true, true).toArray()
  if (aprilPersonal.length > 0) await db.personalEvents.bulkDelete(aprilPersonal.map(p => p.id))

  const now = Date.now()
  const lessons: LessonEntry[] = APR_LESSONS.map(l => ({ ...l, id: generateId(), createdAt: now } as LessonEntry))
  const personal: PersonalEvent[] = APR_PERSONAL.map(p => ({ ...p, id: generateId(), createdAt: now }))

  await db.lessons.bulkAdd(lessons)
  await db.personalEvents.bulkAdd(personal)

  localStorage.setItem(SEED_VERSION_KEY, APRIL_SEED_VERSION)
}
