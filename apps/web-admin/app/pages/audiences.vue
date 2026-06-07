<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Check, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, UserPlus, UsersRound, X } from 'lucide-vue-next'
import { useMarketingStore, type Contact } from '~/stores/marketing'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Distribution Lists' })

const store = useMarketingStore()
const { segments, contacts, activeRecipients, draftCampaigns, loading, error } = storeToRefs(store)

const search = ref('')
const contactSearch = ref('')
const saveMessage = ref('')
const savingSegment = ref(false)
const savingContact = ref(false)
const editingContactId = ref('')
const savingContactEdit = ref(false)

const newSegment = reactive({
  name: '',
  source: '',
  ownerTeam: 'Marketing',
  status: 'active' as const,
})

const newContact = reactive({
  email: '',
  name: '',
  company: '',
  segmentId: '',
  status: 'subscribed' as const,
})

const editContact = reactive({
  email: '',
  name: '',
  company: '',
  segmentId: '',
  status: 'subscribed' as Contact['status'],
})

onMounted(() => store.loadAll())

const filteredSegments = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return segments.value

  return segments.value.filter((segment) =>
    segment.name.toLowerCase().includes(query) ||
    segment.source.toLowerCase().includes(query) ||
    segment.ownerTeam.toLowerCase().includes(query) ||
    segment.status.toLowerCase().includes(query)
  )
})

const filteredContacts = computed(() => {
  const query = contactSearch.value.trim().toLowerCase()
  if (!query) return contacts.value

  return contacts.value.filter((contact) => {
    const segmentName = contact.segment?.name ?? segments.value.find((segment) => segment.id === contact.segmentId)?.name ?? ''
    return [contact.email, contact.name, contact.company, contact.status, segmentName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

function contactCount(segmentId: string) {
  return contacts.value.filter((contact) => contact.segmentId === segmentId).length
}

function contactListName(contact: Contact) {
  return contact.segment?.name ?? segments.value.find((segment) => segment.id === contact.segmentId)?.name ?? 'No list'
}

function fmt(iso?: string) {
  if (!iso) return 'Not synced'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function createSegment() {
  if (!newSegment.name.trim()) return
  savingSegment.value = true
  saveMessage.value = ''
  try {
    await store.addSegment(newSegment)
    saveMessage.value = 'Distribution list created.'
    newSegment.name = ''
    newSegment.source = ''
    newSegment.ownerTeam = 'Marketing'
  } catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Unable to create distribution list.'
  } finally {
    savingSegment.value = false
  }
}

async function createContact() {
  if (!newContact.email.trim()) return
  savingContact.value = true
  saveMessage.value = ''
  try {
    await store.addContact({
      email: newContact.email,
      name: newContact.name || undefined,
      company: newContact.company || undefined,
      segmentId: newContact.segmentId || undefined,
      status: newContact.status,
    })
    saveMessage.value = 'Contact added.'
    newContact.email = ''
    newContact.name = ''
    newContact.company = ''
  } catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Unable to add contact.'
  } finally {
    savingContact.value = false
  }
}

function startContactEdit(contact: Contact) {
  editingContactId.value = contact.id
  editContact.email = contact.email
  editContact.name = contact.name ?? ''
  editContact.company = contact.company ?? ''
  editContact.segmentId = contact.segmentId ?? ''
  editContact.status = contact.status
}

function cancelContactEdit() {
  editingContactId.value = ''
}

async function saveContact() {
  if (!editingContactId.value || !editContact.email.trim()) return
  savingContactEdit.value = true
  saveMessage.value = ''
  try {
    await store.updateContact(editingContactId.value, {
      email: editContact.email,
      name: editContact.name || null,
      company: editContact.company || null,
      segmentId: editContact.segmentId || null,
      status: editContact.status,
    })
    saveMessage.value = 'Contact updated.'
    editingContactId.value = ''
  } catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Unable to update contact.'
  } finally {
    savingContactEdit.value = false
  }
}

async function deleteContact(contact: Contact) {
  const confirmed = window.confirm(`Remove ${contact.email} from internal marketing contacts?`)
  if (!confirmed) return
  saveMessage.value = ''
  try {
    await store.removeContact(contact.id)
    saveMessage.value = 'Contact removed.'
  } catch (err) {
    saveMessage.value = err instanceof Error ? err.message : 'Unable to remove contact.'
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Internal Recipients</p>
        <h1 class="text-[26px] font-display font-black uppercase tracking-wide text-white/90">Distribution Lists</h1>
        <p class="mt-1 text-[13px] text-white/42">Controlled contact groups for internal team comms.</p>
      </div>
      <div class="grid grid-cols-3 gap-2 md:min-w-[430px]">
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Contacts</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ activeRecipients.toLocaleString() }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Lists</p>
          <p class="mt-1 text-lg font-semibold text-teal">{{ segments.length }}</p>
        </div>
        <div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2">
          <p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Drafts</p>
          <p class="mt-1 text-lg font-semibold text-white/88">{{ draftCampaigns }}</p>
        </div>
      </div>
    </div>

    <div v-if="saveMessage" class="rounded-md border border-teal/20 bg-teal/10 px-4 py-2.5 text-[12px] text-teal/90">
      {{ saveMessage }}
    </div>
    <div v-if="error" class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">
      {{ error }}
    </div>

    <div class="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]">
        <div class="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div class="relative w-full md:max-w-sm">
            <Search class="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              v-model="search"
              placeholder="Search distribution lists"
              class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"
            />
          </div>
          <button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-2 text-[11px] text-white/50 hover:bg-white/[0.05]" @click="store.loadAll">
            <RefreshCw class="h-3.5 w-3.5" :class="loading ? 'animate-spin' : ''" />
            Refresh
          </button>
        </div>

        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded-md bg-white/[0.04]" />
        </div>

        <div v-else class="overflow-x-auto">
          <div class="grid min-w-[760px] grid-cols-[1.5fr_1fr_100px_120px_120px] border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/28">
            <span>List</span>
            <span>Owner</span>
            <span>Contacts</span>
            <span>Status</span>
            <span>Updated</span>
          </div>

          <div
            v-for="segment in filteredSegments"
            :key="segment.id"
            class="grid min-w-[760px] grid-cols-[1.5fr_1fr_100px_120px_120px] items-center border-b border-white/[0.04] px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.025]"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-white/82">{{ segment.name }}</p>
              <p class="mt-0.5 text-[11px] text-white/30">{{ segment.source }}</p>
            </div>
            <span class="text-white/45">{{ segment.ownerTeam }}</span>
            <span class="font-medium text-white/76">{{ contactCount(segment.id) }}</span>
            <span
              class="w-max rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="segment.status === 'active'
                ? 'border-teal/22 bg-teal/10 text-teal/85'
                : segment.status === 'paused'
                  ? 'border-warn/22 bg-warn/10 text-warn/85'
                  : 'border-white/[0.10] bg-white/[0.05] text-white/45'"
            >
              {{ segment.status }}
            </span>
            <span class="text-white/30">{{ fmt(segment.updatedAt) }}</span>
          </div>
        </div>

        <div v-if="!loading && !filteredSegments.length" class="px-5 py-14 text-center">
          <UsersRound class="mx-auto mb-3 h-8 w-8 text-white/14" />
          <p class="text-[12px] text-white/35">No distribution lists yet.</p>
        </div>
      </section>

      <aside class="space-y-5">
        <section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-4 flex items-center gap-2">
            <Plus class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Add List</h2>
          </div>
          <form class="space-y-3" @submit.prevent="createSegment">
            <input v-model="newSegment.name" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Ops release recipients" />
            <input v-model="newSegment.source" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Manual import" />
            <input v-model="newSegment.ownerTeam" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Owner team" />
            <button class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60" :disabled="savingSegment">
              <Loader2 v-if="savingSegment" class="h-3.5 w-3.5 animate-spin" />
              <Plus v-else class="h-3.5 w-3.5" />
              Create list
            </button>
          </form>
        </section>

        <section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <div class="mb-4 flex items-center gap-2">
            <UserPlus class="h-4 w-4 text-teal/80" />
            <h2 class="text-[13px] font-semibold text-white/82">Add Contact</h2>
          </div>
          <form class="space-y-3" @submit.prevent="createContact">
            <input v-model="newContact.email" type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="name@company.com" />
            <input v-model="newContact.name" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Name" />
            <input v-model="newContact.company" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Company or team" />
            <select v-model="newContact.segmentId" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45">
              <option value="">No list</option>
              <option v-for="segment in segments" :key="segment.id" :value="segment.id">{{ segment.name }}</option>
            </select>
            <button class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60" :disabled="savingContact">
              <Loader2 v-if="savingContact" class="h-3.5 w-3.5 animate-spin" />
              <UserPlus v-else class="h-3.5 w-3.5" />
              Add contact
            </button>
          </form>
        </section>

        <section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4">
          <h2 class="mb-3 text-[13px] font-semibold text-white/82">Recent Contacts</h2>
          <div class="space-y-2">
            <div v-for="contact in contacts.slice(0, 6)" :key="contact.id" class="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2">
              <div class="min-w-0">
                <p class="truncate text-[12px] font-medium text-white/78">{{ contact.name || contact.email }}</p>
                <p class="truncate text-[11px] text-white/32">{{ contact.email }}</p>
              </div>
              <span class="shrink-0 rounded-md border border-teal/22 bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal/85">
                {{ contact.status }}
              </span>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <section class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]">
      <div class="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-[13px] font-semibold text-white/82">Contacts</h2>
          <p class="mt-0.5 text-[11px] text-white/34">Edit profile details, subscription state, and distribution list assignment.</p>
        </div>
        <div class="relative w-full md:max-w-sm">
          <Search class="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            v-model="contactSearch"
            placeholder="Search contacts"
            class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="grid min-w-[980px] grid-cols-[1.35fr_1fr_1.15fr_150px_120px] border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/28">
          <span>Contact</span>
          <span>Company</span>
          <span>Distribution List</span>
          <span>Status</span>
          <span class="text-right">Actions</span>
        </div>

        <div
          v-for="contact in filteredContacts"
          :key="contact.id"
          class="grid min-w-[980px] grid-cols-[1.35fr_1fr_1.15fr_150px_120px] items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.025]"
        >
          <template v-if="editingContactId === contact.id">
            <div class="space-y-2">
              <input v-model="editContact.email" type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" />
              <input v-model="editContact.name" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Name" />
            </div>
            <input v-model="editContact.company" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Company or team" />
            <select v-model="editContact.segmentId" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45">
              <option value="">No list</option>
              <option v-for="segment in segments" :key="segment.id" :value="segment.id">{{ segment.name }}</option>
            </select>
            <select v-model="editContact.status" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45">
              <option value="subscribed">Subscribed</option>
              <option value="bounced">Bounced</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <div class="flex justify-end gap-2">
              <button class="flex h-8 w-8 items-center justify-center rounded-md border border-teal/25 bg-teal/10 text-teal hover:bg-teal/15 disabled:opacity-60" :disabled="savingContactEdit" title="Save contact" @click="saveContact">
                <Loader2 v-if="savingContactEdit" class="h-3.5 w-3.5 animate-spin" />
                <Check v-else class="h-3.5 w-3.5" />
              </button>
              <button class="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.05]" title="Cancel edit" @click="cancelContactEdit">
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
          </template>

          <template v-else>
            <div class="min-w-0">
              <p class="truncate font-medium text-white/82">{{ contact.name || contact.email }}</p>
              <p class="mt-0.5 truncate text-[11px] text-white/30">{{ contact.email }}</p>
            </div>
            <span class="truncate text-white/45">{{ contact.company || 'No company' }}</span>
            <span class="truncate text-white/60">{{ contactListName(contact) }}</span>
            <span
              class="w-max rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              :class="contact.status === 'subscribed'
                ? 'border-teal/22 bg-teal/10 text-teal/85'
                : contact.status === 'bounced'
                  ? 'border-warn/22 bg-warn/10 text-warn/85'
                  : 'border-white/[0.10] bg-white/[0.05] text-white/45'"
            >
              {{ contact.status }}
            </span>
            <div class="flex justify-end gap-2">
              <button class="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-white/55 hover:bg-white/[0.05]" title="Edit contact" @click="startContactEdit(contact)">
                <Pencil class="h-3.5 w-3.5" />
              </button>
              <button class="flex h-8 w-8 items-center justify-center rounded-md border border-err/20 text-err/75 hover:bg-err/10" title="Remove contact" @click="deleteContact(contact)">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="!loading && !filteredContacts.length" class="px-5 py-14 text-center">
        <UserPlus class="mx-auto mb-3 h-8 w-8 text-white/14" />
        <p class="text-[12px] text-white/35">No contacts match this view.</p>
      </div>
    </section>
  </div>
</template>

