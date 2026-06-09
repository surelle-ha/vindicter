<script setup lang="ts">
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GitBranch, Map, Plus, Sparkles, X } from 'lucide-vue-next'
import { generateId } from '~/utils/id'

interface RoadmapEvent {
  id: string
  title: string
  date: string
  status: 'done' | 'active' | 'planned'
  detail: string
}

const projects = useProjectsStore()
const showAddEvent = ref(false)
const eventTitle = ref('')
const eventDate = ref(new Date().toISOString().slice(0, 10))
const eventStatus = ref<RoadmapEvent['status']>('planned')
const eventDetail = ref('')
const customEvents = ref<RoadmapEvent[]>([])

onMounted(async () => {
  if (!projects.projects.length) {
    await projects.loadProjects()
  }
})

const activeProject = computed(() => projects.activeProject)
const defaultEvents = computed<RoadmapEvent[]>(() => [
  {
    id: 'foundation',
    title: 'Foundation',
    date: '2026-05-01',
    status: 'done',
    detail: 'Local project registry, workspace tabs, tickets, and sprint basics are in place.',
  },
  {
    id: 'planning',
    title: 'AI-assisted planning',
    date: '2026-06-15',
    status: 'active',
    detail: activeProject.value
      ? `Shape ${activeProject.value.name} work into tickets, sprints, and AI-ready handoffs.`
      : 'Select a project to make the active planning milestone project-aware.',
  },
  {
    id: 'docs',
    title: 'Docs automation',
    date: '2026-08-01',
    status: 'planned',
    detail: 'Keep README and changelog context fresh from completed sprint work.',
  },
  {
    id: 'release',
    title: 'Release cockpit',
    date: '2026-10-01',
    status: 'planned',
    detail: 'Tie roadmap milestones, completed sprints, security checks, and release notes together.',
  },
])

const timelineEvents = computed(() =>
  [...defaultEvents.value, ...customEvents.value]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
)

const statusClass: Record<RoadmapEvent['status'], string> = {
  done: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200',
  active: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
  planned: 'border-white/10 bg-white/[0.04] text-[var(--text-muted)]',
}

function resetEventForm() {
  eventTitle.value = ''
  eventDate.value = new Date().toISOString().slice(0, 10)
  eventStatus.value = 'planned'
  eventDetail.value = ''
}

function addEvent() {
  if (!eventTitle.value.trim()) return
  customEvents.value.push({
    id: generateId(),
    title: eventTitle.value.trim(),
    date: eventDate.value || new Date().toISOString().slice(0, 10),
    status: eventStatus.value,
    detail: eventDetail.value.trim() || 'No detail added yet.',
  })
  showAddEvent.value = false
  resetEventForm()
}

function removeEvent(id: string) {
  customEvents.value = customEvents.value.filter(event => event.id !== id)
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <section class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="grid gap-5 p-5 lg:grid-cols-[1fr_20rem] lg:p-6">
        <div>
          <div class="flex items-center gap-2">
            <Map class="size-4 text-indigo-300" />
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/70">Roadmap</p>
          </div>
          <h1 class="mt-3 text-2xl font-bold tracking-tight text-[var(--text)]">
            {{ activeProject ? `${activeProject.name} timeline` : 'Project timeline' }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            Track the sequence of project milestones, delivery moments, and future checkpoints in one scannable timeline.
          </p>
          <button
            class="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
            @click="showAddEvent = true"
          >
            <Plus class="size-3.5" />
            Add Event
          </button>
        </div>

        <div class="rounded-lg border border-[var(--border)] bg-black/10 p-4">
          <div class="flex items-center gap-2">
            <GitBranch class="size-4 text-emerald-300" />
            <p class="text-sm font-semibold text-[var(--text)]">Active Scope</p>
          </div>
          <p class="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
            {{ activeProject?.absolutePath ?? 'Select a project from the sidebar to make this roadmap project-aware.' }}
          </p>
          <NuxtLink
            :to="activeProject ? `/projects/${activeProject.id}` : '/'"
            class="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
          >
            {{ activeProject ? 'Open Workspace' : 'Choose Project' }}
            <ArrowRight class="size-3.5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div class="relative">
        <div class="absolute bottom-4 left-4 top-4 w-px bg-[var(--border)]" />
        <article
          v-for="event in timelineEvents"
          :key="event.id"
          class="relative grid gap-3 pb-6 pl-11 last:pb-0"
        >
          <div class="absolute left-0 top-1 grid size-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
            <CheckCircle2 v-if="event.status === 'done'" class="size-4 text-emerald-300" />
            <Clock3 v-else-if="event.status === 'active'" class="size-4 text-indigo-300" />
            <Sparkles v-else class="size-4 text-violet-300" />
          </div>
          <div class="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-sm font-semibold text-[var(--text)]">{{ event.title }}</h2>
                  <span class="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize" :class="statusClass[event.status]">
                    {{ event.status }}
                  </span>
                </div>
                <p class="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                  <CalendarDays class="size-3" />
                  {{ formatDate(event.date) }}
                </p>
              </div>
              <button
                v-if="!defaultEvents.some(item => item.id === event.id)"
                class="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-red-300"
                title="Remove event"
                @click="removeEvent(event.id)"
              >
                <X class="size-3.5" />
              </button>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{{ event.detail }}</p>
          </div>
        </article>
      </div>
    </section>

    <GlassModal v-model="showAddEvent" title="Add Roadmap Event" max-width="md">
      <div class="space-y-4">
        <GlassInput v-model="eventTitle" label="Event title" placeholder="Release beta" />
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Date</label>
            <input
              v-model="eventDate"
              type="date"
              class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500/50"
            >
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Status</label>
            <GlassSelect v-model="eventStatus" class="w-full">
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </GlassSelect>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">Detail</label>
          <textarea
            v-model="eventDetail"
            rows="3"
            placeholder="What should happen at this point?"
            class="w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-indigo-500/50"
          />
        </div>
        <div class="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button class="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]" @click="showAddEvent = false">
            Cancel
          </button>
          <button class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50" :disabled="!eventTitle.trim()" @click="addEvent">
            Add Event
          </button>
        </div>
      </div>
    </GlassModal>
  </div>
</template>
