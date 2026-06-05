<script setup lang="ts">
import {
  BookOpen, CheckCircle2, Eye, Globe, Loader2, Plus, RefreshCw,
  Settings, Trash2, Upload, X, FileText, FileCode, ToggleLeft,
  ToggleRight, Link, AlertTriangle, Database, Zap,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'DefendCore — Knowledge Base' })

const api = useApi()
const { isAdmin } = useAuth()
const router = useRouter()

onMounted(() => { if (!isAdmin.value) router.push('/campaigns') })

// ── Types ─────────────────────────────────────────────────────────────────
interface DefendCoreConfig { desktopEnabled: boolean }
interface KnowledgeDoc { id: string; title: string; chunkCount: number; createdAt: string }

// ── Tabs ──────────────────────────────────────────────────────────────────
type Tab = 'config' | 'knowledge' | 'crawl' | 'upload'
const activeTab = ref<Tab>('config')

// ── Configuration ─────────────────────────────────────────────────────────
const desktopEnabled = ref(false)
const configLoading  = ref(false)
const configSaving   = ref(false)
const configMsg      = ref('')
const configMsgOk    = ref(true)

async function fetchConfig() {
  configLoading.value = true
  try {
    const data = await api.get<DefendCoreConfig>('/defendcore/config')
    desktopEnabled.value = Boolean(data.desktopEnabled)
  } catch { /* defaults */ }
  finally { configLoading.value = false }
}

async function saveConfig() {
  configSaving.value = true; configMsg.value = ''
  try {
    await api.post('/defendcore/config', { desktopEnabled: Boolean(desktopEnabled.value) })
    flash(configMsg, configMsgOk, 'Saved.', true)
  } catch (e) {
    flash(configMsg, configMsgOk, e instanceof Error ? e.message : 'Failed to save.', false)
  } finally { configSaving.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function flash(ref: Ref<string>, ok: Ref<boolean>, text: string, isOk: boolean) {
  ref.value = text; ok.value = isOk
  setTimeout(() => { ref.value = '' }, 4000)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtSize(n: number) { return `${n} chunk${n !== 1 ? 's' : ''}` }

// ── Knowledge base ─────────────────────────────────────────────────────────
const docs = ref<KnowledgeDoc[]>([])
const docsLoading = ref(false)
const docsErr  = ref('')
const docsMsg  = ref('')
const reindexing  = ref(false)
const viewDoc     = ref<{ title: string; chunks: string[] } | null>(null)
const viewLoading = ref(false)

// Manual text add
const newTitle   = ref('')
const newContent = ref('')
const addingDoc  = ref(false)
const addDocErr  = ref('')

async function fetchDocs() {
  docsLoading.value = true; docsErr.value = ''
  try { docs.value = await api.get<KnowledgeDoc[]>('/defendcore/documents') ?? [] }
  catch (e) { docsErr.value = e instanceof Error ? e.message : 'Failed to load.' }
  finally   { docsLoading.value = false }
}

async function addDoc() {
  addDocErr.value = ''
  if (!newTitle.value.trim())   { addDocErr.value = 'Title is required.';   return }
  if (!newContent.value.trim()) { addDocErr.value = 'Content is required.'; return }
  addingDoc.value = true
  try {
    const doc = await api.post<KnowledgeDoc>('/defendcore/documents', {
      title: newTitle.value.trim(), content: newContent.value.trim(),
    })
    docs.value.unshift(doc)
    newTitle.value = ''; newContent.value = ''
    docsMsg.value = 'Document indexed.'
    setTimeout(() => { docsMsg.value = '' }, 3000)
  } catch (e) { addDocErr.value = e instanceof Error ? e.message : 'Failed.' }
  finally { addingDoc.value = false }
}

async function openDocViewer(id: string) {
  viewLoading.value = true
  try { viewDoc.value = await api.get<{ title: string; chunks: string[] }>(`/defendcore/documents/${id}/chunks`) }
  catch (e) { docsErr.value = e instanceof Error ? e.message : 'Failed.' }
  finally { viewLoading.value = false }
}

async function deleteDoc(id: string) {
  if (!confirm('Remove this document from the knowledge base?')) return
  try {
    await api.del(`/defendcore/documents/${id}`)
    docs.value = docs.value.filter(d => d.id !== id)
    docsMsg.value = 'Removed.'
    setTimeout(() => { docsMsg.value = '' }, 3000)
  } catch (e) { docsErr.value = e instanceof Error ? e.message : 'Failed.' }
}

async function reindex() {
  if (!confirm('Re-index all documents?')) return
  reindexing.value = true
  try { await api.post('/defendcore/documents/reindex', {}); docsMsg.value = 'Re-indexed.' }
  catch (e) { docsErr.value = e instanceof Error ? e.message : 'Failed.' }
  finally   { reindexing.value = false }
}

// ── Web Crawl ──────────────────────────────────────────────────────────────
const crawlUrl    = ref('')
const crawlTitle  = ref('')
const crawlMsg    = ref('')
const crawlMsgOk  = ref(true)
const crawling    = ref(false)

async function runCrawl() {
  crawlMsg.value = ''
  const url = crawlUrl.value.trim()
  if (!url) return
  if (!/^https?:\/\//.test(url)) { crawlMsg.value = 'URL must start with http:// or https://'; crawlMsgOk.value = false; return }
  crawling.value = true
  try {
    const doc = await api.post<KnowledgeDoc>('/defendcore/documents/crawl', {
      url, title: crawlTitle.value.trim() || undefined,
    })
    flash(crawlMsg, crawlMsgOk, `Crawled and indexed "${doc.title}" (${fmtSize(doc.chunkCount)}).`, true)
    crawlUrl.value = ''; crawlTitle.value = ''
    if (docs.value.length) docs.value.unshift(doc)
  } catch (e) {
    flash(crawlMsg, crawlMsgOk, e instanceof Error ? e.message : 'Crawl failed.', false)
  } finally { crawling.value = false }
}

// ── File Upload ────────────────────────────────────────────────────────────
const uploadTitle    = ref('')
const uploadFiles    = ref<File[]>([])
const uploadMsg      = ref('')
const uploadMsgOk    = ref(true)
const uploading      = ref(false)
const uploadProgress = ref(0)

const ACCEPTED_TYPES = '.txt,.md,.csv,.pdf,.docx,.doc'

function onFilePick(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  uploadFiles.value = [...uploadFiles.value, ...Array.from(files)]
}

function removeFile(i: number) { uploadFiles.value.splice(i, 1) }

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext === 'pdf' ? FileText : FileCode
}

function fileLabel(f: File) {
  const kb = (f.size / 1024).toFixed(0)
  return `${f.name} · ${kb} KB`
}

async function uploadAll() {
  if (!uploadFiles.value.length) return
  uploading.value = true; uploadProgress.value = 0; uploadMsg.value = ''
  const total = uploadFiles.value.length
  let done = 0; let failed = 0

  for (const file of uploadFiles.value) {
    try {
      const base64 = await fileToBase64(file)
      await api.post<KnowledgeDoc>('/defendcore/documents/upload', {
        filename: file.name,
        content: base64,
        contentType: file.type,
        title: uploadTitle.value.trim() || undefined,
      })
      done++
    } catch { failed++ }
    uploadProgress.value = Math.round(((done + failed) / total) * 100)
  }

  uploading.value = false
  if (failed === 0) {
    flash(uploadMsg, uploadMsgOk, `${done} file${done !== 1 ? 's' : ''} indexed successfully.`, true)
    uploadFiles.value = []; uploadTitle.value = ''
    if (activeTab.value === 'knowledge') await fetchDocs()
  } else {
    flash(uploadMsg, uploadMsgOk, `${done} indexed, ${failed} failed. Check file formats.`, false)
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
  })
}

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(fetchConfig)
watch(activeTab, t => { if (t === 'knowledge') fetchDocs() })
</script>

<template>
  <div class="max-w-6xl mx-auto">

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <Database class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
        <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin</p>
      </div>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">DefendCore</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">
        Security knowledge base engine. Index documents, crawl URLs, and upload files (PDF, DOCX, TXT, MD).
        Desktop AI models fetch relevant chunks and use them as context — no LLM runs server-side.
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6 rounded-xl p-1 flex-wrap" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);width:fit-content;">
      <button v-for="(label, key) in ({
        config: 'Configuration', knowledge: 'Documents', crawl: 'Web Crawl', upload: 'File Upload'
      } as Record<Tab,string>)"
        :key="key"
        class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
        :style="activeTab === key
          ? 'background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.28);color:rgba(167,139,250,0.90);'
          : 'color:rgba(255,255,255,0.38);'"
        @click="activeTab = key as Tab">
        <Settings v-if="key === 'config'" class="h-3.5 w-3.5" />
        <BookOpen v-else-if="key === 'knowledge'" class="h-3.5 w-3.5" />
        <Globe   v-else-if="key === 'crawl'"     class="h-3.5 w-3.5" />
        <Upload  v-else                           class="h-3.5 w-3.5" />
        {{ label }}
      </button>
    </div>

    <!-- ============================================================== -->
    <!-- Configuration                                                   -->
    <!-- ============================================================== -->
    <div v-if="activeTab === 'config'">
      <div v-if="configLoading" class="space-y-2">
        <div v-for="i in 2" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
      </div>
      <div v-else class="max-w-xl space-y-5">

        <div class="rounded-xl p-5" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.80);">Ready for Vindicter Desktop</p>
              <p class="mt-1 text-[11px] leading-relaxed" style="color:rgba(255,255,255,0.35);">
                When on, desktop users see the "Enhance with Knowledge Base" toggle in AI scans and Academy lessons.
                When off, the toggle is disabled and the <code class="px-1 rounded" style="background:rgba(255,255,255,0.08);font-size:10px;">/retrieve</code> endpoint returns 503.
              </p>
            </div>
            <div
              class="relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer select-none overflow-hidden"
              :style="desktopEnabled ? 'background:rgba(35,165,90,0.70);' : 'background:rgba(255,255,255,0.12);'"
              @click="desktopEnabled = !desktopEnabled">
              <span class="absolute top-[2px] h-5 w-5 rounded-full transition-all duration-200"
                :style="desktopEnabled ? 'left:22px;background:white;' : 'left:2px;background:rgba(255,255,255,0.55);'" />
            </div>
          </div>
        </div>

        <!-- Architecture note -->
        <div class="rounded-xl p-4 space-y-2" style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.14);">
          <p class="text-[11px] font-semibold" style="color:rgba(167,139,250,0.80);">How RAG retrieval works</p>
          <div class="space-y-2">
            <div v-for="(step,i) in [
              'Index your security knowledge (CVEs, OWASP, playbooks, threat intel)',
              'Desktop fetches top-matching chunks via POST /api/v1/defendcore/retrieve',
              'Chunks are prepended to the prompt sent to Claude, Codex, OpenRouter, or Ollama',
              'The local model reasons over your knowledge base without any server-side LLM call',
            ]" :key="i" class="flex items-start gap-2.5">
              <span class="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold" style="background:rgba(139,92,246,0.15);color:rgba(167,139,250,0.80);">{{ i+1 }}</span>
              <p class="text-[11px] leading-relaxed" style="color:rgba(255,255,255,0.38);">{{ step }}</p>
            </div>
          </div>
        </div>

        <div v-if="configMsg" class="rounded-xl px-4 py-2.5 text-[12px]"
          :style="configMsgOk ? 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);' : 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);'">{{ configMsg }}</div>

        <button :disabled="configSaving" @click="saveConfig"
          class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
          style="background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.90);">
          <Loader2 v-if="configSaving" class="h-3.5 w-3.5 animate-spin" />
          Save Configuration
        </button>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- Documents                                                        -->
    <!-- ============================================================== -->
    <div v-else-if="activeTab === 'knowledge'">
      <div v-if="docsMsg" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">{{ docsMsg }}</div>
      <div v-if="docsErr" class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">{{ docsErr }}</div>

      <div class="grid gap-5 lg:grid-cols-[1fr_360px]">
        <!-- List -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.75);">
              Indexed Documents
              <span v-if="docs.length" class="ml-2 rounded-full px-2 py-0.5 text-[10px]" style="background:rgba(139,92,246,0.15);color:rgba(167,139,250,0.70);">{{ docs.length }}</span>
            </p>
            <div class="flex gap-2">
              <button :disabled="docsLoading" @click="fetchDocs" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] cursor-pointer hover:bg-white/[0.06]" style="border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);">
                <RefreshCw class="h-3 w-3" :class="docsLoading ? 'animate-spin' : ''" /> Refresh
              </button>
              <button :disabled="reindexing" @click="reindex" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer disabled:opacity-50" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);">
                <Loader2 v-if="reindexing" class="h-3 w-3 animate-spin" /><RefreshCw v-else class="h-3 w-3" /> Reindex
              </button>
            </div>
          </div>
          <div v-if="docsLoading" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-14 rounded-xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
          </div>
          <div v-else-if="!docs.length" class="rounded-xl px-5 py-14 text-center" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
            <BookOpen class="h-8 w-8 mx-auto mb-3" style="color:rgba(255,255,255,0.12);" />
            <p class="text-[12px]" style="color:rgba(255,255,255,0.25);">No documents yet. Add text, crawl a URL, or upload a file.</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="doc in docs" :key="doc.id"
              class="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);">
              <div class="min-w-0">
                <p class="font-medium truncate text-[13px]" style="color:rgba(255,255,255,0.80);">{{ doc.title }}</p>
                <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.28);">{{ fmtSize(doc.chunkCount) }} · {{ fmtDate(doc.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button @click="openDocViewer(doc.id)" class="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/[0.07]" style="color:rgba(139,92,246,0.60);" title="View chunks"><Eye class="h-3.5 w-3.5" /></button>
                <button @click="deleteDoc(doc.id)"    class="h-7 w-7 flex items-center justify-center rounded-lg cursor-pointer hover:bg-red-500/10" style="color:rgba(248,113,113,0.40);" title="Remove"><Trash2 class="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Manual text add -->
        <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center gap-2">
            <Plus class="h-4 w-4" style="color:rgba(139,92,246,0.65);" />
            <p class="text-[12px] font-semibold" style="color:rgba(255,255,255,0.70);">Add Text Document</p>
          </div>
          <div>
            <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Title</label>
            <input v-model="newTitle" placeholder="e.g. OWASP Top 10 2024" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          </div>
          <div>
            <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Content</label>
            <textarea v-model="newContent" rows="8" placeholder="Paste CVE descriptions, playbooks, threat intel..." class="w-full resize-y rounded-xl px-3 py-2 text-[12px] leading-6 text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
          </div>
          <p v-if="addDocErr" class="text-[11px]" style="color:rgba(242,63,66,0.80);">{{ addDocErr }}</p>
          <button :disabled="addingDoc" @click="addDoc" class="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50" style="background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.90);">
            <Loader2 v-if="addingDoc" class="h-3.5 w-3.5 animate-spin" /><Plus v-else class="h-3.5 w-3.5" />
            Index Document
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- Web Crawl                                                        -->
    <!-- ============================================================== -->
    <div v-else-if="activeTab === 'crawl'" class="max-w-2xl space-y-5">
      <div class="rounded-xl p-4" style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.14);">
        <div class="flex items-start gap-2">
          <Globe class="h-3.5 w-3.5 shrink-0 mt-0.5" style="color:rgba(129,140,248,0.60);" />
          <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.42);">
            Crawl a public URL — the page text is extracted, chunked, and indexed. Useful for NVD CVE pages, OWASP guides, vendor advisories, and public security writeups.
          </p>
        </div>
      </div>

      <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">URL to Crawl</label>
          <input v-model="crawlUrl" placeholder="https://owasp.org/www-project-top-ten/" class="w-full rounded-xl px-3 py-2.5 font-mono text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" @keydown.enter="runCrawl" />
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Document Title <span style="color:rgba(255,255,255,0.18);">(optional — defaults to URL)</span></label>
          <input v-model="crawlTitle" placeholder="e.g. OWASP Top 10 2024" class="w-full rounded-xl px-3 py-2.5 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" @keydown.enter="runCrawl" />
        </div>

        <div v-if="crawlMsg" class="rounded-xl px-4 py-2.5 text-[12px]"
          :style="crawlMsgOk ? 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);' : 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);'">{{ crawlMsg }}</div>

        <button :disabled="crawling || !crawlUrl.trim()" @click="runCrawl"
          class="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
          style="background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.30);color:rgba(129,140,248,0.90);">
          <Loader2 v-if="crawling" class="h-3.5 w-3.5 animate-spin" /><Link v-else class="h-3.5 w-3.5" />
          {{ crawling ? 'Crawling…' : 'Crawl & Index' }}
        </button>
      </div>

      <div class="rounded-xl p-4" style="background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.12);">
        <div class="flex items-start gap-2">
          <AlertTriangle class="h-3.5 w-3.5 shrink-0 mt-0.5" style="color:rgba(251,191,36,0.55);" />
          <div class="text-[11px] leading-relaxed space-y-1" style="color:rgba(255,255,255,0.38);">
            <p>Only crawls the given URL — does not follow links. For multi-page sites, crawl each page individually.</p>
            <p>Pages behind authentication, Cloudflare, or JavaScript-rendered SPAs may not extract cleanly.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- File Upload                                                      -->
    <!-- ============================================================== -->
    <div v-else-if="activeTab === 'upload'" class="max-w-2xl space-y-5">
      <div class="rounded-xl p-4" style="background:rgba(35,165,90,0.06);border:1px solid rgba(35,165,90,0.14);">
        <div class="flex items-start gap-2">
          <Upload class="h-3.5 w-3.5 shrink-0 mt-0.5" style="color:rgba(34,197,94,0.60);" />
          <p class="text-[12px] leading-relaxed" style="color:rgba(255,255,255,0.42);">
            Upload and index documents in PDF, DOCX, DOC, TXT, MD, or CSV format. Files are parsed server-side — text is extracted, chunked, and stored. Original files are not retained.
          </p>
        </div>
      </div>

      <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.08);">

        <!-- Drop zone -->
        <label class="flex flex-col items-center justify-center gap-2 rounded-xl py-8 cursor-pointer transition-colors hover:bg-white/[0.04]"
          style="background:rgba(255,255,255,0.02);border:2px dashed rgba(139,92,246,0.28);">
          <Upload class="h-7 w-7" style="color:rgba(139,92,246,0.45);" />
          <p class="text-[12px]" style="color:rgba(255,255,255,0.50);">Click to browse files</p>
          <p class="text-[10px]" style="color:rgba(255,255,255,0.22);">PDF, DOCX, DOC, TXT, MD, CSV</p>
          <input type="file" :accept="ACCEPTED_TYPES" multiple class="hidden" @change="onFilePick" />
        </label>

        <!-- Optional title override -->
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="color:rgba(255,255,255,0.30);">Document Title Override <span style="color:rgba(255,255,255,0.18);">(optional — defaults to filename)</span></label>
          <input v-model="uploadTitle" placeholder="Leave blank to use filename" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);" />
        </div>

        <!-- File queue -->
        <div v-if="uploadFiles.length" class="space-y-1.5">
          <p class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color:rgba(255,255,255,0.25);">Files to upload ({{ uploadFiles.length }})</p>
          <div v-for="(f,i) in uploadFiles" :key="i"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2"
            style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);">
            <component :is="fileIcon(f.name)" class="h-3.5 w-3.5 shrink-0" style="color:rgba(139,92,246,0.55);" />
            <p class="flex-1 min-w-0 truncate text-[11px]" style="color:rgba(255,255,255,0.65);">{{ fileLabel(f) }}</p>
            <button @click="removeFile(i)" class="h-5 w-5 flex items-center justify-center rounded cursor-pointer hover:bg-red-500/10" style="color:rgba(248,113,113,0.40);"><X class="h-3 w-3" /></button>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="uploading" class="rounded-lg overflow-hidden" style="background:rgba(255,255,255,0.06);">
          <div class="h-1.5 transition-all duration-300" :style="`width:${uploadProgress}%;background:rgba(139,92,246,0.70);`" />
        </div>

        <div v-if="uploadMsg" class="rounded-xl px-4 py-2.5 text-[12px]"
          :style="uploadMsgOk ? 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);' : 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);'">{{ uploadMsg }}</div>

        <button :disabled="uploading || !uploadFiles.length" @click="uploadAll"
          class="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
          style="background:rgba(35,165,90,0.18);border:1px solid rgba(35,165,90,0.28);color:rgba(34,197,94,0.90);">
          <Loader2 v-if="uploading" class="h-3.5 w-3.5 animate-spin" /><Upload v-else class="h-3.5 w-3.5" />
          {{ uploading ? `Uploading… ${uploadProgress}%` : `Upload & Index ${uploadFiles.length || ''} File${uploadFiles.length !== 1 ? 's' : ''}` }}
        </button>
      </div>
    </div>

  </div>

  <!-- Document Viewer Modal -->
  <Teleport to="body">
    <div v-if="viewDoc || viewLoading" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.75);" @click.self="viewDoc = null">
      <div class="w-full max-w-2xl rounded-2xl overflow-hidden" style="background:#16171a;border:1px solid rgba(255,255,255,0.10);max-height:80vh;display:flex;flex-direction:column;">
        <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center gap-2">
            <BookOpen class="h-4 w-4" style="color:rgba(139,92,246,0.65);" />
            <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.85);">{{ viewDoc?.title ?? 'Loading…' }}</p>
          </div>
          <button @click="viewDoc = null" class="cursor-pointer" style="color:rgba(255,255,255,0.30);"><X class="h-4 w-4" /></button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3" style="scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.08) transparent;">
          <div v-if="viewLoading" class="space-y-2">
            <div v-for="i in 4" :key="i" class="h-10 rounded-lg animate-pulse" style="background:rgba(255,255,255,0.04);" />
          </div>
          <div v-else-if="viewDoc">
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-3" style="color:rgba(255,255,255,0.25);">{{ viewDoc.chunks.length }} chunk{{ viewDoc.chunks.length !== 1 ? 's' : '' }}</p>
            <div v-for="(chunk,i) in viewDoc.chunks" :key="i" class="rounded-lg px-3 py-3 text-[12px] leading-relaxed" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.70);white-space:pre-wrap;">{{ chunk }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
