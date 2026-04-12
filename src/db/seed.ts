import { db } from './index'
import type { Teacher } from '../types'
import { DEFAULT_PRICES } from '../types'

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'yoonsun',
    name: '윤선쌤',
    color: '#10b981',
    students: ['서윤', '예서', '나오미', '리령', '다온', '민아', '주희', '민소'],
  },
  {
    id: 'boram',
    name: '보람쌤',
    color: '#3b82f6',
    students: ['이레', '윤서', '진', '해온', '하람'],
  },
  {
    id: 'oh',
    name: '오쌤',
    color: '#f59e0b',
    students: ['리은', '소이', '예주', '미아'],
  },
  {
    id: 'byun',
    name: '변쌤',
    color: '#8b5cf6',
    students: ['희선', '수안', '서인', '다울', '아인', '주아'],
  },
  {
    id: 'nahee',
    name: '나희쌤',
    color: '#ec4899',
    students: ['소윤', '수아', '지요', '도연', '지아', '민주', '세령', '세량', '도윤', '금별'],
  },
  {
    id: 'ji',
    name: '지쌤',
    color: '#06b6d4',
    students: ['유이', '혜원', '유나', '세나', '수빈', '현지'],
  },
  {
    id: 'eunsun',
    name: '은선쌤',
    color: '#84cc16',
    students: ['지현'],
  },
  {
    id: 'choi',
    name: '최쌤',
    color: '#f97316',
    students: ['지예', '은재', '서연', '은담', '지원', '민송', '규진', '효은', '서영', '정윤', '하린', '연우', '현겸', '건희', '채연', '유재', '유성', '진아', '민채', '하영', '효린', '하빈', '아라', '유하', '가은', '동한', '하율', '루다', '지수'],
  },
  {
    id: 'shin',
    name: '신쌤',
    color: '#6366f1',
    students: [],
  },
  {
    id: 'jeonju',
    name: '전주',
    color: '#14b8a6',
    students: ['강희', '민아', '혜림', '로이', '혜은'],
  },
]

export async function seedIfEmpty() {
  const teacherCount = await db.teachers.count()
  if (teacherCount === 0) {
    await db.teachers.bulkAdd(INITIAL_TEACHERS)
  }
  const configCount = await db.config.count()
  if (configCount === 0) {
    await db.config.add({ id: 'default', ...DEFAULT_PRICES })
  }
}
