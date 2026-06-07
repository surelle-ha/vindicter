<script setup lang="ts">
import { AlertTriangle, FileText, FolderSearch, Github, KeyRound, PackageSearch, PanelBottomOpen, Radar, Settings, ShieldCheck, ShieldMinus, Trash2 } from 'lucide-vue-next'
import type { Component } from 'vue'

type SecurityWorkspaceTab = 'overview' | 'scanner' | 'findings' | 'whitelist' | 'dependencies' | 'secrets' | 'reports' | 'settings' | 'github_issues' | 'history'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const aiActivity = useAIActivityStore()
const auth = useAuthStore()
const { notify } = useNotifications()

const activeTab = ref<SecurityWorkspaceTab>('overview')
const headerCollapsed = ref(false)
const showPentestModal = ref(false)
const folderMissing = ref(false)
const removingProject = ref(false)

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectsStore.projects.find((p) => p.id === projectId.value))

async function checkFolderExists() {
  if (!project.value?.absolutePath) return
  try {
    const fs = useTauriFs()
    folderMissing.value = !(await fs.exists(project.value.absolutePath))
  }
  catch { folderMissing.value = false }
}

async function removeProject() {
  if (!project.value || removingProject.value) return
  removingProject.value = true
  try {
    await projectsStore.removeProject(project.value.id)
    notify('Project removed from Vindicter.', 'success')
    await router.push('/')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not remove project.', 'error')
  }
  finally { removingProject.value = false }
}

async function locateProject() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ directory: true, multiple: false, title: 'Locate project folder' })
    if (selected && typeof selected === 'string' && project.value) {
      await projectsStore.updateProjectMeta(project.value.id, { absolutePath: selected })
      folderMissing.value = false
      notify('Project path updated.', 'success')
    }
  }
  catch { /* dialog cancelled */ }
}

const staticTabs: { id: SecurityWorkspaceTab; label: string; icon: Component }[] = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'scanner', label: 'Scanner', icon: Radar },
  { id: 'findings', label: 'Findings', icon: AlertTriangle },
  { id: 'dependencies', label: 'Dependencies', icon: PackageSearch },
  { id: 'secrets', label: 'Secrets', icon: KeyRound },
  { id: 'whitelist', label: 'Whitelist', icon: ShieldMinus },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const tabs = computed(() => {
  const all = [...staticTabs]
  if (auth.isGitHubConnected) {
    all.push({ id: 'github_issues', label: 'Issues', icon: Github })
  }
  return all
})

onMounted(async () => {
  await aiActivity.load()
  if (!projectsStore.projects.length) {
    await projectsStore.loadProjects()
  }
  if (project.value) {
    projectsStore.setActive(project.value.id)
    await checkFolderExists()
    if (!project.value.pentestEnabled && !project.value.pentestPromptDismissed) {
      setTimeout(() => { showPentestModal.value = true }, 800)
    }
  }
})

function isSecurityTab(value: unknown): value is SecurityWorkspaceTab {
  const allIds: SecurityWorkspaceTab[] = ['overview', 'scanner', 'findings', 'whitelist', 'dependencies', 'secrets', 'reports', 'history', 'settings', 'github_issues']
  return allIds.includes(value as SecurityWorkspaceTab)
}

function changeTab(tab: SecurityWorkspaceTab) {
  activeTab.value = tab
  void router.replace({ query: { ...route.query, tab } })
}

watch(() => route.query.tab, (tab) => {
  activeTab.value = isSecurityTab(tab) ? tab : 'overview'
}, { immediate: true })
</script>

<template>
  <div class="max-w-full h-full flex flex-col">
    <template v-if="project">
      <div class="relative -mx-5 -mt-5 mb-5 overflow-hidden border-b border-[var(--border)] px-5 pt-5">
        <Dither
          class="pointer-events-none z-0 opacity-70"
          :wave-speed="0.025"
          :wave-frequency="2.25"
          :wave-amplitude="0.32"
          :wave-color="[0.28, 0.3, 0.86]"
          :color-num="5"
          :pixel-size="2"
          :disable-animation="false"
          :enable-mouse-interaction="false"
          :mouse-radius="0.75"
        />
        <div
          class="absolute inset-0 z-[1] pointer-events-none"
          style="background: color-mix(in srgb, var(--bg-surface) 70%, transparent);"
        />
        <div
          class="absolute inset-0 z-[2] pointer-events-none"
          style="background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--bg-base) 45%, transparent));"
        />

        <div class="relative z-10">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="-translate-y-3 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition-all duration-180 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-3 opacity-0"
          >
            <ProjectHeader v-if="!headerCollapsed" :project="project" />
          </Transition>

          <div class="flex items-center gap-0.5 overflow-x-auto scrollbar-none" :class="headerCollapsed ? 'mt-0' : 'mt-4'">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="px-3 py-2 text-xs font-medium transition-colors relative whitespace-nowrap flex items-center gap-1 cursor-pointer"
              :class="activeTab === tab.id
                ? 'text-[var(--text)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-indigo-500'
                : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'"
              @click="changeTab(tab.id)"
            >
              <component :is="tab.icon" class="size-3" />
              {{ tab.label }}
            </button>
            <button
              class="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] cursor-pointer"
              :title="headerCollapsed ? 'Show project header' : 'Hide project header'"
              @click="headerCollapsed = !headerCollapsed"
            >
              <PanelBottomOpen class="size-3.5" :class="headerCollapsed ? 'rotate-180' : ''" />
            </button>
          </div>
        </div>
      </div>

      <!-- Missing folder warning banner -->
      <div v-if="folderMissing" class="mx-5 mt-1 mb-3 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
        <AlertTriangle class="size-4 shrink-0 text-amber-300" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-amber-200">Project folder not found</p>
          <p class="text-[10px] text-amber-200/50 truncate mt-0.5">{{ project.absolutePath }}</p>
        </div>
        <button
          class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/10 transition-colors cursor-pointer"
          @click="locateProject"
        >
          <FolderSearch class="size-3.5" />
          Locate
        </button>
        <button
          class="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 text-[11px] font-medium text-red-300 hover:bg-red-500/8 transition-colors cursor-pointer"
          :disabled="removingProject"
          @click="removeProject"
        >
          <Trash2 class="size-3.5" />
          Remove
        </button>
      </div>

      <div class="flex-1 overflow-auto">
        <SecurityWorkspace :project="project" :tab="activeTab" @change-tab="changeTab" />
      </div>
    </template>

    <div v-else class="flex items-center justify-center py-24">
      <div class="text-center">
        <p class="text-[var(--text-muted)] text-sm">Project not found.</p>
        <NuxtLink to="/" class="text-xs text-indigo-400 hover:text-indigo-300 mt-2 block">Back to Home</NuxtLink>
      </div>
    </div>
  </div>

  <!-- Pentest opt-in modal (shown once on first project open) -->
  <PentestEnableModal
    v-if="project"
    v-model="showPentestModal"
    :project-name="project.name"
    :project-path="project.absolutePath"
  />
</template>
