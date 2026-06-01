// Security Engineering Academy curriculum
// Exported as static data to avoid Vue SFC template-literal parsing issues.

export interface Lesson {
  id: string
  day: number
  week: number
  title: string
  subtitle?: string
  duration: string
  objectives: string[]
  content: string
  labHint?: string
  agentNotes?: string
  prerequisiteId?: string | null
}

export interface CustomLesson extends Lesson {
  agentNotes: string
  section: string
  sectionOrder: number  // explicit sort order; 0 = not yet set, falls back to week-based ordering
  vaFilename: string
  embeddedAudio: {
    voice: string
    generatedAt: string
    data: string
  } | null
}

export interface Week {
  number: number
  title: string
  theme: string
  color: string
  bg: string
  border: string
}

export const WEEKS: Week[] = [
  { number: 0, title: 'Introduction', theme: 'Getting Started',     color: 'text-teal-300',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20'   },
  { number: 1, title: 'Week 1', theme: 'Security Foundations', color: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { number: 2, title: 'Week 2', theme: 'Web App Security',     color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { number: 3, title: 'Week 3', theme: 'Penetration Testing',  color: 'text-rose-300',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  { number: 4, title: 'Week 4', theme: 'Defensive Security',   color: 'text-emerald-300',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  { number: 5, title: 'Capstone', theme: 'Assessment',         color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  { number: 6, title: 'Specialization', theme: 'Advanced AppSec', color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { number: 7, title: 'Operations', theme: 'Blue Team Practice', color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
]

export const TOTAL_DAYS = 40

export const INTRO_LESSON_IDS = ['intro-1', 'intro-2', 'intro-3', 'intro-4']

export const LESSONS: Lesson[] = []

export const MAIN_LESSON_COUNT = LESSONS.filter(lesson => !INTRO_LESSON_IDS.includes(lesson.id)).length

export function getLessonsByWeek(week: number): Lesson[] {
  return LESSONS.filter(l => l.week === week)
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find(l => l.id === id)
}

export function getWeekMeta(weekNumber: number): Week {
  return WEEKS.find(w => w.number === weekNumber) ?? WEEKS[WEEKS.length - 1]!
}

export function getWeekForDay(day: number): Week {
  return WEEKS.find(w => w.number === Math.ceil(day / 7)) ?? WEEKS[WEEKS.length - 1]!
}