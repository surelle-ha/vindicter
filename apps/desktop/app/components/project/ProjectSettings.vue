<script setup lang="ts">
import { AlertTriangle, Check, Copy, ExternalLink, Eye, EyeOff, GripVertical, Plus, ShieldOff, Swords, Trash2 } from 'lucide-vue-next'
import type { AIToolSlug, KanbanColumn, Role } from '~/types/vindicta'
import { DEFAULT_KANBAN_COLUMNS, DEFAULT_ROLES } from '~/types/vindicta'
import { generateId } from '~/utils/id'

const props = defineProps<{ projectPath: string }>()

const { read, patchSettings, patchMeta, appendHistory, resetProjectData } = useVindicterJson()
const kanban = useKanbanStore()
const sprintStore = useSprintStore()
const projects = useProjectsStore()
const router = useRouter()
const { notify } = useNotifications()

const activeTab = ref<'general' | 'board' | 'roles' | 'pentest' | 'danger'>('general')
const visibleTabs = [
  { id: 'general', label: 'General' },
  { id: 'pentest', label: 'Pentest' },
  { id: 'danger', label: 'Danger Zone' },
]

const project = computed(() => projects.activeProject)
const aiToolNames: Record<AIToolSlug, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  copilot: 'GitHub Copilot',
  codeium: 'Codeium',
  other: 'Other',
}
const projectAITools = computed(() => {
  const p = project.value
  if (!p) return []
  const tools = p.aiTools?.length ? p.aiTools : [p.aiTool]
  return [...new Set(tools)].map(tool => aiToolNames[tool] ?? tool)
})

// General
const nameDraft = ref('')
const descDraft = ref('')
const saving = ref(false)
const codeCopied = ref(false)

watch(project, (p) => {
  if (p) {
    nameDraft.value = p.name
    descDraft.value = p.description ?? ''
  }
}, { immediate: true })

async function saveGeneral() {
  if (!project.value || !nameDraft.value.trim()) return
  saving.value = true
  try {
    await patchMeta(props.projectPath, { name: nameDraft.value.trim(), description: descDraft.value })
    await appendHistory(props.projectPath, {
      action: 'project:updated',
      actor: 'local',
      payload: { name: nameDraft.value.trim() },
    }).catch(() => {})
    await projects.updateProjectMeta(project.value.id, { name: nameDraft.value.trim(), description: descDraft.value })
    notify('Project settings saved', 'success')
  }
  finally {
    saving.value = false
  }
}

function copyCode() {
  if (!project.value?.code) return
  navigator.clipboard.writeText(project.value.code)
  codeCopied.value = true
  setTimeout(() => (codeCopied.value = false), 1500)
}

// Board
const columns = ref<KanbanColumn[]>([])
const boardSaving = ref(false)

// Roles
const roles = ref<Role[]>([])
const newRoleName = ref('')
const newRoleColor = ref('#6366f1')

onMounted(async () => {
  try {
    const data = await read(props.projectPath)
    columns.value = [...(data.settings?.kanbanColumns ?? DEFAULT_KANBAN_COLUMNS)]
      .sort((a, b) => a.order - b.order)
    roles.value = [...(data.settings?.roles ?? DEFAULT_ROLES)]
  }
  catch {
    columns.value = [...DEFAULT_KANBAN_COLUMNS]
    roles.value = [...DEFAULT_ROLES]
  }
})

function moveColumn(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= columns.value.length) return
  const arr = [...columns.value]
  const tmp = arr[index]!; arr[index] = arr[target]!; arr[target] = tmp
  arr.forEach((c, i) => (c.order = i))
  columns.value = arr
}

function toggleColumn(id: string) {
  const col = columns.value.find((c) => c.id === id)
  if (col) col.visible = !col.visible
}

async function saveBoard() {
  boardSaving.value = true
  try {
    await patchSettings(props.projectPath, { kanbanColumns: columns.value, roles: roles.value })
    notify('Board settings saved', 'success')
  }
  finally {
    boardSaving.value = false
  }
}

function addRole() {
  if (!newRoleName.value.trim()) return
  roles.value.push({ id: generateId(), name: newRoleName.value.trim(), color: newRoleColor.value })
  newRoleName.value = ''
}

function removeRole(id: string) {
  roles.value = roles.value.filter((r) => r.id !== id)
}

async function saveRoles() {
  boardSaving.value = true
  try {
    await patchSettings(props.projectPath, { kanbanColumns: columns.value, roles: roles.value })
    notify('Roles saved', 'success')
  }
  finally {
    boardSaving.value = false
  }
}

// Pentest settings
const showPentestModal = ref(false)         // full opt-in modal (when not yet enabled)
const showChangePentestUrlModal = ref(false) // URL-change modal (when already enabled)
const pentestUrlDraft = ref('')
const pentestSaving = ref(false)
const pentestDisabling = ref(false)

const pentestEnabled = computed(() => project.value?.pentestEnabled ?? false)
const pentestTargetUrl = computed(() => project.value?.pentestTargetUrl ?? '')

const pentestUrlValid = computed(() => {
  try {
    const u = new URL(pentestUrlDraft.value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  }
  catch { return false }
})

watch(showChangePentestUrlModal, (open) => {
  if (open) pentestUrlDraft.value = pentestTargetUrl.value
})

async function savePentestUrl() {
  if (!project.value || !pentestUrlValid.value) return
  pentestSaving.value = true
  try {
    const partial = { pentestTargetUrl: pentestUrlDraft.value.trim() }
    await patchMeta(props.projectPath, partial)
    await projects.updateProjectMeta(project.value.id, partial)
    notify('Pentest target URL updated.', 'success')
    showChangePentestUrlModal.value = false
  }
  catch (e: any) {
    notify(e?.message ?? 'Failed to update pentest URL.', 'error')
  }
  finally {
    pentestSaving.value = false
  }
}

async function disablePentest() {
  if (!project.value) return
  pentestDisabling.value = true
  try {
    const partial = {
      pentestEnabled: false,
      pentestPromptDismissed: true,
      pentestTermsAccepted: false,
      pentestEnabledAt: null,
    }
    await patchMeta(props.projectPath, partial)
    await projects.updateProjectMeta(project.value.id, partial)
    notify('Pentest feature disabled for this project.', 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Failed to disable pentest.', 'error')
  }
  finally {
    pentestDisabling.value = false
  }
}

// Danger zone
const showDeleteModal = ref(false)
const showResetModal = ref(false)
const confirmName = ref('')
const confirmResetName = ref('')
const deleting = ref(false)
const resetting = ref(false)

const resetNameMatches = computed(() => confirmResetName.value.trim() === project.value?.name)

watch(showResetModal, (open) => {
  if (!open) confirmResetName.value = ''
})

async function resetData() {
  if (!project.value || !resetNameMatches.value) return
  resetting.value = true
  try {
    await resetProjectData(props.projectPath)
    kanban.load([], props.projectPath)
    sprintStore.load([], props.projectPath)
    notify(`All data in "${project.value.name}" has been reset`, 'success')
    showResetModal.value = false
  }
  finally {
    resetting.value = false
  }
}

const nameMatches = computed(() => confirmName.value.trim() === project.value?.name)

watch(showDeleteModal, (open) => {
  if (!open) confirmName.value = ''
})

async function removeOnly() {
  if (!project.value || !nameMatches.value) return
  deleting.value = true
  await projects.removeProject(project.value.id)
  notify(`Project "${project.value.name}" removed`, 'success')
  await router.push('/')
}

async function deleteFiles() {
  if (!project.value || !nameMatches.value) return
  deleting.value = true
  const fs = useTauriFs()
  try {
    await fs.removeFile(`${project.value.absolutePath}/vindicta.json`)
  }
  catch { /* file may not exist */ }
  await projects.removeProject(project.value.id)
  notify(`Project "${project.value.name}" deleted`, 'success')
  await router.push('/')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Tab nav -->
    <div class="flex items-center gap-1 border-b border-[var(--border)] pb-0">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer"
        :class="activeTab === tab.id
          ? (tab.id === 'danger' ? 'border-red-500 text-red-400' : 'border-indigo-500 text-white')
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'"
        @click="activeTab = tab.id as typeof activeTab"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- General tab -->
    <div v-if="activeTab === 'general'" class="space-y-5">
      <div>
        <label class="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Project name</label>
        <GlassInput v-model="nameDraft" placeholder="My project" />
      </div>
      <div>
        <label class="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Description</label>
        <textarea
          v-model="descDraft"
          rows="3"
          placeholder="What are you building?"
          class="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors resize-none"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Project code</label>
        <div class="flex items-center gap-2">
          <div class="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-2">
            <span class="text-sm font-mono text-indigo-300 font-semibold tracking-widest">{{ project?.code ?? '—' }}</span>
            <span class="text-xs text-white/30 ml-1">· ticket prefix (e.g. {{ project?.code ?? 'VND' }}-42)</span>
          </div>
          <button
            class="p-2 rounded-md border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
            title="Copy code"
            @click="copyCode"
          >
            <Check v-if="codeCopied" class="size-4 text-emerald-400" />
            <Copy v-else class="size-4" />
          </button>
        </div>
        <p class="text-xs text-white/25 mt-1">Project code is set at creation and cannot be changed.</p>
      </div>
      <div>
        <label class="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Tools</label>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-1 rounded bg-violet-500/15 text-violet-300">{{ project?.editor ?? '—' }}</span>
          <span
            v-for="tool in projectAITools"
            :key="tool"
            class="text-xs px-2 py-1 rounded bg-indigo-500/15 text-indigo-300"
          >
            {{ tool }}
          </span>
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button
          class="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
          :disabled="saving"
          @click="saveGeneral"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <!-- Board tab -->
    <div v-if="activeTab === 'board'" class="space-y-4">
      <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider">Kanban columns</h3>
      <div class="space-y-1">
        <div
          v-for="(col, i) in columns"
          :key="col.id"
          class="flex items-center gap-2 px-3 py-2 rounded-md border border-white/[0.06] bg-white/[0.03]"
        >
          <GripVertical class="size-3.5 text-white/20 cursor-grab" />
          <span class="flex-1 text-sm text-white/70">{{ col.displayName }}</span>
          <span class="text-[10px] text-white/25 font-mono">{{ col.status }}</span>
          <button
            class="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
            :title="col.visible ? 'Hide column' : 'Show column'"
            @click="toggleColumn(col.id)"
          >
            <Eye v-if="col.visible" class="size-3.5" />
            <EyeOff v-else class="size-3.5" />
          </button>
          <button class="p-1 rounded text-white/20 hover:text-white/50 transition-colors" :disabled="i === 0" @click="moveColumn(i, -1)">↑</button>
          <button class="p-1 rounded text-white/20 hover:text-white/50 transition-colors" :disabled="i === columns.length - 1" @click="moveColumn(i, 1)">↓</button>
        </div>
      </div>
      <div class="flex justify-end pt-2">
        <button
          class="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
          :disabled="boardSaving"
          @click="saveBoard"
        >
          {{ boardSaving ? 'Saving…' : 'Save board' }}
        </button>
      </div>
    </div>

    <!-- Roles tab -->
    <div v-if="activeTab === 'roles'" class="space-y-4">
      <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider">Team roles</h3>
      <div class="space-y-1 mb-3">
        <div
          v-for="role in roles"
          :key="role.id"
          class="flex items-center gap-2 px-3 py-2 rounded-md border border-white/[0.06] bg-white/[0.03]"
        >
          <span class="size-2.5 rounded-full shrink-0" :style="{ background: role.color }" />
          <span class="flex-1 text-sm text-white/70">{{ role.name }}</span>
          <button
            class="p-1 rounded text-white/20 hover:text-red-400/70 transition-colors"
            @click="removeRole(role.id)"
          >
            <Trash2 class="size-3" />
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="newRoleName"
          placeholder="Role name…"
          class="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors"
          @keydown.enter="addRole"
        >
        <input v-model="newRoleColor" type="color" class="size-8 rounded cursor-pointer bg-transparent border border-white/[0.08]">
        <button
          class="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-white/60 transition-colors"
          @click="addRole"
        >
          <Plus class="size-3" /> Add
        </button>
      </div>
      <div class="flex justify-end pt-2">
        <button
          class="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
          :disabled="boardSaving"
          @click="saveRoles"
        >
          {{ boardSaving ? 'Saving…' : 'Save roles' }}
        </button>
      </div>
    </div>

    <!-- Pentest tab -->
    <div v-if="activeTab === 'pentest'" class="space-y-5">
      <!-- Status banner -->
      <div
        class="flex items-start gap-3 rounded-xl border p-4"
        :class="pentestEnabled
          ? 'border-violet-500/25 bg-violet-500/[0.06]'
          : 'border-[var(--border)] bg-white/[0.02]'"
      >
        <div
          class="grid size-9 shrink-0 place-items-center rounded-lg border"
          :class="pentestEnabled ? 'border-violet-500/30 bg-violet-500/15' : 'border-white/[0.08] bg-white/[0.04]'"
        >
          <Swords
            class="size-4"
            :class="pentestEnabled ? 'text-violet-300' : 'text-white/30'"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-[var(--text)]">Penetration Testing</p>
            <span
              class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              :class="pentestEnabled
                ? 'bg-violet-500/15 text-violet-300'
                : 'bg-white/[0.06] text-white/30'"
            >
              {{ pentestEnabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p v-if="pentestEnabled && pentestTargetUrl" class="mt-1 text-xs text-[var(--text-muted)] truncate">
            Target: <span class="text-violet-300 font-mono">{{ pentestTargetUrl }}</span>
          </p>
          <p v-else-if="!pentestEnabled" class="mt-1 text-xs text-[var(--text-faint)]">
            Enable to access Red/Blue/Purple team tools for this project.
          </p>
        </div>
      </div>

      <!-- Enable via modal (if not enabled) -->
      <div v-if="!pentestEnabled" class="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm text-[var(--text-muted)]">Enable pentest feature for <span class="text-[var(--text)] font-medium">{{ project?.name }}</span></p>
          <p class="text-xs text-[var(--text-faint)] mt-0.5">You'll need to provide your deployed instance URL and accept the responsible use terms.</p>
        </div>
        <button
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          @click="showPentestModal = true"
        >
          <Swords class="size-3.5" />
          Enable
        </button>
      </div>

      <!-- Settings when enabled -->
      <template v-if="pentestEnabled">
        <!-- Target URL -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">Target Instance URL</label>
          <div class="flex items-center gap-2">
            <div class="flex-1 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.03] px-3 py-2">
              <ExternalLink class="size-3.5 text-violet-400 shrink-0" />
              <span class="text-sm text-[var(--text)] font-mono truncate">{{ pentestTargetUrl || '—' }}</span>
            </div>
            <button
              class="shrink-0 px-3 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05] transition-colors"
              @click="showChangePentestUrlModal = true"
            >
              Change URL
            </button>
          </div>
          <p class="text-[11px] text-[var(--text-faint)]">All active scans will target this URL. Only update if your deployed instance changed.</p>
        </div>

        <!-- Disable -->
        <div class="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex items-start gap-3">
          <AlertTriangle class="size-4 text-amber-400 mt-0.5 shrink-0" />
          <div class="flex-1">
            <p class="text-sm font-medium text-[var(--text)]">Disable pentest feature</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5 mb-3">
              This removes the Pentest item from the sidebar for this project. Your scan history is preserved.
            </p>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-amber-500/30 bg-amber-600/10 text-amber-300 hover:bg-amber-600/20 transition-colors disabled:opacity-50"
              :disabled="pentestDisabling"
              @click="disablePentest"
            >
              <ShieldOff class="size-3.5" />
              {{ pentestDisabling ? 'Disabling…' : 'Disable Pentest' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Danger Zone tab -->
    <div v-if="activeTab === 'danger'" class="space-y-4">
      <div class="rounded-xl border border-red-500/25 bg-red-500/5 p-5 space-y-4">
        <div class="flex items-center gap-2">
          <AlertTriangle class="size-4 text-red-400" />
          <h3 class="text-sm font-semibold text-red-400">Danger Zone</h3>
        </div>
        <p class="text-sm text-white/50">
          These actions are destructive and cannot be undone. Proceed with caution.
        </p>
        <div class="flex flex-col gap-3 pt-2">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-white/70">Reset project data</p>
              <p class="text-xs text-white/30 mt-0.5">Permanently delete all tickets, sprints, and history. Project settings are kept.</p>
            </div>
            <button
              class="ml-4 shrink-0 px-3 py-1.5 text-sm rounded-md border border-red-500/30 bg-red-600/10 text-red-400 hover:bg-red-600/20 font-medium transition-colors"
              @click="showResetModal = true"
            >
              Reset data
            </button>
          </div>
          <div class="h-px bg-red-500/10" />
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-white/70">Delete project</p>
              <p class="text-xs text-white/30 mt-0.5">Remove this project from Vindicter. Optionally delete the vindicta.json file.</p>
            </div>
            <button
              class="ml-4 shrink-0 px-3 py-1.5 text-sm rounded-md border border-red-500/30 bg-red-600/10 text-red-400 hover:bg-red-600/20 font-medium transition-colors"
              @click="showDeleteModal = true"
            >
              Delete project
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Pentest: full opt-in modal (shown when not yet enabled) -->
  <PentestEnableModal
    v-if="project"
    v-model="showPentestModal"
    :project-name="project.name"
    :project-path="props.projectPath"
    @enabled="showPentestModal = false"
    @dismissed="showPentestModal = false"
  />

  <!-- Pentest: change target URL modal (shown when already enabled) -->
  <GlassModal v-model="showChangePentestUrlModal" title="Update Pentest Target URL" max-width="sm">
    <div class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">Update the target URL for pentest scans. Make sure this is still an instance you own and have permission to test.</p>
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">New Target URL</label>
        <input
          v-model="pentestUrlDraft"
          type="url"
          placeholder="https://staging.myapp.com"
          class="w-full rounded-lg border bg-white/[0.04] px-3 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-faint)] outline-none transition-colors"
          :class="pentestUrlDraft && !pentestUrlValid
            ? 'border-red-500/40 focus:border-red-500/60'
            : pentestUrlValid
              ? 'border-emerald-500/40 focus:border-emerald-500/60'
              : 'border-[var(--border)] focus:border-indigo-500/50'"
        >
        <p v-if="pentestUrlDraft && !pentestUrlValid" class="text-[11px] text-red-400">Enter a valid http:// or https:// URL.</p>
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <button class="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" @click="showChangePentestUrlModal = false">Cancel</button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="pentestUrlValid ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/[0.04] text-[var(--text-faint)] cursor-not-allowed'"
          :disabled="!pentestUrlValid || pentestSaving"
          @click="savePentestUrl"
        >
          {{ pentestSaving ? 'Saving…' : 'Update URL' }}
        </button>
      </div>
    </div>
  </GlassModal>

  <!-- Reset data modal -->
  <GlassModal v-model="showResetModal" title="Reset project data" max-width="sm">
    <div class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">
        This will permanently delete all tickets, sprints, and history from
        <span class="text-[var(--text)] font-semibold">{{ project?.name }}</span>.
        Project settings and configuration are kept.
      </p>
      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1.5 block">
          Type <span class="text-[var(--text)] font-mono font-medium">{{ project?.name }}</span> to confirm
        </label>
        <GlassInput
          v-model="confirmResetName"
          :placeholder="project?.name ?? ''"
          @keydown.enter="resetNameMatches && resetData()"
        />
      </div>
      <div class="flex flex-col gap-2 pt-1">
        <GlassButton
          size="sm"
          class="justify-start bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600/20"
          :disabled="!resetNameMatches || resetting"
          @click="resetData"
        >
          {{ resetting ? 'Resetting…' : 'Reset all project data' }}
        </GlassButton>
        <GlassButton variant="ghost" size="sm" @click="showResetModal = false">Cancel</GlassButton>
      </div>
    </div>
  </GlassModal>

  <!-- Delete modal -->
  <GlassModal v-model="showDeleteModal" title="Delete project" max-width="sm">
    <div class="space-y-4">
      <p class="text-sm text-[var(--text-muted)]">
        This will remove <span class="text-[var(--text)] font-semibold">{{ project?.name }}</span> from Vindicter.
      </p>
      <div>
        <label class="text-xs text-[var(--text-muted)] mb-1.5 block">
          Type <span class="text-[var(--text)] font-mono font-medium">{{ project?.name }}</span> to confirm
        </label>
        <GlassInput
          v-model="confirmName"
          :placeholder="project?.name ?? ''"
          @keydown.enter="nameMatches && removeOnly()"
        />
      </div>
      <p class="text-xs text-[var(--text-faint)] bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
        Your project files will not be deleted unless you choose "Delete project files".
      </p>
      <div class="flex flex-col gap-2 pt-1">
        <GlassButton
          size="sm"
          variant="ghost"
          class="justify-start"
          :disabled="!nameMatches || deleting"
          @click="removeOnly"
        >
          Remove from Vindicter only
          <span class="ml-auto text-[var(--text-faint)] text-[10px]">keeps your files</span>
        </GlassButton>
        <GlassButton
          size="sm"
          class="justify-start bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600/20"
          :disabled="!nameMatches || deleting"
          @click="deleteFiles"
        >
          Delete project files
          <span class="ml-auto text-red-400/50 text-[10px]">removes vindicta.json</span>
        </GlassButton>
        <GlassButton variant="ghost" size="sm" @click="showDeleteModal = false">Cancel</GlassButton>
      </div>
    </div>
  </GlassModal>
</template>
