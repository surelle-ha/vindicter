# AGENT.md

This file is for Codex, Claude, and other coding agents working in this repository.

## Project Summary

Vindicta is a **local-first AI-powered security platform** built as a Nuxt 4 + Tauri 2 desktop app. It provides:

- **Security Workspace**: AI-driven project scanning (OWASP, secrets, dependencies, config), findings management, and DOCX report export
- **Academy**: 30-day structured security curriculum with an AI professor agent, mermaid whiteboard, WSL practice terminal, and Kokoro TTS narration
- **AI Models**: Setup and status for Claude Code CLI, Codex CLI, OpenRouter API, Ollama local server, and Kokoro TTS
- **Pentest**: Red/Blue team workspace backed by WSL profiles
- **GitHub Integration**: OAuth via Device Flow, repo cloning, issue creation from security findings

There are also two secondary apps:
- `apps/landing`: Nuxt landing page
- `apps/web-admin`: Nuxt admin dashboard for beta, newsletter, and support operations

## Commands

From the repository root:

```bash
pnpm desktop:dev                              # Nuxt dev server (browser)
pnpm --filter @vindicta/desktop tauri:dev     # Full Tauri native window
pnpm --filter @vindicta/desktop build         # Build check (fastest verification)
pnpm landing:dev                              # Landing page dev
pnpm admin:dev                                # Admin dashboard dev
```

## Architecture

### Frontend
- **Framework**: Nuxt 4, Vue 3 Composition API (`<script setup lang="ts">`), Tailwind CSS v4
- **State**: Pinia stores in `apps/desktop/app/stores/`
- **Routing**: File-based Nuxt routing; `pages/projects/[id].vue` is the main workspace
- **Icons**: lucide-vue-next exclusively

### Desktop
- **Runtime**: Tauri 2 — WebView2 (Windows) renders the Nuxt app; Rust backend handles shell, filesystem, and native APIs
- **Persistence**: Tauri plugin-store (`.bin` files) via `useTauriStore`; localStorage fallback in browser dev
- **Shell allowlist**: `apps/desktop/tauri/capabilities/default.json` — all `Command.create()` calls must be listed here

### Key Files

| Path | Purpose |
|------|---------|
| `apps/desktop/app/pages/projects/[id].vue` | Main workspace shell — tabs, project header |
| `apps/desktop/app/components/security/SecurityWorkspace.vue` | All security tab content and AI scan logic |
| `apps/desktop/app/pages/academy.vue` | Academy learning UI, TTS, whiteboard state |
| `apps/desktop/app/components/academy/AIProfessorChat.vue` | Professor agent chat with quiz parsing |
| `apps/desktop/app/components/academy/AcademyWhiteboard.vue` | Mermaid diagram renderer (top drawer) |
| `apps/desktop/app/stores/app.ts` | Global app settings (openRouter, ollama, wslProfiles, rssSources…) |
| `apps/desktop/app/stores/auth.ts` | GitHub OAuth state, `createGitHubIssue()` |
| `apps/desktop/app/stores/academy.ts` | Academy progress, chat sessions, AI model preference |
| `apps/desktop/app/stores/security.ts` | Security findings, scans, secrets, dependencies |
| `apps/desktop/app/data/curriculum.ts` | Academy lesson/week/module definitions |
| `apps/desktop/app/composables/useClaudeShell.ts` | Claude CLI streaming wrapper |
| `apps/desktop/app/composables/useCodexShell.ts` | Codex CLI exec wrapper |
| `apps/desktop/app/composables/useOpenRouterAI.ts` | OpenRouter REST API |
| `apps/desktop/app/composables/useOllamaAI.ts` | Ollama OpenAI-compat REST API |
| `apps/desktop/app/composables/useAcademyTTS.ts` | TTS orchestration (script gen + Kokoro synthesis + cache) |
| `apps/desktop/app/workers/kokoro.worker.ts` | ONNX TTS inference Web Worker |
| `apps/desktop/tauri/src/` | Rust commands: `download_to_temp`, `wsl_*`, `github_*` |

## AI Integration Conventions

All AI model integrations expose a single async function from a composable:

```ts
// Pattern: composables/useFooAI.ts
export async function runFooChat(opts: FooOptions): Promise<string>
```

Streaming (Claude only) uses `runClaude({ onLine, onClose, onError })`. The `SecurityAITool` type and `AcademyAIModel` type in their respective files define valid values: `'claude' | 'codex' | 'openrouter' | 'ollama'`.

## Security Notes

- Shell access is allowlisted in `capabilities/default.json` — add entries narrowly and with argument validators
- Never embed broad API tokens in source; the GitHub token from Device Flow is a user convenience credential
- Read-only AI scans: always pass `sandbox: 'read-only'` to Codex
- Never mention Tauri, WebView, Rust, or the underlying framework in user-visible text

## Coding Guidelines

- Composition API only (`<script setup lang="ts">`) — no Options API
- Use existing shared components: `GlassButton`, `GlassInput`, `GlassModal`, `GlassCheckbox`, `GlassTextarea`
- CSS variables for theming: `var(--bg-surface)`, `var(--bg-card)`, `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)`
- Never hard-edit `dist/`, `.nuxt/`, `.output/`, `target/` — generated artifacts
- No comments explaining what code does; only add when WHY is non-obvious
- Do not add features beyond the task scope; no premature abstractions

## Documentation

Keep `AGENT.md` and `CLAUDE.md` aligned with current architecture. The `DESIGN.md` describes visual/UX conventions. Per-project docs generated by Vindicta (README, CHANGELOG) are separate from repository docs.
