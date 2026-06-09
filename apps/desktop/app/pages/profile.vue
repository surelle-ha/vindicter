<script setup lang="ts">
import {
  AlertTriangle, CheckCircle2, Github, LogIn, LogOut,
  ShieldCheck, ShieldX, Pencil, X, Loader2,
  Building2, Calendar, KeyRound, UserCircle2, TriangleAlert,
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const user     = useUserStore()
const security = useSecurityStore()
const auth     = useAuthStore()
const router   = useRouter()

const showSignOutModal = ref(false)
const signingOut = ref(false)

async function confirmSignOut() {
  signingOut.value = true
  showSignOutModal.value = false
  await auth.logoutApi()
  await auth.logoutGitHub()
  useAppStore().launched = false
  signingOut.value = false
}

// ── API profile edit ────────────────────────────────────────────────────────
const editing       = ref(false)
const saving        = ref(false)
const saveErr       = ref('')
const saveOk        = ref(false)

const editFirstName = ref('')
const editLastName  = ref('')
const editJobRole   = ref('')

const jobRoles = [
  'Security Practitioner', 'Developer', 'DevSecOps', 'Pentester',
  'Blue Team Analyst', 'Security Engineer', 'Tech Lead', 'Other',
]

function startEdit() {
  editFirstName.value = auth.apiUser?.firstName ?? ''
  editLastName.value  = auth.apiUser?.lastName  ?? ''
  editJobRole.value   = auth.apiUser?.jobRole   ?? jobRoles[0]!
  saveErr.value = ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  saveErr.value = ''
}

async function saveProfile() {
  if (!auth.apiToken) return
  saving.value = true; saveErr.value = ''
  try {
    const { apiUpdateProfile } = await import('~/composables/useDesktopAuth')
    const updated = await apiUpdateProfile(auth.apiToken, {
      firstName: editFirstName.value.trim() || undefined,
      lastName:  editLastName.value.trim()  || undefined,
      jobRole:   editJobRole.value          || undefined,
    })
    auth.apiUser = updated
    await auth._persist()
    saveOk.value  = true
    editing.value = false
    setTimeout(() => { saveOk.value = false }, 2000)
  } catch (e) {
    saveErr.value = e instanceof Error ? e.message : 'Failed to save.'
  } finally { saving.value = false }
}

// ── Derived display values ──────────────────────────────────────────────────
const displayName = computed(() => {
  if (auth.apiUser) {
    const parts = [auth.apiUser.firstName, auth.apiUser.lastName].filter(Boolean)
    return parts.length ? parts.join(' ') : auth.apiUser.email
  }
  return user.name || 'User'
})

const displayEmail = computed(() => auth.apiUser?.email ?? user.email ?? '')

const initials = computed(() =>
  displayName.value.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
)

// ── Security stats ──────────────────────────────────────────────────────────
const totalFindings    = computed(() => security.findings.length)
const openFindings     = computed(() => security.findings.filter(f => f.status === 'open').length)
const resolvedFindings = computed(() => security.findings.filter(f => f.status === 'resolved').length)
const criticalFindings = computed(() => security.findings.filter(f => f.severity === 'critical').length)
const highFindings     = computed(() => security.findings.filter(f => f.severity === 'high').length)
const latestScan       = computed(() => security.latestScan)

const securityHealthLabel = computed(() => {
  if (!totalFindings.value) return 'No findings'
  if (criticalFindings.value > 0) return 'Critical issues'
  if (highFindings.value > 0) return 'High risk'
  if (openFindings.value > 0) return 'Needs attention'
  return 'Looking good'
})
const securityHealthColor = computed(() => {
  if (!totalFindings.value || openFindings.value === 0) return 'text-emerald-300'
  if (criticalFindings.value > 0) return 'text-red-300'
  if (highFindings.value > 0) return 'text-orange-300'
  return 'text-amber-300'
})

onMounted(async () => {
  await auth.load()
  const projectsStore = useProjectsStore()
  if (!projectsStore.projects.length) await projectsStore.loadProjects()
  const active = projectsStore.activeProject
  if (active?.absolutePath) await security.load(active.absolutePath, active.id)
  if (auth.apiToken) {
    try {
      const { apiFetchMe } = await import('~/composables/useDesktopAuth')
      const fresh = await apiFetchMe(auth.apiToken)
      auth.apiUser = fresh
      await auth._persist()
    } catch { /* token may be expired; display what we have */ }
  }
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">

    <!-- Cover + avatar -->
    <section class="isolate overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <div class="relative z-0 h-52 overflow-hidden">
        <Dither
          class="pointer-events-none z-0 opacity-90"
          :wave-speed="0.03"
          :wave-frequency="2.5"
          :wave-amplitude="0.36"
          :wave-color="[0.34, 0.36, 0.9]"
          :color-num="5"
          :pixel-size="2"
          :disable-animation="false"
          :enable-mouse-interaction="false"
          :mouse-radius="0.8"
        />
        <div class="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
      </div>

      <div class="relative z-20 px-5 pb-5 sm:px-6">
        <div class="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div class="relative z-30 shrink-0 rounded-full bg-[var(--bg-card)] p-1 shadow-xl shadow-black/30">
            <div class="size-28 rounded-full border border-indigo-300/25 bg-gradient-to-br from-indigo-500 via-violet-600 to-sky-500 grid place-items-center">
              <span class="text-3xl font-bold text-white drop-shadow-sm">{{ initials }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1 pb-1">
            <div class="flex items-center gap-2">
              <h1 class="truncate text-2xl font-bold text-[var(--text)]">{{ displayName }}</h1>
              <button
                v-if="auth.isApiAuthenticated && !editing"
                class="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/[0.06] text-[var(--text-faint)] hover:text-[var(--text-muted)] cursor-pointer"
                title="Edit profile"
                @click="startEdit"
              >
                <Pencil class="size-3.5" />
              </button>
              <span v-if="saveOk" class="text-[11px] text-emerald-400">Saved!</span>
            </div>
            <p class="truncate text-sm text-[var(--text-muted)]">{{ displayEmail }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <GlassBadge variant="purple">{{ auth.apiUser?.jobRole || user.jobRole || 'Developer' }}</GlassBadge>
            </div>
          </div>
        </div>

        <!-- GitHub connected -->
        <div v-if="auth.isGitHubConnected" class="mt-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
          <div class="flex items-center gap-2.5">
            <Github class="size-4 text-emerald-300 shrink-0" />
            <div>
              <p class="text-xs font-semibold text-emerald-200">GitHub connected</p>
              <p class="text-[11px] text-[var(--text-muted)]">Signed in as @{{ auth.githubUser?.login }}</p>
            </div>
          </div>
          <button
            class="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-faint)] transition-colors hover:border-red-500/25 hover:bg-red-500/[0.06] hover:text-red-300"
            @click="auth.logoutGitHub()"
          >
            <LogOut class="size-3" />
            Disconnect
          </button>
        </div>

        <!-- GitHub not connected -->
        <div v-else class="mt-5 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-white/[0.02] px-3 py-2.5">
          <div class="flex items-center gap-2.5">
            <Github class="size-4 text-[var(--text-faint)] shrink-0" />
            <p class="text-xs text-[var(--text-muted)]">Connect GitHub to import repos and create issues.</p>
          </div>
          <GlassButton size="sm" @click="router.push('/login')">
            <LogIn class="size-3.5" />
            Sign In
          </GlassButton>
        </div>
      </div>
    </section>

    <!-- Edit panel (shown inline when editing) -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div v-if="editing" class="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.05] p-5 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-[var(--text)]">Edit Profile</p>
          <button class="rounded-lg p-1 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors cursor-pointer" @click="cancelEdit">
            <X class="size-4" />
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-[var(--text-muted)] mb-1.5 block">First name</label>
            <GlassInput v-model="editFirstName" placeholder="First name" />
          </div>
          <div>
            <label class="text-xs text-[var(--text-muted)] mb-1.5 block">Last name</label>
            <GlassInput v-model="editLastName" placeholder="Last name" />
          </div>
        </div>
        <div>
          <label class="text-xs text-[var(--text-muted)] mb-1.5 block">Role</label>
          <GlassSelect v-model="editJobRole" class="w-full">
            <option v-for="r in jobRoles" :key="r" :value="r">{{ r }}</option>
          </GlassSelect>
        </div>
        <p v-if="saveErr" class="text-[11px] text-red-400">{{ saveErr }}</p>
        <div class="flex gap-2">
          <GlassButton size="sm" :disabled="saving" @click="saveProfile">
            <Loader2 v-if="saving" class="size-3.5 animate-spin" />
            {{ saving ? 'Saving…' : 'Save changes' }}
          </GlassButton>
          <GlassButton variant="ghost" size="sm" @click="cancelEdit">Cancel</GlassButton>
        </div>
      </div>
    </Transition>

    <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <aside class="space-y-4">

        <!-- Account card -->
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
          <div class="flex items-center gap-2">
            <UserCircle2 class="size-4 text-indigo-300/70" />
            <p class="text-xs font-semibold text-[var(--text)]">Account</p>
          </div>
          <div class="space-y-2.5">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Email</p>
              <p class="text-xs text-[var(--text-muted)] break-all">{{ displayEmail || '—' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Role</p>
              <p class="text-xs text-[var(--text-muted)]">{{ auth.apiUser?.jobRole || user.jobRole || 'Developer' }}</p>
            </div>
            <div v-if="auth.apiUser?.id">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-0.5">User ID</p>
              <p class="font-mono text-[10px] text-[var(--text-faint)] truncate">{{ auth.apiUser.id }}</p>
            </div>
          </div>
        </div>

        <!-- Workspace card -->
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
          <div class="flex items-center gap-2">
            <Building2 class="size-4 text-violet-300/70" />
            <p class="text-xs font-semibold text-[var(--text)]">Workspace</p>
          </div>
          <div v-if="auth.activeWorkspace" class="space-y-2.5">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-0.5">Name</p>
              <p class="text-xs text-[var(--text-muted)]">{{ auth.activeWorkspace.name }}</p>
            </div>
            <div v-if="auth.workspaces.length > 1">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)] mb-0.5">All Workspaces</p>
              <p class="text-xs text-[var(--text-muted)]">{{ auth.workspaces.length }} workspaces</p>
            </div>
          </div>
          <p v-else class="text-[11px] text-[var(--text-faint)]">No workspace selected.</p>
        </div>

        <!-- Session card -->
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
          <div class="flex items-center gap-2">
            <KeyRound class="size-4 text-amber-300/70" />
            <p class="text-xs font-semibold text-[var(--text)]">Session</p>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] text-[var(--text-muted)]">API</p>
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold" :class="auth.isApiAuthenticated ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300' : 'border-[var(--border)] text-[var(--text-faint)]'">
                {{ auth.isApiAuthenticated ? 'Active' : 'None' }}
              </span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] text-[var(--text-muted)]">GitHub</p>
              <span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold" :class="auth.isGitHubConnected ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300' : 'border-[var(--border)] text-[var(--text-faint)]'">
                {{ auth.isGitHubConnected ? 'Connected' : 'None' }}
              </span>
            </div>
          </div>
        </div>

      </aside>

      <main class="space-y-6">
        <!-- Security Overview -->
        <div class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <ShieldCheck class="size-4 text-violet-300" />
              <div>
                <p class="text-sm font-semibold text-[var(--text)]">Security Overview</p>
                <p class="text-xs text-[var(--text-muted)] mt-0.5" :class="securityHealthColor">{{ securityHealthLabel }}</p>
              </div>
            </div>
            <GlassBadge variant="purple">{{ totalFindings }} finding{{ totalFindings !== 1 ? 's' : '' }}</GlassBadge>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Open</p>
              <p class="text-lg font-semibold" :class="openFindings > 0 ? 'text-red-300' : 'text-[var(--text)]'">{{ openFindings }}</p>
            </div>
            <div class="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Resolved</p>
              <p class="text-lg font-semibold text-emerald-300">{{ resolvedFindings }}</p>
            </div>
            <div class="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Critical</p>
              <p class="text-lg font-semibold" :class="criticalFindings > 0 ? 'text-red-300' : 'text-[var(--text)]'">{{ criticalFindings }}</p>
            </div>
            <div class="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
              <p class="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">High</p>
              <p class="text-lg font-semibold" :class="highFindings > 0 ? 'text-orange-300' : 'text-[var(--text)]'">{{ highFindings }}</p>
            </div>
          </div>

          <div class="rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <div class="flex items-start gap-2">
              <CheckCircle2 v-if="!openFindings" class="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
              <AlertTriangle v-else class="mt-0.5 size-3.5 shrink-0 text-amber-300" />
              <div class="min-w-0">
                <p class="text-xs font-semibold text-[var(--text)]">Last scan</p>
                <p class="mt-1 text-[11px] text-[var(--text-muted)]">
                  {{ latestScan ? new Date(latestScan.scannedAt).toLocaleString() : 'No scan has been run yet.' }}
                </p>
              </div>
            </div>
          </div>

          <GlassButton size="sm" @click="router.push('/security')">
            <ShieldX class="size-3.5" />
            Open Workspace
          </GlassButton>
        </div>
      </main>
    </div>

    <!-- Sign out section -->
    <div v-if="auth.isApiAuthenticated || auth.isGitHubConnected" class="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-4 flex items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-[var(--text)]">Sign out</p>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">End your session and return to the sign-in screen.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
        @click="showSignOutModal = true"
      >
        <LogOut class="size-3.5" />
        Sign out
      </button>
    </div>
  </div>

  <!-- Sign out confirmation modal -->
  <GlassModal v-model="showSignOutModal" title="Sign out">
    <div class="space-y-4">
      <div class="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3">
        <TriangleAlert class="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p class="text-xs text-amber-200">Are you sure you want to sign out? You will need to sign in again to access your workspace.</p>
      </div>
      <div class="flex gap-2 justify-end">
        <GlassButton variant="ghost" size="sm" :disabled="signingOut" @click="showSignOutModal = false">Cancel</GlassButton>
        <button
          class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
          :disabled="signingOut"
          @click="confirmSignOut"
        >
          <Loader2 v-if="signingOut" class="size-3.5 animate-spin" />
          <LogOut v-else class="size-3.5" />
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </div>
  </GlassModal>
</template>
