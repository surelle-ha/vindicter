import { nanoid } from 'nanoid'
import type { CustomLesson } from '~/data/curriculum'

// ── .va file format ───────────────────────────────────────────────────────────
// Binary layout: [17-byte magic header] + [gzip-compressed JSON payload]
// Magic: "VINDICTA-ACADEMY\0" (ASCII, 17 bytes)

const MAGIC = 'VINDICTA-ACADEMY\0'
const MAGIC_LEN = 17
const AUDIO_CACHE = 'vindicter-academy-tts'

export interface VAFile {
  va_version: 1
  manifest: {
    id: string
    title: string
    subtitle: string
    week: number
    day: number
    section: string
    sectionOrder: number  // 0 = not explicitly set; falls back to week-based sort
    duration: string
    objectives: string[]
    labHint?: string
    prerequisiteId?: string | null
    exportedAt: string
    exportedBy: 'vindicter-desktop'
  }
  content: string
  agentNotes: string
  audio: {
    voice: string
    generatedAt: string
    data: string  // base64 WAV
  } | null
}

// ── Encode / Decode ───────────────────────────────────────────────────────────

async function buildVAFile(payload: VAFile): Promise<Uint8Array> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload))
  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(jsonBytes)
  writer.close()
  const compressed = new Uint8Array(await new Response(stream.readable).arrayBuffer())
  const magic = new TextEncoder().encode(MAGIC)
  const out = new Uint8Array(magic.length + compressed.length)
  out.set(magic, 0)
  out.set(compressed, magic.length)
  return out
}

async function parseVAFile(bytes: Uint8Array): Promise<VAFile> {
  const header = new TextDecoder().decode(bytes.slice(0, MAGIC_LEN))
  if (header !== MAGIC) throw new Error('Not a valid Vindicter Academy (.va) file')
  const compressed = bytes.slice(MAGIC_LEN)
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(compressed)
  writer.close()
  const json = await new Response(stream.readable).text()
  const payload = JSON.parse(json) as VAFile
  if (payload.va_version !== 1) throw new Error('Unsupported .va file version')
  return payload
}

function vaFileToCustomLesson(va: VAFile, vaFilename: string): CustomLesson {
  return {
    id: va.manifest.id,
    day: va.manifest.day,
    week: va.manifest.week,
    title: va.manifest.title,
    subtitle: va.manifest.subtitle || '',
    prerequisiteId: va.manifest.prerequisiteId ?? null,
    duration: va.manifest.duration,
    objectives: va.manifest.objectives,
    content: va.content,
    labHint: va.manifest.labHint,
    agentNotes: va.agentNotes,
    section: va.manifest.section || 'Unsectioned',
    sectionOrder: va.manifest.sectionOrder ?? 0,
    vaFilename,
    embeddedAudio: va.audio,
  }
}

// ── course-bin directory ──────────────────────────────────────────────────────

async function ensureCourseBin(): Promise<string> {
  const { appLocalDataDir } = await import('@tauri-apps/api/path')
  const { mkdir, exists } = await import('@tauri-apps/plugin-fs')
  const base = await appLocalDataDir()
  const sep = base.includes('\\') ? '\\' : '/'
  const dir = `${base}${sep}course-bin`
  if (!(await exists(dir))) await mkdir(dir, { recursive: true })
  return dir
}

async function loadCourseBin(): Promise<CustomLesson[]> {
  try {
    const dir = await ensureCourseBin()
    const { readDir, readFile } = await import('@tauri-apps/plugin-fs')
    const entries = await readDir(dir)
    const sep = dir.includes('\\') ? '\\' : '/'
    const raw: CustomLesson[] = []
    for (const entry of entries as any[]) {
      if (!entry.name?.endsWith('.va')) continue
      try {
        const path = `${dir}${sep}${entry.name}`
        const bytes = await readFile(path)
        const va = await parseVAFile(new Uint8Array(bytes))
        raw.push(vaFileToCustomLesson(va, entry.name))
      } catch {
        // skip corrupted files silently
      }
    }

    // Group by section, compute stable sort key for each section
    const sectionMap = new Map<string, CustomLesson[]>()
    for (const lesson of raw) {
      const sec = lesson.section || 'Unsectioned'
      if (!sectionMap.has(sec)) sectionMap.set(sec, [])
      sectionMap.get(sec)!.push(lesson)
    }

    // Sort sections: explicit sectionOrder (> 0) takes precedence;
    // fall back to minimum week number so the original curriculum order is preserved
    const sectionEntries = [...sectionMap.entries()].map(([name, items]) => {
      const explicitOrder = items[0]?.sectionOrder ?? 0
      const minWeek = Math.min(...items.map(l => l.week))
      // week 99 (user-created) goes after everything else unless explicitly ordered
      const fallback = minWeek === 99 ? 999 + name.charCodeAt(0) : minWeek
      return { name, items, sortKey: explicitOrder > 0 ? explicitOrder : fallback }
    })
    sectionEntries.sort((a, b) =>
      a.sortKey !== b.sortKey ? a.sortKey - b.sortKey : a.name.localeCompare(b.name),
    )

    const result: CustomLesson[] = []
    for (const { items } of sectionEntries) {
      items.sort((a, b) => a.day - b.day)
      result.push(...items)
    }
    return result
  } catch {
    return []
  }
}

async function saveToCourseBin(bytes: Uint8Array, filename: string): Promise<void> {
  const dir = await ensureCourseBin()
  const { writeFile } = await import('@tauri-apps/plugin-fs')
  const sep = dir.includes('\\') ? '\\' : '/'
  await writeFile(`${dir}${sep}${filename}`, bytes)
}

async function deleteFromCourseBin(filename: string): Promise<void> {
  const dir = await ensureCourseBin()
  const { remove } = await import('@tauri-apps/plugin-fs')
  const sep = dir.includes('\\') ? '\\' : '/'
  await remove(`${dir}${sep}${filename}`)
}

async function clearCourseBin(): Promise<void> {
  const dir = await ensureCourseBin()
  const { readDir, remove } = await import('@tauri-apps/plugin-fs')
  const sep = dir.includes('\\') ? '\\' : '/'
  const entries = await readDir(dir)
  for (const entry of entries as any[]) {
    if (!entry.name?.endsWith('.va')) continue
    await remove(`${dir}${sep}${entry.name}`)
  }
}

// ── Dialog helpers ────────────────────────────────────────────────────────────

async function importVAFile(): Promise<CustomLesson | null> {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Vindicter Academy Lesson', extensions: ['va'] }],
    })
    if (!selected || typeof selected !== 'string') return null
    const { readFile } = await import('@tauri-apps/plugin-fs')
    const bytes = new Uint8Array(await readFile(selected))
    const va = await parseVAFile(bytes)
    const filename = selected.split(/[\\/]/).pop()!
    await saveToCourseBin(bytes, filename)
    return vaFileToCustomLesson(va, filename)
  } catch (err) {
    throw new Error(`Import failed: ${(err as Error).message}`)
  }
}

async function exportVAFile(lesson: CustomLesson): Promise<void> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')

  const destPath = await save({
    defaultPath: `${lesson.title.replace(/[^\w\s-]/g, '').trim()}.va`,
    filters: [{ name: 'Vindicter Academy Lesson', extensions: ['va'] }],
  })
  if (!destPath) return

  const bytes = await buildVAFile(lessonToVAFile(lesson))
  await writeFile(destPath, bytes)
}

// ── TTS audio bridge ──────────────────────────────────────────────────────────

async function loadEmbeddedAudio(lessonId: string, base64Wav: string): Promise<void> {
  if (typeof caches === 'undefined') return
  const cache = await caches.open(AUDIO_CACHE)
  const key = `lesson-audio-${lessonId}`
  if (await cache.match(key)) return  // already cached
  const binary = Uint8Array.from(atob(base64Wav), c => c.charCodeAt(0))
  const blob = new Blob([binary], { type: 'audio/wav' })
  await cache.put(key, new Response(blob, { headers: { 'Content-Type': 'audio/wav' } }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lessonToVAFile(lesson: CustomLesson): VAFile {
  return {
    va_version: 1,
    manifest: {
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.subtitle || '',
      prerequisiteId: lesson.prerequisiteId ?? null,
      week: lesson.week,
      day: lesson.day,
      section: lesson.section,
      sectionOrder: lesson.sectionOrder ?? 0,
      duration: lesson.duration,
      objectives: lesson.objectives,
      labHint: lesson.labHint,
      exportedAt: new Date().toISOString(),
      exportedBy: 'vindicter-desktop',
    },
    content: lesson.content,
    agentNotes: lesson.agentNotes,
    audio: lesson.embeddedAudio,
  }
}

// ── Create new lesson skeleton ────────────────────────────────────────────────

function createBlankLesson(existingCount: number, section = ''): CustomLesson {
  return {
    id: `custom-${nanoid(8)}`,
    day: existingCount + 1,
    week: 99,
    title: '',
    subtitle: '',
    prerequisiteId: null,
    duration: '30 min',
    objectives: [''],
    content: '# Lesson Title\n\nWrite your lesson content here.',
    labHint: undefined,
    agentNotes: '',
    section,
    sectionOrder: 0,
    vaFilename: '',
    embeddedAudio: null,
  }
}

// ── Seed course-bin from bundled resources on first launch ───────────────────

async function clearLessonTtsAudio(lessonId: string): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open(AUDIO_CACHE)
      await cache.delete(`lesson-audio-${lessonId}`)
    }
  } catch { /* ignore */ }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('vindicter:academy:tts:cache')
      if (raw) {
        const meta = JSON.parse(raw) as Record<string, unknown>
        delete meta[lessonId]
        localStorage.setItem('vindicter:academy:tts:cache', JSON.stringify(meta))
      }
    }
  } catch { /* ignore */ }
}

async function seedCourseBin(): Promise<void> {
  try {
    const { resourceDir } = await import('@tauri-apps/api/path')
    const { readDir, readFile, writeFile, exists } = await import('@tauri-apps/plugin-fs')

    const userDir = await ensureCourseBin()
    const resDir = await resourceDir()
    const sep = resDir.includes('\\') ? '\\' : '/'
    // Tauri places bundled resources at resourceDir/course-bin/ (matching the glob key)
    const bundledDir = `${resDir}${sep}course-bin`

    if (!(await exists(bundledDir))) return

    const bundledEntries = await readDir(bundledDir)
    for (const entry of bundledEntries as any[]) {
      if (!entry.name?.endsWith('.va')) continue
      const bundledPath = `${bundledDir}${sep}${entry.name}`
      const destPath    = `${userDir}${sep}${entry.name}`

      const bundledBytes = new Uint8Array(await readFile(bundledPath))

      if (!(await exists(destPath))) {
        // New file — just copy
        await writeFile(destPath, bundledBytes)
        continue
      }

      // File exists — compare exportedAt to decide whether to overwrite
      try {
        const installedBytes = new Uint8Array(await readFile(destPath))
        const bundledVa   = await parseVAFile(bundledBytes)
        const installedVa = await parseVAFile(installedBytes)

        const bundledTime   = new Date(bundledVa.manifest.exportedAt).getTime()
        const installedTime = new Date(installedVa.manifest.exportedAt).getTime()

        if (bundledTime > installedTime) {
          // Bundled version is newer: overwrite AppData file and wipe user-generated audio
          await writeFile(destPath, bundledBytes)
          await clearLessonTtsAudio(installedVa.manifest.id)
        }
        // else: keep existing (user may have customised it, or it's already up to date)
      } catch {
        // Can't parse one or both files — skip to preserve whatever is on disk
      }
    }
  } catch {
    // best-effort; app works fine without bundled resources
  }
}

// ── Save lesson to course-bin (creates/updates .va) ───────────────────────────

async function saveLessonToCourseBin(lesson: CustomLesson, existingFilename?: string): Promise<string> {
  const filename = existingFilename || `${lesson.id}.va`
  const bytes = await buildVAFile(lessonToVAFile(lesson))
  await saveToCourseBin(bytes, filename)
  return filename
}

// ── Save lesson to bundled resourceDir/course-bin ─────────────────────────────

async function saveLessonToBundledCourseBin(lesson: CustomLesson, existingFilename?: string): Promise<string> {
  const filename = existingFilename || `${lesson.id}.va`
  const bytes = await buildVAFile(lessonToVAFile(lesson))
  const { resourceDir } = await import('@tauri-apps/api/path')
  const { writeFile, exists, mkdir } = await import('@tauri-apps/plugin-fs')
  const resDir = await resourceDir()
  const sep = resDir.includes('\\') ? '\\' : '/'
  const bundledDir = `${resDir}${sep}course-bin`
  if (!(await exists(bundledDir))) await mkdir(bundledDir, { recursive: true })
  await writeFile(`${bundledDir}${sep}${filename}`, bytes)
  return filename
}

// ── List filenames from bundled course-bin (resourceDir) ──────────────────────

async function getBundledFilenames(): Promise<Set<string>> {
  try {
    const { resourceDir } = await import('@tauri-apps/api/path')
    const { readDir, exists } = await import('@tauri-apps/plugin-fs')
    const resDir = await resourceDir()
    const sep = resDir.includes('\\') ? '\\' : '/'
    const bundledDir = `${resDir}${sep}course-bin`
    if (!(await exists(bundledDir))) return new Set()
    const entries = await readDir(bundledDir)
    return new Set(
      (entries as any[]).filter(e => e.name?.endsWith('.va')).map(e => e.name as string),
    )
  } catch {
    return new Set()
  }
}

// ── Rename a section across all its lessons ───────────────────────────────────

async function renameSection(oldName: string, newName: string, allLessons: CustomLesson[]): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed || trimmed === oldName) return
  const promises: Promise<void>[] = []
  for (const lesson of allLessons) {
    if ((lesson.section || 'Unsectioned') !== oldName) continue
    const updated: CustomLesson = { ...lesson, section: trimmed }
    promises.push(saveLessonToCourseBin(updated, lesson.vaFilename).then(() => {}))
  }
  await Promise.all(promises)
}

async function renameSectionInBundled(oldName: string, newName: string): Promise<void> {
  const trimmed = newName.trim()
  if (!trimmed || trimmed === oldName) return
  const { resourceDir } = await import('@tauri-apps/api/path')
  const { readDir, readFile, writeFile, exists } = await import('@tauri-apps/plugin-fs')
  const resDir = await resourceDir()
  const sep = resDir.includes('\\') ? '\\' : '/'
  const bundledDir = `${resDir}${sep}course-bin`
  if (!(await exists(bundledDir))) return
  const entries = await readDir(bundledDir)
  for (const entry of entries as any[]) {
    if (!entry.name?.endsWith('.va')) continue
    const path = `${bundledDir}${sep}${entry.name}`
    const bytes = new Uint8Array(await readFile(path))
    let va: VAFile
    try { va = await parseVAFile(bytes) } catch { continue }
    if ((va.manifest.section || 'Unsectioned') !== oldName) continue
    va.manifest.section = trimmed
    await writeFile(path, await buildVAFile(va))
  }
}

// ── Reorder sections by updating sectionOrder on all affected lessons ─────────

async function reorderSections(orderedSectionNames: string[], allLessons: CustomLesson[]): Promise<void> {
  const promises: Promise<void>[] = []
  for (let i = 0; i < orderedSectionNames.length; i++) {
    const sectionName = orderedSectionNames[i]
    const newOrder = i + 1  // 1-based so it's always > 0 (distinguishes from "not set")
    const sectionLessons = allLessons.filter(l => (l.section || 'Unsectioned') === sectionName)
    for (const lesson of sectionLessons) {
      if (lesson.sectionOrder === newOrder) continue
      const updated: CustomLesson = { ...lesson, sectionOrder: newOrder }
      promises.push(saveLessonToCourseBin(updated, lesson.vaFilename).then(() => {}))
    }
  }
  await Promise.all(promises)
}

export function useAcademyStudio() {
  return {
    buildVAFile,
    parseVAFile,
    loadCourseBin,
    saveToCourseBin,
    deleteFromCourseBin,
    clearCourseBin,
    importVAFile,
    exportVAFile,
    loadEmbeddedAudio,
    createBlankLesson,
    saveLessonToCourseBin,
    saveLessonToBundledCourseBin,
    reorderSections,
    renameSection,
    renameSectionInBundled,
    seedCourseBin,
    getBundledFilenames,
  }
}
