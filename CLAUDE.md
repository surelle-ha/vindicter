# CLAUDE.md

Instructions for Claude Code when working in this repository.

## Project Identity

Vindicta is a **local-first AI-powered security platform** built as a desktop app. It is NOT a project management tool — all project-management terminology and UI has been removed. Keep security-focused language throughout. Do not mention the underlying desktop framework (e.g. Tauri) in any user-visible text.

## Tech Stack

- **Frontend**: Nuxt 4 (Vue 3 Composition API, `<script setup lang="ts">`) + Tailwind CSS v4
- **Desktop runtime**: Tauri 2 (Rust backend, WebView2 frontend)
- **State**: Pinia stores (`apps/desktop/app/stores/`)
- **Persistence**: Tauri plugin-store (`.bin` files via `useTauriStore`) + localStorage fallback
- **AI integrations**: Claude Code CLI, Codex CLI, OpenRouter API, Ollama local server
- **Icons**: lucide-vue-next only (no other icon libraries)
- **Fonts**: Ubuntu (body), Playfair Display (display/headings)

## Commands

Run from repo root:

```bash
# Desktop dev server (Nuxt only, no Tauri shell)
pnpm desktop:dev
# or:
pnpm --filter @vindicta/desktop dev

# Full Tauri dev (native window, Rust backend)
pnpm --filter @vindicta/desktop tauri:dev

# Build check (fastest correctness verification)
pnpm --filter @vindicta/desktop build

# Landing page
pnpm landing:dev
```

## Key Directories

```
apps/desktop/
  app/
    pages/          # Route-level screens (ai-models, security, profile, settings…)
    components/
      security/     # SecurityWorkspace and its sub-tabs
      ui/           # Shared: GlassButton, GlassInput, GlassModal, GlassCheckbox…
    composables/    # useClaudeShell, useCodexShell, useOpenRouterAI, useOllamaAI…
    stores/         # app.ts (settings), auth.ts (GitHub OAuth), security.ts…
    types/          # vindicta.ts (ProjectMeta, SecurityFinding, SecurityScan…)
    utils/          # docx.ts, markdown.ts, date.ts…
  tauri/
    capabilities/   # Shell command allowlist
    tauri.conf.json # Window, bundle, and CSP config
    src/            # Rust commands (download_to_temp, wsl_*, github_*)
```

## Design System & Conventions

- Use CSS variables: `var(--bg-surface)`, `var(--bg-card)`, `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)` — never hard-code dark/light colors
- Glass cards: `rounded-xl border border-[var(--border)] bg-[var(--bg-card)]`
- Accent colors by feature area:
  - Indigo (`indigo-500`): General UI / interactive elements
  - Violet (`violet-500`): Claude / AI models
  - Emerald (`emerald-500`): Codex / success states
  - Sky (`sky-500`): OpenRouter
  - Orange (`orange-500`): Ollama
  - Amber (`amber-500`): Warnings
  - Red (`red-500`): Errors / critical findings
- Text sizes: `text-xs` for body, `text-[11px]` for secondary, `text-[10px]` for labels, `text-[9px]` for badges
- All interactive elements: `transition-colors`, `cursor-pointer`

## Coding Rules

- Composition API only — no Options API
- `<script setup lang="ts">` with explicit types
- Use existing shared components (`GlassButton`, `GlassInput`, `GlassModal`, `GlassCheckbox`) before creating new ones
- Never hard-code model names or vendor strings in user-visible UI — use store values
- Shell commands go through `useClaudeShell`, `useCodexShell` — never raw `Command.create()` in page components
- New Tauri shell commands require allowlist entries in `tauri/capabilities/default.json`
- Do not add comments explaining what code does — only add comments for non-obvious WHY
- Never mention Tauri, WebView, or Rust in user-facing text
- `dist/`, `.nuxt/`, `.output/`, `target/` are generated — never edit them

## AI Integrations Pattern

All AI integrations follow the same pattern:

```ts
// composables/useFooAI.ts
export async function runFooChat(opts: FooOptions): Promise<string> {
  // fetch to API, return text
}
```

Then in components:
- Import the composable function
- Call it inside `try/catch`
- Show streaming/loading state during the call

## Security Findings Data Model

- `SecurityFinding` = persisted, user-managed remediation item
- `SecurityScanFinding` = parsed result from a single AI scan run
- Both live in `useSecurityStore` and persist to Tauri store
- GitHub issues can be created from findings via `useAuthStore().createGitHubIssue()`
