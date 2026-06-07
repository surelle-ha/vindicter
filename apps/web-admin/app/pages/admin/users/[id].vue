<script setup lang="ts">
import {
  ArrowLeft, ShieldAlert, CheckCircle2, XCircle,
  Mail, Calendar, Briefcase, GraduationCap, Key,
  Loader2, RefreshCw, AlertTriangle,
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'User Profile — Vindicter' })

const route  = useRoute()
const router = useRouter()
const api    = useApi()
const { isAdmin } = useAuth()

onMounted(() => { if (!isAdmin.value) router.push('/campaigns') })

interface ApiToken {
  id: string
  name: string
  lastUsedAt?: string
  createdAt: string
}
interface UserDetail {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  isActive: boolean
  jobRole?: string
  experienceLevel?: string
  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
  userRoles?: { role: { name: string } }[]
  apiTokens?: ApiToken[]
}

const user    = ref<UserDetail | null>(null)
const loading = ref(true)
const err     = ref('')
const saving  = ref(false)
const msg     = ref('')

async function fetchUser() {
  loading.value = true
  err.value     = ''
  msg.value     = ''
  try {
    user.value = await api.get<UserDetail>(`/users/${route.params.id}`)
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load user.'
  } finally {
    loading.value = false
  }
}

async function toggleActive() {
  if (!user.value) return
  saving.value = true
  msg.value    = ''
  try {
    const updated = await api.patch<UserDetail>(`/users/${user.value.id}/active`, { isActive: !user.value.isActive })
    user.value.isActive = updated.isActive
    msg.value = `Account ${updated.isActive ? 'reactivated' : 'deactivated'}.`
  } catch (e) {
    msg.value = e instanceof Error ? e.message : 'Failed to update status.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchUser)

const fullName = computed(() => {
  if (!user.value) return ''
  const parts = [user.value.firstName, user.value.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : (user.value.email ?? '')
})

const initials = computed(() => {
  const name = fullName.value || '?'
  return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()
})

function fmt(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtShort(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const roleName = computed(() => user.value?.userRoles?.[0]?.role?.name ?? 'member')
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <!-- Back -->
    <button
      class="flex items-center gap-1.5 mb-5 text-[11px] transition-colors hover:text-white/60 cursor-pointer"
      style="color:rgba(255,255,255,0.30);"
      @click="router.push('/admin/users')"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      Back to Users
    </button>

    <!-- Admin header -->
    <div class="flex items-center gap-2 mb-4">
      <ShieldAlert class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
      <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Admin · User Profile</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="h-40 rounded-2xl animate-pulse" style="background:rgba(255,255,255,0.03);" />
      <div class="h-64 rounded-2xl animate-pulse" style="background:rgba(255,255,255,0.02);" />
    </div>

    <!-- Error -->
    <div v-else-if="err" class="rounded-xl px-5 py-4 text-[13px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);">
      {{ err }}
    </div>

    <template v-else-if="user">

      <!-- Profile card -->
      <div class="rounded-2xl overflow-hidden" style="border:1px solid rgba(255,255,255,0.07);">

        <!-- Cover band -->
        <div class="relative h-36" style="background:linear-gradient(135deg,rgba(245,158,11,0.18) 0%,rgba(245,158,11,0.06) 50%,rgba(17,18,21,0.8) 100%);">
          <div class="absolute inset-0" style="background:repeating-linear-gradient(45deg,transparent,transparent 24px,rgba(245,158,11,0.03) 24px,rgba(245,158,11,0.03) 25px);" />
          <!-- Refresh -->
          <button
            class="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] transition-colors hover:bg-white/[0.08] cursor-pointer"
            style="background:rgba(0,0,0,0.35);color:rgba(255,255,255,0.40);border:1px solid rgba(255,255,255,0.08);"
            @click="fetchUser"
          >
            <RefreshCw class="h-3 w-3" />
            Refresh
          </button>
        </div>

        <!-- Avatar + name row -->
        <div class="px-6 pb-6" style="background:rgba(17,18,21,0.98);">
          <div class="flex items-end gap-4 -mt-10 mb-4">
            <!-- Avatar -->
            <div
              class="h-20 w-20 shrink-0 rounded-full flex items-center justify-center text-[22px] font-black"
              style="background:linear-gradient(135deg,rgba(245,158,11,0.35),rgba(245,158,11,0.12));border:3px solid rgba(17,18,21,0.98);box-shadow:0 0 0 2px rgba(245,158,11,0.25);"
            >
              {{ initials }}
            </div>
            <!-- Active badge -->
            <div class="mb-2 flex items-center gap-1.5">
              <component
                :is="user.isActive ? CheckCircle2 : XCircle"
                class="h-4 w-4"
                :style="user.isActive ? 'color:rgba(35,165,90,0.80)' : 'color:rgba(242,63,66,0.70)'"
              />
              <span
                class="text-[11px] font-semibold"
                :style="user.isActive ? 'color:rgba(35,165,90,0.75)' : 'color:rgba(242,63,66,0.65)'"
              >
                {{ user.isActive ? 'Active' : 'Deactivated' }}
              </span>
            </div>
          </div>

          <!-- Full name + email -->
          <h2 class="text-[20px] font-display font-black uppercase tracking-wide leading-tight" style="color:rgba(255,255,255,0.92);">
            {{ fullName || '—' }}
          </h2>
          <p class="text-[13px] mt-0.5" style="color:rgba(255,255,255,0.35);">{{ user.email }}</p>

          <!-- Role badge -->
          <div class="mt-2.5 flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.22);color:rgba(251,191,36,0.85);"
            >
              {{ roleName }}
            </span>
            <span
              v-if="user.onboardingComplete"
              class="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.70);"
            >
              Onboarded
            </span>
            <span
              v-else
              class="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.30);"
            >
              Onboarding incomplete
            </span>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="mt-4 grid sm:grid-cols-2 gap-4">

        <!-- Left: Details -->
        <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.22);">Details</p>

          <div class="flex items-start gap-3">
            <Mail class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color:rgba(245,158,11,0.50);" />
            <div>
              <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Email</p>
              <p class="text-[12px] mt-0.5 break-all" style="color:rgba(255,255,255,0.72);">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Briefcase class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color:rgba(245,158,11,0.50);" />
            <div>
              <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Job Role</p>
              <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.72);">{{ user.jobRole ?? '—' }}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <GraduationCap class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color:rgba(245,158,11,0.50);" />
            <div>
              <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Experience</p>
              <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.72);">{{ user.experienceLevel ?? '—' }}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Calendar class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color:rgba(245,158,11,0.50);" />
            <div>
              <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Joined</p>
              <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.72);">{{ fmt(user.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Right: System -->
        <div class="rounded-xl p-5 space-y-4" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.22);">System</p>

          <div>
            <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">User ID</p>
            <p class="mt-0.5 font-mono text-[11px] break-all" style="color:rgba(255,255,255,0.38);">{{ user.id }}</p>
          </div>

          <div>
            <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Last updated</p>
            <p class="text-[12px] mt-0.5" style="color:rgba(255,255,255,0.50);">{{ fmt(user.updatedAt) }}</p>
          </div>

          <div>
            <p class="text-[10px] uppercase tracking-wider" style="color:rgba(255,255,255,0.22);">Roles</p>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="ur in (user.userRoles ?? [])"
                :key="ur.role.name"
                class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.18);color:rgba(251,191,36,0.75);"
              >
                {{ ur.role.name }}
              </span>
              <span v-if="!user.userRoles?.length" class="text-[11px]" style="color:rgba(255,255,255,0.25);">No roles</span>
            </div>
          </div>
        </div>
      </div>

      <!-- API Tokens -->
      <div class="mt-4 rounded-xl p-5" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);">
        <div class="flex items-center gap-2 mb-4">
          <Key class="h-3.5 w-3.5" style="color:rgba(245,158,11,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.22);">API Tokens</p>
          <span
            class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.30);"
          >
            {{ user.apiTokens?.length ?? 0 }}
          </span>
        </div>

        <div v-if="user.apiTokens?.length" class="space-y-2">
          <div
            v-for="t in user.apiTokens"
            :key="t.id"
            class="flex items-center justify-between rounded-lg px-3.5 py-2.5"
            style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);"
          >
            <div>
              <p class="text-[12px] font-medium" style="color:rgba(255,255,255,0.70);">{{ t.name }}</p>
              <p class="text-[10px] mt-0.5" style="color:rgba(255,255,255,0.25);">
                Created {{ fmtShort(t.createdAt) }}
                <span v-if="t.lastUsedAt"> · Last used {{ fmtShort(t.lastUsedAt) }}</span>
              </p>
            </div>
            <span class="font-mono text-[10px]" style="color:rgba(255,255,255,0.18);">{{ t.id.slice(0, 8) }}…</span>
          </div>
        </div>
        <p v-else class="text-[12px]" style="color:rgba(255,255,255,0.22);">No API tokens.</p>
      </div>

      <!-- Message -->
      <div
        v-if="msg"
        class="mt-4 rounded-xl px-4 py-2.5 text-[12px]"
        :style="msg.includes('Failed') ? 'background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);' : 'background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.80);'"
      >
        {{ msg }}
      </div>

      <!-- Danger zone -->
      <div class="mt-4 rounded-xl p-5" style="background:rgba(242,63,66,0.04);border:1px solid rgba(242,63,66,0.14);">
        <div class="flex items-center gap-2 mb-3">
          <AlertTriangle class="h-3.5 w-3.5" style="color:rgba(248,113,113,0.55);" />
          <p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="color:rgba(248,113,113,0.50);">Danger Zone</p>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-[12px] font-medium" style="color:rgba(255,255,255,0.65);">
              {{ user.isActive ? 'Deactivate account' : 'Reactivate account' }}
            </p>
            <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.30);">
              {{ user.isActive
                ? 'Prevents the user from logging in. Data is preserved.'
                : 'Restores the user\'s ability to log in.' }}
            </p>
          </div>
          <button
            :disabled="saving"
            class="shrink-0 flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            :style="user.isActive
              ? 'background:rgba(242,63,66,0.10);border:1px solid rgba(242,63,66,0.22);color:rgba(248,113,113,0.80);'
              : 'background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.22);color:rgba(35,165,90,0.75);'"
            @click="toggleActive"
          >
            <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" />
            {{ user.isActive ? 'Deactivate' : 'Reactivate' }}
          </button>
        </div>
      </div>

    </template>
  </div>
</template>
