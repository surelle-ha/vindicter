<script setup lang="ts">
import {
  Rss, Plus, Trash2, RefreshCw, Loader2, Globe, CheckCircle2,
  AlertTriangle, ToggleLeft, ToggleRight, ExternalLink,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'News Management â€” Vindicter' })

const api = useApi()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => { if (!isAdmin.value) router.push('/campaigns') })

interface RssFeed {
  id: string
  name: string
  url: string
  category: string
  enabled: boolean
  createdAt: string
}

const feeds    = ref<RssFeed[]>([])
const loading  = ref(true)
const fetchErr = ref('')
const saving   = ref(false)
const msg      = ref('')
const msgType  = ref<'ok' | 'err'>('ok')

const showAdd  = ref(false)
const newFeed  = reactive({ name: '', url: '', category: 'general' })
const addErr   = ref('')

const syncing  = ref(false)
const syncMsg  = ref('')

async function fetchFeeds() {
  loading.value  = true
  fetchErr.value = ''
  try {
    feeds.value = await api.get<RssFeed[]>('/news/feeds') ?? []
  } catch (e) {
    fetchErr.value = e instanceof Error ? e.message : 'Failed to load feeds.'
  } finally {
    loading.value = false
  }
}

async function toggleFeed(feed: RssFeed) {
  try {
    await api.patch(`/news/feeds/${feed.id}`, { enabled: !feed.enabled })
    feed.enabled = !feed.enabled
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Failed to update feed.', 'err')
  }
}

async function deleteFeed(id: string) {
  if (!confirm('Delete this feed? Cached articles will also be removed.')) return
  try {
    await api.del(`/news/feeds/${id}`)
    feeds.value = feeds.value.filter(f => f.id !== id)
    setMsg('Feed removed.', 'ok')
  } catch (e) {
    setMsg(e instanceof Error ? e.message : 'Failed to delete feed.', 'err')
  }
}

async function addFeed() {
  addErr.value = ''
  if (!newFeed.name.trim()) { addErr.value = 'Name is required.'; return }
  if (!newFeed.url.trim())  { addErr.value = 'URL is required.';  return }
  try { new URL(newFeed.url.trim()) } catch { addErr.value = 'Enter a valid URL.'; return }

  saving.value = true
  try {
    const created = await api.post<RssFeed>('/news/feeds', {
      name: newFeed.name.trim(), url: newFeed.url.trim(), category: newFeed.category,
    })
    feeds.value.push(created)
    newFeed.name = ''; newFeed.url = ''; newFeed.category = 'general'
    showAdd.value = false
    setMsg('Feed added.', 'ok')
  } catch (e) {
    addErr.value = e instanceof Error ? e.message : 'Failed to add feed.'
  } finally {
    saving.value = false
  }
}

async function syncArticles() {
  syncing.value = true
  syncMsg.value = ''
  let total = 0
  const errors: string[] = []
  try {
    const enabledFeeds = feeds.value.filter(f => f.enabled)
    if (!enabledFeeds.length) { syncMsg.value = 'No enabled feeds to sync.'; return }

    for (const feed of enabledFeeds) {
      try {
        const res = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`)
        if (!res.ok) throw new Error(`Proxy error ${res.status}`)
        const { items } = await res.json() as { items: any[] }
        if (!items?.length) { errors.push(`${feed.name}: no items returned`); continue }

        const articles = items.slice(0, 30).filter(i => i.link).map(item => ({
          feedId:      feed.id,
          feedName:    feed.name,
          title:       item.title || 'Untitled',
          link:        item.link,
          summary:     item.description?.slice(0, 500) ?? null,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        }))

        const result = await api.post<{ synced: number }>('/news/articles/sync', { articles })
        total += result?.synced ?? 0
      } catch (e: any) {
        errors.push(`${feed.name}: ${e?.message ?? 'fetch failed'}`)
      }
    }

    syncMsg.value = total
      ? `Synced ${total} article${total !== 1 ? 's' : ''} from ${enabledFeeds.length} feed${enabledFeeds.length !== 1 ? 's' : ''}.`
      : `No new articles. ${errors.length ? 'Errors: ' + errors.join('; ') : ''}`
  } catch (e: any) {
    syncMsg.value = e instanceof Error ? e.message : 'Sync failed.'
  } finally {
    syncing.value = false
  }
}

function setMsg(text: string, type: 'ok' | 'err') {
  msg.value = text; msgType.value = type
  setTimeout(() => { msg.value = '' }, 3500)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchFeeds)
</script>

<template>
  <div class="max-w-4xl mx-auto">

    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Rss class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin</p>
        </div>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">News Management</h1>
        <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Manage RSS feeds and sync articles shown to users.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer"
          style="color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.08);"
          :disabled="loading" @click="fetchFeeds"
        >
          <RefreshCw class="h-3 w-3" :class="loading ? 'animate-spin' : ''" /> Refresh
        </button>
        <button
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
          style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:rgba(251,191,36,0.90);"
          :disabled="syncing" @click="syncArticles"
        >
          <Loader2 v-if="syncing" class="h-3 w-3 animate-spin" />
          <RefreshCw v-else class="h-3 w-3" />
          {{ syncing ? 'Syncingâ€¦' : 'Sync Now' }}
        </button>
        <button
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer"
          style="background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.30);color:rgba(251,191,36,0.95);"
          @click="showAdd = !showAdd"
        >
          <Plus class="h-3 w-3" /> Add Feed
        </button>
      </div>
    </div>

    <!-- Status messages -->
    <div v-if="msg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]"
      :style="msgType === 'ok'
        ? 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);'
        : 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);'"
    >{{ msg }}</div>

    <div v-if="syncMsg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);color:rgba(251,191,36,0.85);">
      {{ syncMsg }}
    </div>

    <div v-if="fetchErr" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ fetchErr }}
    </div>

    <!-- Add feed form -->
    <div v-if="showAdd" class="mb-5 rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);">
      <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">Add RSS Feed</p>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Feed name</label>
          <input v-model="newFeed.name" placeholder="e.g. CS Hub Attacks"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">RSS URL</label>
          <input v-model="newFeed.url" placeholder="https://â€¦/rss"
            class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>
      </div>
      <div>
        <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Category</label>
        <select v-model="newFeed.category"
          class="rounded-xl px-3 py-2 text-[12px] text-white outline-none"
          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);">
          <option value="general">General</option>
          <option value="attacks">Attacks</option>
          <option value="articles">Articles</option>
          <option value="reports">Reports</option>
          <option value="vulnerabilities">Vulnerabilities</option>
        </select>
      </div>
      <p v-if="addErr" class="text-[11px]" style="color:rgba(242,63,66,0.80);">{{ addErr }}</p>
      <div class="flex gap-2">
        <button
          :disabled="saving"
          class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.28);color:rgba(251,191,36,0.90);"
          @click="addFeed"
        >
          <Loader2 v-if="saving" class="h-3 w-3 animate-spin" />
          <Plus v-else class="h-3 w-3" /> Add
        </button>
        <button
          class="rounded-xl px-4 py-2 text-[12px] transition-colors cursor-pointer"
          style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);"
          @click="showAdd = false; addErr = ''"
        >Cancel</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
    </div>

    <!-- Empty -->
    <div v-else-if="!feeds.length"
      class="rounded-xl px-5 py-14 text-center"
      style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);"
    >
      <Rss class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
      <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No RSS feeds configured. Add one above.</p>
    </div>

    <!-- Feed list -->
    <div v-else class="rounded-xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">
      <div class="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
        style="background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.25);grid-template-columns:1fr 160px 90px 60px 80px;">
        <span>Feed</span>
        <span>Category</span>
        <span>Added</span>
        <span>Status</span>
        <span></span>
      </div>
      <div
        v-for="feed in feeds" :key="feed.id"
        class="grid items-center px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.02]"
        style="border-bottom:1px solid rgba(255,255,255,0.04);grid-template-columns:1fr 160px 90px 60px 80px;"
      >
        <div class="min-w-0 pr-4">
          <p class="font-medium truncate" style="color:rgba(255,255,255,0.80);">{{ feed.name }}</p>
          <div class="flex items-center gap-1 mt-0.5">
            <Globe class="h-2.5 w-2.5 shrink-0" style="color:rgba(255,255,255,0.20);" />
            <p class="text-[10px] truncate" style="color:rgba(255,255,255,0.28);">{{ feed.url }}</p>
          </div>
        </div>
        <span class="inline-flex w-max items-center rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize"
          style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.18);color:rgba(251,191,36,0.75);">
          {{ feed.category }}
        </span>
        <span style="color:rgba(255,255,255,0.25);">{{ fmt(feed.createdAt) }}</span>
        <button class="flex items-center gap-1 text-[11px] cursor-pointer" @click="toggleFeed(feed)">
          <ToggleRight v-if="feed.enabled" class="h-4 w-4" style="color:rgba(35,165,90,0.80);" />
          <ToggleLeft v-else class="h-4 w-4" style="color:rgba(255,255,255,0.25);" />
        </button>
        <div class="flex items-center gap-2">
          <a :href="feed.url" target="_blank" class="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] cursor-pointer"
            style="color:rgba(255,255,255,0.25);" title="Open feed">
            <ExternalLink class="h-3 w-3" />
          </a>
          <button class="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 cursor-pointer"
            style="color:rgba(248,113,113,0.45);" title="Delete feed" @click="deleteFeed(feed.id)">
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <p v-if="feeds.length" class="mt-3 text-[11px]" style="color:rgba(255,255,255,0.20);">
      {{ feeds.filter(f => f.enabled).length }} of {{ feeds.length }} feed(s) enabled. Use "Sync Now" to refresh cached articles.
    </p>

  </div>
</template>

