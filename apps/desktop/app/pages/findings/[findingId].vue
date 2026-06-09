<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  FileCode,
  FolderOpen,
  Loader2,
  MapPin,
  ShieldAlert,
  Tag,
  Terminal,
} from 'lucide-vue-next'
import type { SecurityFindingStatus } from '~/types/vindicta'

const route = useRoute()
const projects = useProjectsStore()
const security = useSecurityStore()

const loading = ref(true)

const findingId = computed(() => decodeURIComponent(route.params.findingId as string))
const projectId = computed(() => String(route.query.project ?? ''))
const scanId = computed(() => route.query.scan ? String(route.query.scan) : null)
const project = computed(() => projects.projects.find(item => item.id === projectId.value) ?? projects.activeProject ?? null)
const scan = computed(() => scanId.value ? security.scans.find(item => item.id === scanId.value) ?? null : null)
const scanFinding = computed(() => scan.value?.findings.find(item => item.id === findingId.value) ?? null)
const remediationFinding = computed(() => security.findings.find(item => item.id === findingId.value) ?? null)
const finding = computed(() => remediationFinding.value ?? scanFinding.value)
const statusOptions: SecurityFindingStatus[] = ['open', 'triaged', 'in_progress', 'resolved', 'ignored']

const severityConfig: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  critical: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-300', icon: 'text-red-400' },
  high:     { border: 'border-orange-500/25', bg: 'bg-orange-500/10', text: 'text-orange-300', icon: 'text-orange-400' },
  medium:   { border: 'border-amber-500/25', bg: 'bg-amber-500/10', text: 'text-amber-300', icon: 'text-amber-400' },
  low:      { border: 'border-sky-500/25', bg: 'bg-sky-500/10', text: 'text-sky-300', icon: 'text-sky-400' },
}
const sevCfg = computed(() => severityConfig[finding.value?.severity ?? ''] ?? { border: 'border-white/10', bg: 'bg-white/[0.04]', text: 'text-[var(--text-muted)]', icon: 'text-[var(--text-faint)]' })

const statusConfig: Record<SecurityFindingStatus, string> = {
  open: 'text-red-300',
  triaged: 'text-amber-300',
  in_progress: 'text-indigo-300',
  resolved: 'text-emerald-300',
  ignored: 'text-[var(--text-faint)]',
}

const backTarget = computed(() => {
  if (!project.value) return '/'
  return remediationFinding.value
    ? `/projects/${project.value.id}?tab=findings`
    : `/projects/${project.value.id}?tab=scanner`
})

// ── Evidence parsing ────────────────────────────────────────────────────────

interface EvidenceBlock {
  type: 'text' | 'code' | 'location'
  content: string
  lang?: string
  file?: string
  line?: string
}

// Patterns for file path detection: src/file.ts:42, ./path/to/file.py, /abs/path
const FILE_PATH_RE = /(?:(?:\.\.?\/|\/)?(?:[\w.-]+\/)+[\w.-]+\.\w{1,6})(?::(\d+(?:-\d+)?))?\b/g
// Fenced code block: ```lang\n...\n```
const CODE_FENCE_RE = /```(\w*)\n([\s\S]*?)```/g

const locationChips = computed(() => {
  if (!finding.value?.evidence) return []
  const found = new Map<string, string>()
  let m: RegExpExecArray | null
  FILE_PATH_RE.lastIndex = 0
  while ((m = FILE_PATH_RE.exec(finding.value.evidence)) !== null) {
    const path = m[0].replace(/:(\d+(?:-\d+)?)$/, '')
    const line = m[1] ?? ''
    if (!found.has(path)) found.set(path, line)
  }
  return [...found.entries()].map(([file, line]) => ({ file, line })).slice(0, 12)
})

const evidenceBlocks = computed((): EvidenceBlock[] => {
  const raw = finding.value?.evidence ?? ''
  if (!raw) return [{ type: 'text', content: 'No evidence was captured for this finding.' }]

  const blocks: EvidenceBlock[] = []
  let lastIndex = 0
  CODE_FENCE_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = CODE_FENCE_RE.exec(raw)) !== null) {
    if (m.index > lastIndex) {
      blocks.push({ type: 'text', content: raw.slice(lastIndex, m.index).trim() })
    }
    blocks.push({ type: 'code', content: m[2]!.trimEnd(), lang: m[1] || 'text' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < raw.length) {
    blocks.push({ type: 'text', content: raw.slice(lastIndex).trim() })
  }
  return blocks.filter(b => b.content)
})

// Lightweight syntax highlighting — keyword + string + comment tokens
function highlight(code: string, lang: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escaped = esc(code)

  if (!lang || lang === 'text' || lang === 'plain') return escaped

  // Tokenize: split by string literals, comments, then keywords
  const PATTERNS: [RegExp, string][] = [
    [/\/\/[^\n]*/g, 'cmt'],                              // single-line //
    [/\/\*[\s\S]*?\*\//g, 'cmt'],                        // block /* */
    [/#[^\n]*/g, 'cmt'],                                 // Python # comment
    [/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, 'str'], // strings
    [/\b(import|from|export|default|const|let|var|function|class|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|async|await|try|catch|finally|throw|void|null|undefined|true|false|this|super|extends|implements|interface|type|enum|namespace|module|declare|as|in|of|yield|static|public|private|protected|abstract|readonly|override|def|print|pass|lambda|with|assert|raise|except|finally|elif|and|or|not|is|None|True|False|fn|let|mut|pub|use|mod|impl|struct|trait|enum|where|self|match|if let|while let|dyn|Box|Arc|Rc|String|Vec|HashMap|Option|Result|Ok|Err|Some)\b/g, 'kw'],
    [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, 'num'],
  ]

  type Token = { start: number; end: number; kind: string }
  const tokens: Token[] = []

  for (const [re, kind] of PATTERNS) {
    re.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(escaped)) !== null) {
      tokens.push({ start: match.index, end: match.index + match[0].length, kind })
    }
  }

  // Sort; drop overlapping tokens
  tokens.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Token[] = []
  let cursor = 0
  for (const tok of tokens) {
    if (tok.start < cursor) continue
    merged.push(tok)
    cursor = tok.end
  }

  const COLOR: Record<string, string> = {
    kw: '#c792ea',  str: '#c3e88d',  cmt: '#546e7a',  num: '#f78c6c',
  }

  let out = ''
  let pos = 0
  for (const tok of merged) {
    if (tok.start > pos) out += escaped.slice(pos, tok.start)
    out += `<span style="color:${COLOR[tok.kind]}">${escaped.slice(tok.start, tok.end)}</span>`
    pos = tok.end
  }
  out += escaped.slice(pos)
  return out
}

onMounted(async () => {
  try {
    if (!projects.projects.length) await projects.loadProjects()
    if (project.value) {
      projects.setActive(project.value.id)
      if (project.value.absolutePath) {
        await security.load(project.value.absolutePath, project.value.id)
      }
    }
  }
  finally {
    loading.value = false
  }
})

watch(() => project.value?.id, async (id) => {
  if (id && project.value?.absolutePath) {
    await security.load(project.value.absolutePath, project.value.id)
  }
})

async function updateStatus(value: SecurityFindingStatus) {
  if (!remediationFinding.value) return
  await security.updateFindingStatus(remediationFinding.value.id, value)
}

function extFromPath(file: string) {
  return file.split('.').pop() ?? ''
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 pb-10">
    <!-- Back link -->
    <NuxtLink
      :to="backTarget"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
    >
      <ArrowLeft class="size-3.5" />
      Back to {{ remediationFinding ? 'findings' : 'scanner' }}
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <Loader2 class="size-5 animate-spin text-indigo-300" />
    </div>

    <template v-else-if="finding">

      <!-- ── Header card ─────────────────────────────────────────────────── -->
      <div class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">

        <!-- Severity strip -->
        <div class="h-1 w-full" :class="{
          'bg-gradient-to-r from-red-500 to-red-400': finding.severity === 'critical',
          'bg-gradient-to-r from-orange-500 to-amber-400': finding.severity === 'high',
          'bg-gradient-to-r from-amber-500 to-yellow-400': finding.severity === 'medium',
          'bg-gradient-to-r from-sky-500 to-cyan-400': finding.severity === 'low',
          'bg-[var(--border)]': !['critical','high','medium','low'].includes(finding.severity),
        }" />

        <div class="p-5">
          <!-- Badges row -->
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              :class="[sevCfg.border, sevCfg.bg, sevCfg.text]"
            >
              <ShieldAlert class="size-3" />
              {{ finding.severity }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
              <Tag class="size-3" />
              {{ finding.category }}
            </span>
            <span class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-[var(--text-muted)]">
              <Terminal class="size-3" />
              {{ finding.source.replace(/_/g, ' ') }}
            </span>
            <span class="font-mono text-[10px] text-[var(--text-faint)]">
              {{ remediationFinding ? `SEC-${remediationFinding.number}` : finding.id.slice(0, 8) }}
            </span>

            <!-- Status picker (remediation items only) -->
            <GlassSelect
              v-if="remediationFinding"
              class="ml-auto w-32"
              :value="remediationFinding.status"
              @change="updateStatus(($event.target as HTMLSelectElement).value as SecurityFindingStatus)"
            >
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status.replace(/_/g, ' ') }}</option>
            </GlassSelect>
          </div>

          <!-- Title -->
          <h1 class="mt-4 text-2xl font-bold tracking-tight text-[var(--text)]">{{ finding.title }}</h1>
          <p class="mt-2 break-words text-sm leading-relaxed text-[var(--text-muted)]">{{ finding.detail }}</p>

          <!-- Location chips (parsed from evidence) -->
          <div v-if="locationChips.length" class="mt-4 flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-[10px] font-medium text-[var(--text-faint)] uppercase tracking-wide">Locations</span>
            <span
              v-for="loc in locationChips"
              :key="loc.file + loc.line"
              class="inline-flex items-center gap-1 rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] text-indigo-300"
            >
              <FileCode class="size-3 shrink-0" />
              {{ loc.file }}<span v-if="loc.line" class="text-indigo-400/60">:{{ loc.line }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- ── Main + sidebar ──────────────────────────────────────────────── -->
      <div class="grid gap-4 lg:grid-cols-[1fr_17rem]">

        <!-- Main content -->
        <main class="space-y-4 min-w-0">

          <!-- Evidence -->
          <div class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div class="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <Code2 class="size-3.5 text-indigo-300" />
              <h2 class="text-xs font-semibold text-[var(--text)]">Evidence</h2>
              <span v-if="evidenceBlocks.some(b => b.type === 'code')" class="ml-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">code found</span>
            </div>

            <div class="divide-y divide-[var(--border)]">
              <template v-for="(block, idx) in evidenceBlocks" :key="idx">
                <!-- Code block -->
                <div v-if="block.type === 'code'" class="relative">
                  <div class="flex items-center gap-2 border-b border-[var(--border)]/50 bg-black/20 px-4 py-1.5">
                    <FileCode class="size-3 text-emerald-400" />
                    <span class="font-mono text-[10px] text-[var(--text-faint)]">{{ block.lang || 'code' }}</span>
                  </div>
                  <!-- GitHub-style line numbers + code -->
                  <div class="overflow-x-auto custom-scroll">
                    <table class="min-w-full border-collapse text-xs leading-5">
                      <tbody>
                        <tr
                          v-for="(line, lineIdx) in block.content.split('\n')"
                          :key="lineIdx"
                          class="hover:bg-indigo-500/[0.04]"
                        >
                          <td class="select-none border-r border-[var(--border)]/40 bg-black/20 px-3 py-0.5 text-right font-mono text-[10px] text-[var(--text-faint)] w-10 shrink-0">
                            {{ lineIdx + 1 }}
                          </td>
                          <td class="px-4 py-0.5 font-mono whitespace-pre text-[var(--text)]" v-html="highlight(line, block.lang ?? '')" />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Text block -->
                <div v-else class="px-4 py-3">
                  <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--text-muted)]">{{ block.content }}</p>
                </div>
              </template>
            </div>
          </div>

          <!-- Recommendation -->
          <div class="overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/[0.05]">
            <div class="flex items-center gap-2 border-b border-indigo-500/15 px-4 py-3">
              <CheckCircle2 class="size-3.5 text-indigo-300" />
              <h2 class="text-xs font-semibold text-[var(--text)]">Recommended Remediation</h2>
            </div>
            <div class="px-4 py-3">
              <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-muted)]">{{ finding.recommendation || 'No recommendation was captured for this finding.' }}</p>
            </div>
          </div>
        </main>

        <!-- Sidebar -->
        <aside class="space-y-3">

          <!-- Severity detail card -->
          <div class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div class="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Severity</span>
              <AlertTriangle class="size-3 shrink-0" :class="sevCfg.icon" />
            </div>
            <div class="px-3 py-2.5">
              <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize" :class="[sevCfg.border, sevCfg.bg, sevCfg.text]">
                {{ finding.severity }}
              </span>
            </div>
          </div>

          <!-- Metadata card -->
          <div class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div class="border-b border-[var(--border)] px-3 py-2.5">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Details</span>
            </div>
            <div class="divide-y divide-[var(--border)]">
              <div class="flex items-start gap-2 px-3 py-2.5">
                <MapPin class="size-3.5 mt-0.5 shrink-0 text-[var(--text-faint)]" />
                <div class="min-w-0">
                  <p class="text-[10px] text-[var(--text-faint)]">Area</p>
                  <p class="mt-0.5 break-words text-xs text-[var(--text-muted)]">{{ finding.area }}</p>
                </div>
              </div>
              <div v-if="project" class="flex items-start gap-2 px-3 py-2.5">
                <FolderOpen class="size-3.5 mt-0.5 shrink-0 text-amber-400/70" />
                <div class="min-w-0">
                  <p class="text-[10px] text-[var(--text-faint)]">Project</p>
                  <p class="mt-0.5 break-words text-xs text-[var(--text-muted)]">{{ project.name }}</p>
                </div>
              </div>
              <div v-if="scan" class="flex items-start gap-2 px-3 py-2.5">
                <Clock class="size-3.5 mt-0.5 shrink-0 text-[var(--text-faint)]" />
                <div class="min-w-0">
                  <p class="text-[10px] text-[var(--text-faint)]">Scanned</p>
                  <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ new Date(scan.scannedAt).toLocaleString() }}</p>
                </div>
              </div>
              <div v-if="remediationFinding" class="flex items-start gap-2 px-3 py-2.5">
                <Clock class="size-3.5 mt-0.5 shrink-0 text-[var(--text-faint)]" />
                <div class="min-w-0">
                  <p class="text-[10px] text-[var(--text-faint)]">Added to queue</p>
                  <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ new Date(remediationFinding.createdAt).toLocaleString() }}</p>
                </div>
              </div>
              <div v-if="remediationFinding?.resolvedAt" class="flex items-start gap-2 px-3 py-2.5 bg-emerald-500/[0.04]">
                <CheckCircle2 class="size-3.5 mt-0.5 shrink-0 text-emerald-400" />
                <div class="min-w-0">
                  <p class="text-[10px] text-emerald-500/70">Resolved</p>
                  <p class="mt-0.5 text-xs text-emerald-300">{{ new Date(remediationFinding.resolvedAt).toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Location files (sidebar list) -->
          <div v-if="locationChips.length" class="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <div class="border-b border-[var(--border)] px-3 py-2.5">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">Affected Files</span>
            </div>
            <div class="divide-y divide-[var(--border)]">
              <div v-for="loc in locationChips" :key="loc.file + loc.line" class="flex items-center gap-2 px-3 py-2">
                <FileCode class="size-3 shrink-0 text-indigo-400" />
                <span class="min-w-0 truncate font-mono text-[10px] text-[var(--text-muted)]">{{ loc.file }}</span>
                <span v-if="loc.line" class="ml-auto shrink-0 rounded bg-indigo-500/10 px-1 font-mono text-[10px] text-indigo-400">:{{ loc.line }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

    </template>

    <!-- Not found -->
    <section v-else class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-14 text-center">
      <p class="text-sm text-[var(--text-muted)]">Finding not found. It may have been removed or the link is invalid.</p>
      <NuxtLink :to="backTarget" class="mt-3 inline-block text-xs text-indigo-400 hover:text-indigo-300">
        Back to project
      </NuxtLink>
    </section>
  </div>
</template>
