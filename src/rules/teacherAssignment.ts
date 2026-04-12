import type { TeacherId, Location } from '../types'
import type { Teacher } from '../types'

// 장소 → 선생님 자동배정
export function getTeacherByLocation(location: string): TeacherId | null {
  if (location === '김포') return 'choi'
  if (location === '롯데') return 'nahee'
  return null
}

// 학생 이름 → 선생님 찾기
export function getTeacherByStudent(name: string, teachers: Teacher[]): Teacher | undefined {
  return teachers.find(t => t.students.includes(name))
}

// 예주 특수 케이스: 같은 시간 소이(오쌤팀)와 있으면 오쌤, 윤선쌤팀과 있으면 윤선쌤
export function resolveYeju(siblingStudents: string[], teachers: Teacher[]): TeacherId {
  const ohStudents = teachers.find(t => t.id === 'oh')?.students ?? []
  const yoonsunStudents = teachers.find(t => t.id === 'yoonsun')?.students ?? []
  if (siblingStudents.some(s => ohStudents.includes(s))) return 'oh'
  if (siblingStudents.some(s => yoonsunStudents.includes(s))) return 'yoonsun'
  return 'oh' // 기본값
}
