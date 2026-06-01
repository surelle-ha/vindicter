<script setup lang="ts">
import { Loader2, Save, User, Mail, Shield, Calendar, KeyRound, Pencil, X } from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Profile — Vindicta' })

const supabase = useSupabase()
const { user, isAdmin, init } = useAuth()

const editing   = ref(false)
const saving    = ref(false)
const resetting = ref(false)
const saveMsg   = ref('')
const saveErr   = ref('')
const newName   = ref('')

const profile = computed(() => {
  if (!user.value) return null
  const u = user.value as Record<string, unknown>
  const meta = u.user_metadata as Record<string, unknown> | undefined
  return {
    id:          u.id as string,
    email:       u.email as string,
    displayName: (meta?.display_name as string) ?? (u.email as string) ?? 'User',
    createdAt:   u.created_at as string | undefined,
  }
})

function startEdit() {
  newName.value  = profile.value?.displayName ?? ''
  saveMsg.value  = ''
  saveErr.value  = ''
  editing.value  = true
}

function cancelEdit() {
  editing.value = false
  saveMsg.value = ''
  saveErr.value = ''
}

async function saveProfile() {
  saveErr.value = ''
  saveMsg.value = ''
  if (!newName.value.trim()) { saveErr.value = 'Name cannot be empty.'; return }
  saving.value = true
  try {
    const { error } = await supabase.auth.updateUser({ data: { display_name: newName.value.trim() } })
    if (error) throw error
    await init()
    editing.value = false
    saveMsg.value = 'Profile updated successfully.'
  } catch (e) {
    saveErr.value = e instanceof Error ? e.message : 'Failed to update profile.'
  } finally {
    saving.value = false
  }
}

async function sendPasswordReset() {
  if (!profile.value?.email) return
  saveMsg.value  = ''
  saveErr.value  = ''
  resetting.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(profile.value.email)
    if (error) throw error
    saveMsg.value = `Password reset link sent to ${profile.value.email}.`
  } catch (e) {
    saveErr.value = e instanceof Error ? e.message : 'Failed to send reset email.'
  } finally {
    resetting.value = false
  }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-2xl mx-auto">

    <!-- Header -->
    <div class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style="color:rgba(139,92,246,0.70);">Account</p>
      <h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="color:rgba(255,255,255,0.90);">My Profile</h1>
      <p class="mt-1 text-[13px]" style="color:rgba(255,255,255,0.40);">Manage your account information and security settings.</p>
    </div>

    <!-- Feedback messages -->
    <div v-if="saveMsg" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);">
      {{ saveMsg }}
    </div>
    <div v-if="saveErr" class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.85);">
      {{ saveErr }}
    </div>

    <!-- Identity card -->
    <div class="rounded-2xl p-6 mb-4" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style="color:rgba(255,255,255,0.22);">Identity</p>

      <div class="space-y-4">

        <!-- Display name -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.18);">
              <User class="h-3.5 w-3.5" style="color:rgba(167,139,250,0.70);" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.30);">Display name</p>
              <div v-if="!editing">
                <p class="text-[14px] font-medium" style="color:rgba(255,255,255,0.85);">{{ profile?.displayName }}</p>
              </div>
              <div v-else class="flex items-center gap-2">
                <input
                  v-model="newName"
                  class="flex-1 rounded-lg px-3 py-1.5 text-[13px] text-white outline-none transition-colors border border-white/10 bg-white/[0.05] focus:border-accent/45"
                  placeholder="Your name"
                  @keydown.enter="saveProfile"
                  @keydown.escape="cancelEdit"
                />
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
            <template v-if="!editing">
              <button
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.07] cursor-pointer"
                style="color:rgba(255,255,255,0.40);"
                @click="startEdit"
              >
                <Pencil class="h-3 w-3" />
                Edit
              </button>
            </template>
            <template v-else>
              <button
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.07] cursor-pointer"
                style="color:rgba(255,255,255,0.35);"
                :disabled="saving"
                @click="cancelEdit"
              >
                <X class="h-3 w-3" />
                Cancel
              </button>
              <button
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors bg-accent/15 hover:bg-accent/25 cursor-pointer disabled:opacity-50"
                style="color:rgba(167,139,250,0.90);"
                :disabled="saving"
                @click="saveProfile"
              >
                <Loader2 v-if="saving" class="h-3 w-3 animate-spin" />
                <Save v-else class="h-3 w-3" />
                Save
              </button>
            </template>
          </div>
        </div>

        <div class="h-px" style="background:rgba(255,255,255,0.05);" />

        <!-- Email -->
        <div class="flex items-start gap-3">
          <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);">
            <Mail class="h-3.5 w-3.5" style="color:rgba(255,255,255,0.35);" />
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.30);">Email address</p>
            <p class="text-[14px] font-medium" style="color:rgba(255,255,255,0.85);">{{ profile?.email }}</p>
            <p class="text-[11px] mt-0.5" style="color:rgba(255,255,255,0.25);">Email cannot be changed here.</p>
          </div>
        </div>

        <div class="h-px" style="background:rgba(255,255,255,0.05);" />

        <!-- Role -->
        <div class="flex items-start gap-3">
          <div
            class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center"
            :style="isAdmin
              ? 'background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.18);'
              : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);'"
          >
            <Shield class="h-3.5 w-3.5" :style="isAdmin ? 'color:rgba(167,139,250,0.70);' : 'color:rgba(255,255,255,0.35);'" />
          </div>
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.30);">Role</p>
            <span
              class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              :style="isAdmin
                ? 'background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);'
                : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);'"
            >
              {{ isAdmin ? 'Administrator' : 'Member' }}
            </span>
          </div>
        </div>

        <template v-if="profile?.createdAt">
          <div class="h-px" style="background:rgba(255,255,255,0.05);" />
          <div class="flex items-start gap-3">
            <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);">
              <Calendar class="h-3.5 w-3.5" style="color:rgba(255,255,255,0.35);" />
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color:rgba(255,255,255,0.30);">Member since</p>
              <p class="text-[14px] font-medium" style="color:rgba(255,255,255,0.85);">{{ fmt(profile.createdAt) }}</p>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- Security card -->
    <div class="rounded-2xl p-6" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
      <p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style="color:rgba(255,255,255,0.22);">Security</p>

      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.18);">
            <KeyRound class="h-3.5 w-3.5" style="color:rgba(251,191,36,0.70);" />
          </div>
          <div>
            <p class="text-[13px] font-semibold" style="color:rgba(255,255,255,0.80);">Password</p>
            <p class="text-[11px] mt-0.5 leading-relaxed" style="color:rgba(255,255,255,0.30);">A password reset link will be sent to your email address.</p>
          </div>
        </div>
        <button
          class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/[0.07] cursor-pointer disabled:opacity-50"
          style="color:rgba(255,255,255,0.50);border:1px solid rgba(255,255,255,0.09);"
          :disabled="resetting"
          @click="sendPasswordReset"
        >
          <Loader2 v-if="resetting" class="h-3 w-3 animate-spin" />
          Reset password
        </button>
      </div>
    </div>

  </div>
</template>
