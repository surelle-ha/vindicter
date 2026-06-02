<script setup lang="ts">
import { GripVertical, Plus, Trash2, Eye, EyeOff } from 'lucide-vue-next'
import type { KanbanColumn, Role } from '~/types/vindicta'
import { DEFAULT_KANBAN_COLUMNS, DEFAULT_ROLES } from '~/types/vindicta'
import { generateId } from '~/utils/id'

const props = defineProps<{ projectPath: string }>()

const { read, patchSettings } = useVindicterJson()

const columns = ref<KanbanColumn[]>([])
const roles = ref<Role[]>([])
const saving = ref(false)
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

function addRole() {
  if (!newRoleName.value.trim()) return
  roles.value.push({ id: generateId(), name: newRoleName.value.trim(), color: newRoleColor.value })
  newRoleName.value = ''
}

function removeRole(id: string) {
  roles.value = roles.value.filter((r) => r.id !== id)
}

async function save() {
  saving.value = true
  try {
    await patchSettings(props.projectPath, { kanbanColumns: columns.value, roles: roles.value })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Kanban columns -->
    <section>
      <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Kanban columns</h3>
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
          <button class="p-1 rounded text-white/20 hover:text-white/50 transition-colors" title="Move up" :disabled="i === 0" @click="moveColumn(i, -1)">↑</button>
          <button class="p-1 rounded text-white/20 hover:text-white/50 transition-colors" title="Move down" :disabled="i === columns.length - 1" @click="moveColumn(i, 1)">↓</button>
        </div>
      </div>
    </section>

    <!-- Roles -->
    <section>
      <h3 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Roles</h3>
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
      <!-- Add role -->
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
    </section>

    <!-- Save -->
    <div class="flex justify-end pt-2 border-t border-white/[0.07]">
      <button
        class="text-sm px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save settings' }}
      </button>
    </div>
  </div>
</template>
