import Dexie, { type Table } from 'dexie'
import type { LessonEntry, ChoreoEntry, PersonalEvent, MonthClose, Teacher, PriceConfig } from '../types'

class SenaskateDB extends Dexie {
  lessons!: Table<LessonEntry>
  choreos!: Table<ChoreoEntry>
  personalEvents!: Table<PersonalEvent>
  monthClose!: Table<MonthClose>
  teachers!: Table<Teacher>
  config!: Table<{ id: string } & PriceConfig>

  constructor() {
    super('senaskateDB')
    this.version(1).stores({
      lessons: 'id, date, teacherId, [date+teacherId]',
      choreos: 'id, studentName, teacherId, billedMonth, startMonth',
      personalEvents: 'id, date',
      monthClose: 'id, month',
      teachers: 'id',
      config: 'id',
    })
  }
}

export const db = new SenaskateDB()
