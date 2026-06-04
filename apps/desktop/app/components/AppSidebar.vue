<script setup lang="ts">
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  FileText,
  Files,
  Github,
  House,
  KeyRound,
  Moon,
  PackageSearch,
  PanelLeftClose,
  Plug,
  Radar,
  Settings,
  ShieldCheck,
  ShieldMinus,
  Sun,
  Swords,
  UserCircle2,
} from 'lucide-vue-next'

const isDev = import.meta.env.DEV

const route = useRoute()
const router = useRouter()
const projects = useProjectsStore()
const app = useAppStore()
const auth = useAuthStore()
const collapsed = useState('sidebar-collapsed', () => false)
const workspaceExpanded = useState('sidebar-workspace-expanded', () => true)
const pentestExpanded = useState('sidebar-pentest-expanded', () => true)
const projectSelectorOpen = ref(false)

const navItems = [
  { icon: House,       label: 'Home',    to: '/',        exact: true },
  { icon: UserCircle2, label: 'Profile', to: '/profile', exact: true },
]

// Workspace sub-tabs matching the SecurityWorkspace tabs
// `link` = navigate to absolute path; null = navigate via ?tab= query param
const workspaceTabs = computed(() => {
  const tabs = [
    { id: 'overview',       label: 'Overview',      icon: ShieldCheck,   link: null as string | null },
    { id: 'scanner',        label: 'Scanner',       icon: Radar,          link: null as string | null },
    { id: 'findings',       label: 'Findings',      icon: AlertTriangle,  link: null as string | null },
    { id: 'dependencies',   label: 'Dependencies',  icon: PackageSearch,  link: null as string | null },
    { id: 'secrets',        label: 'Secrets',       icon: KeyRound,       link: null as string | null },
    { id: 'whitelist',      label: 'Whitelist',     icon: ShieldMinus,    link: null as string | null },
    { id: 'reports',        label: 'Reports',       icon: FileText,       link: null as string | null },
    { id: 'settings',       label: 'Settings',      icon: Settings,       link: null as string | null },
  ]
  if (auth.isGitHubConnected) {
    tabs.push({ id: 'github_issues', label: 'Issues', icon: Github, link: null })
  }
  return tabs
})

const activeProject = computed(() => projects.activeProject)
const isOnWorkspace = computed(() => activeProject.value && route.path.startsWith(`/projects/${activeProject.value.id}`))
const activeTabFromRoute = computed(() => (route.query.tab as string) || 'overview')

type ProjectToolItem = {
  icon: any
  label: string
  to: string
  exact?: boolean
  disabled: boolean
  children?: ProjectToolItem[]
}

// Only Pentest remains project-specific; MCP is now in the top nav
const projectToolItems = computed(() => {
  const items: ProjectToolItem[] = []
  if (activeProject.value?.pentestEnabled) {
    items.push({
      icon: Swords,
      label: 'Pentest',
      to: '/pentest',
      exact: false,
      disabled: false,
      children: [
        { icon: Swords, label: 'Red Team', to: '/pentest/red-team', exact: true, disabled: false },
        { icon: ShieldCheck, label: 'Blue Team', to: '/pentest/blue-team', exact: true, disabled: false },
        { icon: PackageSearch, label: 'Tools', to: '/pentest/tools', exact: true, disabled: false },
      ],
    })
  }
  items.push({
    icon: Files,
    label: 'Documents',
    to: '/documents',
    exact: true,
    disabled: false,
  })
  return items
})

function isActive(item: { to: string; exact?: boolean }) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

function isTabActive(tab: { id: string; link: string | null }) {
  if (tab.link) return route.path === tab.link
  return isOnWorkspace.value && activeTabFromRoute.value === tab.id
}

function goToTab(tabId: string) {
  if (!activeProject.value) return
  void router.push(`/projects/${activeProject.value.id}?tab=${tabId}`)
}

function selectProject(id: string) {
  if (!id) return
  projects.setActive(id)
  projectSelectorOpen.value = false
  if (route.path.startsWith('/projects/')) {
    void router.push(`/projects/${id}`)
  }
}

function projectInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words[0]?.[0] ?? 'P') + (words[1]?.[0] ?? words[0]?.[1] ?? '')
}

function projectToolLabel(project: typeof projects.projects[number]) {
  return project.activeAITool || project.aiTools?.[0] || project.aiTool || 'codex'
}

function isProjectToolExpanded(item: ProjectToolItem) {
  return item.label === 'Pentest' ? pentestExpanded.value : true
}

function toggleProjectTool(item: ProjectToolItem) {
  if (item.label === 'Pentest') pentestExpanded.value = !pentestExpanded.value
}

watch(() => route.fullPath, () => {
  projectSelectorOpen.value = false
})
</script>

<template>
  <aside
    class="shrink-0 flex flex-col border-r border-[var(--border)] transition-[width] duration-200 ease-in-out overflow-hidden"
    :class="collapsed ? 'w-12' : 'w-52'"
    style="background: var(--bg-surface);"
  >
    <!-- Logo + collapse toggle -->
    <div class="h-11 px-3 flex items-center border-b border-[var(--border)]" :class="collapsed ? 'justify-center' : 'gap-2'">
      <template v-if="!collapsed">
        <img src="/icon.png" alt="" class="size-6 shrink-0 rounded-md object-cover" draggable="false">
        <span class="font-display flex-1 text-sm font-semibold text-[var(--text)] truncate opacity-90">Vindicter</span>
      </template>
      <button
        class="size-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors shrink-0"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <PanelLeftClose v-if="!collapsed" class="size-3.5" />
        <img v-else src="/icon.png" alt="" class="size-6 rounded-md object-cover" draggable="false">
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scroll">
      <!-- Top nav -->
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
        :class="[
          collapsed ? 'justify-center' : '',
          isActive(item)
            ? 'bg-indigo-600/15 text-indigo-400'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05]',
        ]"
        :title="collapsed ? item.label : undefined"
      >
        <component :is="item.icon" class="size-3.5 shrink-0" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>

      <!-- MCP (shown below Academy when enabled in settings) -->
      <NuxtLink
        v-if="app.mcpInSidebar"
        to="/mcp"
        class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
        :class="[
          collapsed ? 'justify-center' : '',
          route.path === '/mcp'
            ? 'bg-indigo-600/15 text-indigo-400'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05]',
        ]"
        :title="collapsed ? 'MCP' : undefined"
      >
        <Plug class="size-3.5 shrink-0" />
        <span v-if="!collapsed">MCP</span>
      </NuxtLink>

      <!-- Core section -->
      <div class="pt-3">
        <p v-if="!collapsed" class="px-2 mb-1 text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-[0.12em]">
          Project Specific
        </p>
        <div v-else class="h-px bg-[var(--border)] mx-1 mb-2" />

        <!-- Workspace row with expand toggle -->
        <div>
          <div class="flex items-center gap-0.5">
            <NuxtLink
              :to="activeProject ? `/projects/${activeProject.id}` : '/'"
              class="flex flex-1 items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors"
              :class="[
                collapsed ? 'justify-center' : '',
                !activeProject ? 'pointer-events-none opacity-45' : '',
                activeProject && isOnWorkspace
                  ? 'bg-indigo-600/15 text-indigo-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05]',
              ]"
              :title="collapsed ? 'Workspace' : undefined"
            >
              <ShieldCheck class="size-3.5 shrink-0 text-violet-400/70" />
              <span v-if="!collapsed" class="truncate flex-1">Workspace</span>
            </NuxtLink>
            <!-- Expand toggle (only in expanded sidebar, only when project active) -->
            <button
              v-if="!collapsed && activeProject"
              class="size-5 flex items-center justify-center rounded text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.06] transition-colors shrink-0 mr-1"
              :title="workspaceExpanded ? 'Hide tabs' : 'Show tabs'"
              @click.stop="workspaceExpanded = !workspaceExpanded"
            >
              <ChevronDown class="size-3 transition-transform" :class="workspaceExpanded ? '' : '-rotate-90'" />
            </button>
          </div>

          <!-- Sub-tabs (collapsible) -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-active-class="transition-all duration-150 ease-in overflow-hidden"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="!collapsed && activeProject && workspaceExpanded" class="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
              <template v-for="tab in workspaceTabs" :key="tab.id">
                <!-- Direct-link tabs (e.g. Documents) -->
                <NuxtLink
                  v-if="tab.link"
                  :to="tab.link"
                  class="flex w-full items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-colors"
                  :class="isTabActive(tab)
                    ? 'bg-indigo-600/15 text-indigo-400'
                    : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-white/[0.04]'"
                >
                  <component :is="tab.icon" class="size-3 shrink-0" />
                  <span class="truncate">{{ tab.label }}</span>
                </NuxtLink>
                <!-- Query-param tabs -->
                <button
                  v-else
                  class="flex w-full items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-colors"
                  :class="isTabActive(tab)
                    ? 'bg-indigo-600/15 text-indigo-400'
                    : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-white/[0.04]'"
                  @click="goToTab(tab.id)"
                >
                  <component :is="tab.icon" class="size-3 shrink-0" />
                  <span class="truncate">{{ tab.label }}</span>
                </button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Other core items (Pentest only if enabled on project) -->
        <div
          v-for="item in projectToolItems"
          :key="item.to + item.label"
        >
          <div class="flex items-center gap-0.5">
            <NuxtLink
              :to="item.to"
              class="flex flex-1 items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors"
              :class="[
                collapsed ? 'justify-center' : '',
                item.disabled ? 'pointer-events-none opacity-45' : '',
                !item.disabled && isActive(item)
                  ? 'bg-indigo-600/15 text-indigo-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.05]',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <component :is="item.icon" class="size-3.5 shrink-0 text-violet-400/70" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
            <button
              v-if="!collapsed && item.children?.length"
              class="mr-1 flex size-5 shrink-0 items-center justify-center rounded text-[var(--text-faint)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
              :title="isProjectToolExpanded(item) ? 'Hide pentest pages' : 'Show pentest pages'"
              @click.stop="toggleProjectTool(item)"
            >
              <ChevronDown class="size-3 transition-transform" :class="isProjectToolExpanded(item) ? '' : '-rotate-90'" />
            </button>
          </div>

          <div v-if="!collapsed && item.children?.length && isProjectToolExpanded(item)" class="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
            <NuxtLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-colors"
              :class="isActive(child)
                ? 'bg-indigo-600/15 text-indigo-400'
                : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-white/[0.04]'"
            >
              <component :is="child.icon" class="size-3 shrink-0" />
              <span class="truncate">{{ child.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

    </nav>

    <!-- Developer section removed: Academy Builder moved to web-dashboard admin -->

    <!-- Project selector -->
    <div v-if="projects.hasProjects" class="border-t border-[var(--border)] p-2">
      <template v-if="!collapsed">
        <label class="mb-1 block px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
          Active Project
        </label>
        <div class="relative">
          <button
            class="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.04] px-2 text-left transition-colors hover:border-indigo-500/25 hover:bg-white/[0.06]"
            @click="projectSelectorOpen = !projectSelectorOpen"
          >
            <span class="grid size-7 shrink-0 place-items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-bold uppercase text-indigo-200">
              {{ activeProject ? projectInitials(activeProject.name) : 'PR' }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-semibold text-[var(--text)]">{{ activeProject?.name ?? 'Select project' }}</span>
              <span class="mt-0.5 block truncate text-[10px] text-[var(--text-faint)]">
                {{ activeProject?.code ?? 'No code' }} / {{ activeProject ? projectToolLabel(activeProject) : 'No tool' }}
              </span>
            </span>
            <ChevronDown class="size-3.5 shrink-0 text-[var(--text-faint)] transition-transform" :class="projectSelectorOpen ? 'rotate-180' : ''" />
          </button>

          <div
            v-if="projectSelectorOpen"
            class="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-30 overflow-hidden rounded-xl border border-[var(--border)] bg-[#111114]/95 shadow-2xl shadow-black/40 backdrop-blur-md"
          >
            <button
              v-for="project in projects.projects"
              :key="project.id"
              class="flex w-full items-center gap-2 border-b border-white/[0.04] px-2.5 py-2 text-left transition-colors last:border-b-0 hover:bg-white/[0.06]"
              :class="project.id === activeProject?.id ? 'bg-indigo-500/10' : ''"
              @click="selectProject(project.id)"
            >
              <span class="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-[10px] font-bold uppercase text-white/70">
                {{ projectInitials(project.name) }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-medium text-[var(--text)]">{{ project.name }}</span>
                <span class="mt-0.5 block truncate text-[10px] text-[var(--text-faint)]">{{ project.code }} / {{ projectToolLabel(project) }}</span>
              </span>
              <Check v-if="project.id === activeProject?.id" class="size-3.5 shrink-0 text-indigo-300" />
            </button>
          </div>
        </div>
      </template>
      <NuxtLink
        v-else
        :to="activeProject ? `/projects/${activeProject.id}` : '/'"
        class="flex h-8 items-center justify-center rounded-md text-[var(--text-faint)] hover:bg-white/[0.05] hover:text-[var(--text)]"
        :title="activeProject?.name ?? 'Select project'"
      >
        <ShieldCheck class="size-3.5" />
      </NuxtLink>
    </div>

    <!-- Theme toggle -->
    <button
      class="h-8 flex items-center gap-2 px-3 border-t border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.03] transition-colors"
      :class="collapsed ? 'justify-center' : ''"
      :title="app.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="app.toggleTheme()"
    >
      <Sun v-if="app.theme === 'dark'" class="size-3.5 shrink-0" />
      <Moon v-else class="size-3.5 shrink-0" />
      <span v-if="!collapsed" class="text-xs">{{ app.theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
    </button>

    <!-- AI Models link -->
    <NuxtLink
      to="/ai-models"
      class="h-9 flex items-center gap-2 px-3 border-t border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.03] transition-colors"
      :class="[
        collapsed ? 'justify-center' : '',
        route.path === '/ai-models' ? 'bg-indigo-600/10 text-indigo-400' : '',
      ]"
      :title="collapsed ? 'AI Models' : undefined"
    >
      <Bot class="size-3.5 shrink-0" />
      <span v-if="!collapsed" class="text-xs">AI Models</span>
    </NuxtLink>

    <!-- Settings link -->
    <NuxtLink
      to="/settings"
      class="h-9 flex items-center gap-2 px-3 border-t border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-white/[0.03] transition-colors"
      :class="[
        collapsed ? 'justify-center' : '',
        route.path === '/settings' ? 'bg-indigo-600/10 text-indigo-400' : '',
      ]"
      :title="collapsed ? 'Settings' : undefined"
    >
      <Settings class="size-3.5 shrink-0" />
      <span v-if="!collapsed" class="text-xs">Settings</span>
    </NuxtLink>
  </aside>
</template>
