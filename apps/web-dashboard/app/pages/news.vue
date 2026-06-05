<script setup lang="ts">
import { Rss, ExternalLink, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'News — Vindicter' })

const api = useApi()

interface Article {
  id: string
  feedName: string
  title: string
  link: string
  summary: string | null
  imageUrl?: string | null
  publishedAt: string | null
  fetchedAt: string
}

const articles   = ref<Article[]>([])
const loading    = ref(true)
const refreshing = ref(false)
const activeCategory = ref('all')
const currentPage    = ref(1)
const PAGE_SIZE = 12

interface Feed { id: string; name: string; category: string; enabled: boolean }
const feeds = ref<Feed[]>([])

async function loadFeeds() {
  const data = await api.get<Feed[]>('/news/feeds').catch(() => [])
  feeds.value = (data ?? []).filter(f => f.enabled)
}

async function loadArticles() {
  const data = await api.get<Article[]>('/news/articles?limit=200').catch(() => [])
  articles.value = data ?? []
}

async function refresh() {
  refreshing.value = true
  await loadArticles()
  refreshing.value = false
}

onMounted(async () => {
  await Promise.all([loadFeeds(), loadArticles()])
  loading.value = false
})

const categories = computed(() => {
  const cats = new Set(feeds.value.map(f => f.category))
  return ['all', ...cats]
})

const filtered = computed(() => {
  if (activeCategory.value === 'all') return articles.value
  const names = feeds.value.filter(f => f.category === activeCategory.value).map(f => f.name)
  return articles.value.filter(a => names.includes(a.feedName))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }

watch(activeCategory, () => { currentPage.value = 1 })
watch(filtered, () => { currentPage.value = 1 })

function fmt(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function categoryColor(cat?: string): string {
  if (!cat) return 'rgba(139,92,246,0.70)'
  const map: Record<string, string> = {
    attacks:  'rgba(248,113,113,0.70)',
    reports:  'rgba(139,92,246,0.70)',
    articles: 'rgba(99,102,241,0.70)',
  }
  return map[cat.toLowerCase()] ?? 'rgba(139,92,246,0.70)'
}
</script>

<template>
  <div class="-m-5">

    <!-- ── Dither cover ────────────────────────────────────────────────────── -->
    <div class="relative h-40 overflow-hidden">
      <ClientOnly>
        <Dither
          class="absolute inset-0"
          :wave-speed="0.025" :wave-frequency="2.0" :wave-amplitude="0.28"
          :wave-color="[0.28, 0.24, 0.55]" :color-num="5" :pixel-size="2"
          :disable-animation="false" :enable-mouse-interaction="false" :mouse-radius="0.6"
        />
      </ClientOnly>
      <div class="absolute inset-0" style="background:linear-gradient(to bottom, rgba(17,18,21,0.15) 0%, rgba(17,18,21,0.80) 100%);" />
      <div class="absolute inset-0 flex flex-col justify-end px-6 pb-5">
        <div class="flex items-end justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
              style="background:rgba(139,92,246,0.25);border:1px solid rgba(139,92,246,0.40);backdrop-filter:blur(8px);">
              <Rss class="h-4 w-4" style="color:rgba(167,139,250,0.95);" />
            </div>
            <div>
              <h1 class="text-[22px] font-display font-black uppercase tracking-wide leading-none" style="color:rgba(255,255,255,0.95);">Security News</h1>
              <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.50);">Latest from trusted security sources.</p>
            </div>
          </div>
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition-colors cursor-pointer shrink-0"
            style="background:rgba(17,18,21,0.60);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);backdrop-filter:blur(8px);"
            :disabled="refreshing" @click="refresh">
            <RefreshCw class="h-3 w-3" :class="refreshing ? 'animate-spin' : ''" /> Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- ── Content area ───────────────────────────────────────────────────── -->
    <div class="p-5">

      <!-- Category pills -->
      <div v-if="categories.length > 1" class="flex items-center gap-2 mb-6 flex-wrap">
        <button
          v-for="cat in categories" :key="cat"
          class="px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors cursor-pointer"
          :style="activeCategory === cat
            ? 'background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);'
            : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);'"
          @click="activeCategory = cat">{{ cat }}</button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 9" :key="i" class="rounded-xl animate-pulse" style="background:rgba(255,255,255,0.04);height:240px;" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!filtered.length"
        class="rounded-xl px-5 py-16 text-center"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
        <Rss class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
        <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No articles yet. An admin can sync RSS feeds from News Management.</p>
      </div>

      <!-- Articles grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          v-for="article in paginated" :key="article.id"
          :href="article.link" target="_blank" rel="noopener noreferrer"
          class="group flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xl"
          style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);"
        >
          <!-- Article image -->
          <div v-if="article.imageUrl" class="aspect-video overflow-hidden shrink-0">
            <img
              :src="article.imageUrl"
              :alt="article.title"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display='none'"
            />
          </div>
          <!-- Placeholder when no image -->
          <div v-else class="aspect-video shrink-0 flex items-center justify-center" style="background:rgba(139,92,246,0.04);border-bottom:1px solid rgba(255,255,255,0.05);">
            <Rss class="h-6 w-6" style="color:rgba(139,92,246,0.20);" />
          </div>

          <!-- Content -->
          <div class="flex flex-col flex-1 p-4 gap-2">
            <!-- Meta row -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wide truncate" :style="`color:${categoryColor(article.feedName)};`">
                {{ article.feedName }}
              </span>
              <span class="text-[10px] shrink-0" style="color:rgba(255,255,255,0.22);">{{ fmt(article.publishedAt) }}</span>
            </div>

            <!-- Title -->
            <div class="flex items-start justify-between gap-1.5">
              <h3 class="text-[13px] font-semibold leading-snug flex-1 transition-colors group-hover:text-white"
                style="color:rgba(255,255,255,0.82);">{{ article.title }}</h3>
              <ExternalLink class="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity" style="color:rgba(255,255,255,0.60);" />
            </div>

            <!-- Summary -->
            <p v-if="article.summary" class="text-[11px] leading-relaxed line-clamp-3 flex-1"
              style="color:rgba(255,255,255,0.35);">{{ article.summary }}</p>
          </div>
        </a>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-8">
        <button
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style="border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.50);"
          :disabled="currentPage === 1" @click="prevPage">
          <ChevronLeft class="h-3.5 w-3.5" /> Previous
        </button>

        <div class="flex items-center gap-1.5">
          <button
            v-for="p in totalPages" :key="p"
            class="size-7 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            :style="p === currentPage
              ? 'background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);'
              : 'border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.30);'"
            @click="currentPage = p">{{ p }}</button>
        </div>

        <button
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style="border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.50);"
          :disabled="currentPage === totalPages" @click="nextPage">
          Next <ChevronRight class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Count -->
      <p v-if="filtered.length" class="mt-4 text-center text-[11px]" style="color:rgba(255,255,255,0.18);">
        {{ filtered.length }} article{{ filtered.length !== 1 ? 's' : '' }} · page {{ currentPage }} of {{ totalPages }}
      </p>
    </div>
  </div>
</template>
