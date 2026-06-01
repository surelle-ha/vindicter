export interface StackItem {
  language: string
  manager: string
  color: string
  bg: string
  border: string
}

// Ordered by prevalence — first match per language wins
const MANIFEST_MAP: Array<{ file: RegExp | string; language: string; manager: string; color: string; bg: string; border: string }> = [
  { file: 'package.json',        language: 'Node.js',     manager: 'npm',         color: 'text-green-300',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  { file: 'Cargo.toml',          language: 'Rust',        manager: 'cargo',       color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { file: 'go.mod',              language: 'Go',          manager: 'go modules',  color: 'text-sky-300',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20'    },
  { file: 'requirements.txt',    language: 'Python',      manager: 'pip',         color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { file: 'pyproject.toml',      language: 'Python',      manager: 'poetry',      color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { file: 'Pipfile',             language: 'Python',      manager: 'pipenv',      color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { file: 'pom.xml',             language: 'Java',        manager: 'maven',       color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  { file: 'build.gradle',        language: 'Java/Kotlin', manager: 'gradle',      color: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  { file: 'build.gradle.kts',    language: 'Kotlin',      manager: 'gradle',      color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { file: 'composer.json',       language: 'PHP',         manager: 'composer',    color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { file: 'Gemfile',             language: 'Ruby',        manager: 'bundler',     color: 'text-rose-300',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  { file: 'pubspec.yaml',        language: 'Dart/Flutter',manager: 'pub',         color: 'text-teal-300',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20'   },
  { file: 'mix.exs',             language: 'Elixir',      manager: 'mix',         color: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { file: /\.csproj$/,           language: 'C#',          manager: 'nuget',       color: 'text-cyan-300',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20'   },
  { file: 'CMakeLists.txt',      language: 'C/C++',       manager: 'cmake',       color: 'text-zinc-300',   bg: 'bg-zinc-500/10',   border: 'border-zinc-500/20'   },
  { file: 'Package.swift',       language: 'Swift',       manager: 'spm',         color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
]

// Package manager lock file overrides for Node.js
const NODE_LOCK_FILES: Array<{ file: string; manager: string }> = [
  { file: 'pnpm-lock.yaml', manager: 'pnpm' },
  { file: 'yarn.lock',      manager: 'yarn' },
  { file: 'bun.lockb',      manager: 'bun'  },
  { file: 'package-lock.json', manager: 'npm' },
]

export async function detectProjectStack(projectPath: string): Promise<StackItem[]> {
  const fs = useTauriFs()
  const sep = projectPath.includes('\\') ? '\\' : '/'
  const seenLangs = new Set<string>()
  const result: StackItem[] = []

  // Scan top-level directory for manifest files
  const entries = await fs.readDir(projectPath).catch(() => [] as { name: string; isDir: boolean }[])
  const fileNames = entries.filter(e => !e.isDir).map(e => e.name)

  for (const spec of MANIFEST_MAP) {
    const match = typeof spec.file === 'string'
      ? fileNames.includes(spec.file)
      : fileNames.some(name => (spec.file as RegExp).test(name))
    if (!match) continue
    if (seenLangs.has(spec.language)) continue  // deduplicate same language
    seenLangs.add(spec.language)

    let manager = spec.manager
    // Detect specific Node.js package manager from lock files
    if (spec.language === 'Node.js') {
      for (const lock of NODE_LOCK_FILES) {
        if (fileNames.includes(lock.file)) { manager = lock.manager; break }
      }
    }

    result.push({ language: spec.language, manager, color: spec.color, bg: spec.bg, border: spec.border })
  }

  return result
}
