<script setup lang="ts">
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  Plus,
  RefreshCw,
  Rocket,
  Rss,
  ShieldCheck,
} from 'lucide-vue-next'
import { deriveProjectCode } from '~/utils/ticket'

const projects = useProjectsStore()
const app = useAppStore()
const security = useSecurityStore()
const wizard = useWizardStore()
const auth = useAuthStore()
const feed = useNotificationFeedStore()
const { createProject } = useVindicterJson()
const { notify } = useNotifications()

const RSS_NOTIF_KEY = 'vindicter:rss:last-notified-ids'

function notifyNewRssItems(freshItems: NewsItem[]) {
  try {
    const lastIds: string[] = JSON.parse(localStorage.getItem(RSS_NOTIF_KEY) ?? '[]')
    const newItems = freshItems.filter(item => !lastIds.includes(item.id))
    if (newItems.length > 0) {
      feed.push({
        category: 'rss_article',
        title: `${newItems.length} new security article${newItems.length === 1 ? '' : 's'}`,
        body: newItems.slice(0, 3).map(i => i.title).join(' • '),
        link: '/',
      })
    }
    localStorage.setItem(RSS_NOTIF_KEY, JSON.stringify(freshItems.map(i => i.id)))
  }
  catch { /* ignore */ }
}

onMounted(async () => {
  await projects.loadProjects()
  await loadActiveSecurity()
  await loadSecurityNews()   // serves cache instantly if fresh; fetches in background if stale
})

const activeProject = computed(() => projects.activeProject)
const latestScanLabel = computed(() => security.latestScan ? new Date(security.latestScan.scannedAt).toLocaleDateString() : 'No scan')

interface NewsItem {
  id: string
  title: string
  link: string
  sourceLabel: string
  publishedLabel: string
  summary: string
  timestamp: number
}

const newsItems = ref<NewsItem[]>([])
const newsLoading = ref(false)
const newsError = ref('')
const enabledRssSources = computed(() => app.rssSources.filter(source => source.enabled && source.url.trim()))

async function loadActiveSecurity() {
  if (!activeProject.value?.absolutePath) return
  await security.load(activeProject.value.absolutePath, activeProject.value.id).catch(() => {})
}

watch(() => activeProject.value?.id, () => {
  void loadActiveSecurity()
})

function cleanSummary(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatNewsDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function childText(parent: Element, names: string[]) {
  for (const name of names) {
    const direct = Array.from(parent.children).find(child => child.tagName.toLowerCase() === name.toLowerCase())
    const value = direct?.textContent?.trim()
    if (value) return value
  }
  return ''
}

function itemLink(item: Element, sourceUrl: string) {
  const rssLink = childText(item, ['link'])
  if (rssLink) return rssLink
  const atomLink = Array.from(item.querySelectorAll('link')).find(link => !link.getAttribute('rel') || link.getAttribute('rel') === 'alternate')
  return atomLink?.getAttribute('href') || sourceUrl
}

async function fetchRssXml(url: string) {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<string>('fetch_rss_source', { url })
  }
  catch {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`RSS source returned ${response.status}`)
    return response.text()
  }
}

// ── RSS cache helpers ─────────────────────────────────────────────────────────
const RSS_CACHE_KEY = 'vindicter:rss:cache'
const RSS_CACHE_TTL = 30 * 60 * 1000  // 30 minutes

interface RssCache { items: NewsItem[]; fetchedAt: number; sourceIds: string[] }

function getRssCache(): RssCache | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(RSS_CACHE_KEY)
    return raw ? JSON.parse(raw) as RssCache : null
  } catch { return null }
}

function setRssCache(items: NewsItem[]) {
  try {
    const data: RssCache = {
      items,
      fetchedAt: Date.now(),
      sourceIds: enabledRssSources.value.map(s => s.id),
    }
    localStorage.setItem(RSS_CACHE_KEY, JSON.stringify(data))
  } catch { /* storage may be full */ }
}

async function fetchAndParseNews(): Promise<NewsItem[]> {
  const batches = await Promise.allSettled(enabledRssSources.value.map(async (source) => {
    const xml = await fetchRssXml(source.url)
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    if (doc.querySelector('parsererror')) throw new Error(`${source.label} returned invalid XML`)
    const nodes = [
      ...Array.from(doc.querySelectorAll('item')),
      ...Array.from(doc.querySelectorAll('entry')),
    ]
    const allItems = nodes.map((item, index) => {
      const title = childText(item, ['title']) || 'Untitled security story'
      const link = itemLink(item, source.url)
      const pubDate = childText(item, ['pubDate', 'published', 'updated', 'dc:date'])
      const summary = childText(item, ['description', 'summary', 'content:encoded', 'content'])
      const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now() - index
      return {
        id: `${source.id}-${index}-${title}`,
        title, link, sourceLabel: source.label,
        publishedLabel: formatNewsDate(pubDate),
        summary: cleanSummary(summary),
        timestamp: Number.isNaN(timestamp) ? Date.now() - index : timestamp,
      } satisfies NewsItem
    })
    return allItems.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6)
  }))

  const items = batches
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)

  const rejected = batches.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
  if (!items.length && rejected.length) {
    throw new Error(rejected[0]?.reason?.message ?? 'No stories returned from the configured feeds.')
  }
  return items
}

async function loadSecurityNews(forceRefresh = false) {
  if (!enabledRssSources.value.length) { newsItems.value = []; return }

  // Serve cached articles immediately if fresh enough
  const cache = getRssCache()
  const cacheValid = cache
    && Date.now() - cache.fetchedAt < RSS_CACHE_TTL
    && JSON.stringify(cache.sourceIds) === JSON.stringify(enabledRssSources.value.map(s => s.id))

  if (!forceRefresh && cacheValid) {
    newsItems.value = cache.items
    // Silently refresh in background after a short delay
    setTimeout(() => void loadSecurityNews(true), 5_000)
    return
  }

  newsLoading.value = true
  newsError.value = ''
  try {
    const items = await fetchAndParseNews()
    newsItems.value = items
    setRssCache(items)
    notifyNewRssItems(items)
  }
  catch (e: any) {
    // On background refresh failure, keep showing cached articles
    if (forceRefresh && cache?.items.length) {
      newsItems.value = cache.items
    } else {
      newsError.value = e?.message ?? 'Could not load security news.'
    }
  }
  finally {
    newsLoading.value = false
  }
}

async function handleFinish() {
  if (!wizard.selectedPath || !wizard.projectName) return

  const sub = auth.activeWorkspace?.subscription
  const projectLimit = sub?.projectLimit ?? -1
  if (projectLimit !== -1 && projects.projects.length >= projectLimit) {
    const planName = sub?.plan?.name ?? 'your current plan'
    notify(`Project limit reached (${planName}: ${projectLimit} projects). Upgrade to add more.`, 'error')
    wizard.closeWizard()
    return
  }

  const data = await createProject(wizard.selectedPath, {
    name: wizard.projectName,
    description: wizard.projectDescription,
    absolutePath: wizard.selectedPath,
    githubRepo: null,
    editor: 'other',
    aiTool: 'codex',
    aiTools: ['codex', 'claude_code'],
    activeAITool: null,
    ownedBy: 'local',
    code: wizard.projectCode || deriveProjectCode(wizard.projectName),
  })

  await projects.addProject(data.meta)
  projects.setActive(data.meta.id)
  wizard.closeWizard()
  notify(`Project "${data.meta.name}" added`, 'success')
  feed.push({
    category: 'info',
    title: `Project added: ${data.meta.name}`,
    body: `New project registered at ${data.meta.absolutePath}`,
    link: `/projects/${data.meta.id}`,
  })
  await navigateTo(`/projects/${data.meta.id}`)
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <section class="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_84%_20%,rgba(20,184,166,0.16),transparent_24%)]" />
      <div class="relative grid gap-6 p-5 lg:grid-cols-[1fr_22rem] lg:p-6">
        <div class="space-y-5">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/70">Home</p>
            <div class="mt-2 flex items-center gap-3">
              <ProjectGuideOrb accent="#67e8f9" />
              <h1 class="font-display text-3xl font-bold text-[var(--text)]">Welcome back to Vindicter</h1>
            </div>
            <p class="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              Scan local projects for vulnerabilities, keep findings scoped to the selected codebase, and turn security review into a calmer command center.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <GlassButton @click="wizard.openWizard()">
              <Plus class="size-3.5" />
              Add Project
            </GlassButton>
            <NuxtLink
              :to="activeProject ? `/projects/${activeProject.id}` : '/'"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text)]"
            >
              {{ activeProject ? 'Open Workspace' : 'Select Project' }}
              <ArrowRight class="size-3.5" />
            </NuxtLink>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-xl border border-white/10 bg-black/15 p-4">
          <div class="relative flex items-center justify-between gap-3">
            <div>
              <p class="text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">Active Project</p>
              <p class="mt-1 truncate text-lg font-semibold text-[var(--text)]">{{ activeProject?.name ?? 'No project selected' }}</p>
            </div>
            <FolderOpen class="size-5 text-indigo-300" />
          </div>
          <p class="relative mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
            {{ activeProject?.absolutePath ?? 'Add or select a project from the sidebar to scope tools, queues, and analyzer results.' }}
          </p>
          <div class="relative mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Code</p>
              <p class="mt-1 text-sm font-semibold text-[var(--text)]">{{ activeProject?.code ?? '-' }}</p>
            </div>
            <div class="rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Last Scan</p>
              <p class="mt-1 truncate text-sm font-semibold text-[var(--text)]">{{ latestScanLabel }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <main class="space-y-6">
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
          <div class="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
            <div class="flex items-center gap-2">
              <Rss class="size-4 text-cyan-300" />
              <div>
                <h2 class="text-sm font-semibold text-[var(--text)]">Security News</h2>
                <p class="mt-0.5 text-xs text-[var(--text-muted)]">Fresh stories from your configured RSS sources.</p>
              </div>
            </div>
            <button
              class="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-faint)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)] disabled:opacity-50"
              :disabled="newsLoading"
              title="Refresh news"
              @click="loadSecurityNews"
            >
              <RefreshCw class="size-3.5" :class="newsLoading ? 'animate-spin' : ''" />
            </button>
          </div>

          <div class="p-4">
            <div v-if="newsLoading && !newsItems.length" class="grid min-h-32 place-items-center text-xs text-[var(--text-muted)]">
              Loading security news...
            </div>
            <div v-else-if="newsError" class="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
              {{ newsError }}
            </div>
            <div v-else-if="!newsItems.length" class="rounded-lg border border-[var(--border)] bg-black/10 p-3 text-xs text-[var(--text-muted)]">
              No enabled RSS sources yet. Add sources in Settings.
            </div>
            <div v-else class="grid gap-3 md:grid-cols-2">
              <a
                v-for="item in newsItems"
                :key="item.id"
                :href="item.link"
                target="_blank"
                rel="noreferrer"
                class="group rounded-lg border border-[var(--border)] bg-black/10 p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-500/25 hover:bg-white/[0.04]"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">{{ item.sourceLabel }}</span>
                  <span class="shrink-0 text-[10px] text-[var(--text-faint)]">{{ item.publishedLabel }}</span>
                </div>
                <h3 class="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text)] group-hover:text-cyan-100">
                  {{ item.title }}
                </h3>
                <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{{ item.summary || 'Open the story for details.' }}</p>
                <span class="mt-3 inline-flex items-center gap-1 text-[11px] text-cyan-300/80">
                  Read story
                  <ExternalLink class="size-3" />
                </span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <aside class="space-y-6">
        <section class="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <div class="flex items-center gap-2">
            <ShieldCheck class="size-4 text-amber-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Security Routine</h2>
          </div>
          <p class="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
            Keep a quick scan fresh, review new evidence, and export a report before release decisions.
          </p>
          <button class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/15">
            View Workspace
            <ArrowRight class="size-3.5" />
          </button>
        </section>

        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <Rocket class="size-4 text-emerald-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Quick Actions</h2>
          </div>
          <div class="mt-4 space-y-2">
            <NuxtLink
              :to="activeProject ? `/projects/${activeProject.id}?tab=scanner` : '/'"
              class="flex items-center justify-between rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
            >
              Run Scanner
              <ArrowRight class="size-3.5" />
            </NuxtLink>
            <button
              class="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--text)]"
              @click="wizard.openWizard()"
            >
              Add Project
              <Plus class="size-3.5" />
            </button>
          </div>
        </section>

        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <CalendarDays class="size-4 text-indigo-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Today</h2>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
              <p class="text-xs leading-relaxed text-[var(--text-muted)]">Pick an active project before running scans.</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
              <p class="text-xs leading-relaxed text-[var(--text-muted)]">Open findings with full evidence before creating remediation items.</p>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <GlassModal
      v-model="wizard.open"
      title="Add Project"
      max-width="md"
      @close="wizard.closeWizard()"
    >
      <WizardShell @finish="handleFinish" />
    </GlassModal>
  </div>
</template>
