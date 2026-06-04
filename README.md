# Vindicter

Vindicter is a local-first AI-powered security platform for scanning projects, tracking vulnerability findings, and exporting security review reports. The desktop app stores all state in its own data store, reads the local codebase, and uses Claude or Codex CLI for security analysis.

## Screenshots

<table>
  <tr>
    <td><img src="docs/snapshots/0_1_0_001.png" alt="Academy — Security Bootcamp lesson grid" width="400"/><br/><sub><b>Academy</b> — Security Bootcamp with weekly lesson tracks</sub></td>
    <td><img src="docs/snapshots/0_1_0_002.png" alt="Home dashboard" width="400"/><br/><sub><b>Home</b> — Project overview, quick actions, and news feed</sub></td>
  </tr>
  <tr>
    <td><img src="docs/snapshots/0_1_0_003.png" alt="MCP Server" width="400"/><br/><sub><b>MCP Server</b> — Expose Vindicter tools to AI agents via Model Context Protocol</sub></td>
    <td><img src="docs/snapshots/0_1_0_004.png" alt="Security Findings workspace" width="400"/><br/><sub><b>Workspace</b> — Security findings with severity triage and evidence</sub></td>
  </tr>
  <tr>
    <td><img src="docs/snapshots/0_1_0_005.png" alt="Penetration Testing" width="400"/><br/><sub><b>Pentest</b> — Red Team / Blue Team / Purple Team mode with AI-driven agent</sub></td>
    <td></td>
  </tr>
</table>

## What It Does

- Registers local projects and keeps all security state in the app's own data store (never in the project directory).
- Runs AI vulnerability scans with structured findings, evidence, severity, and recommendations.
- Tracks remediation items as first-class security findings.
- Inspects dependency manifests, likely secret patterns, and security-relevant configuration signals.
- Exports professional DOCX security review reports.
- Provides a built-in Security Academy for learning penetration testing and web security.
- Exposes an MCP server for AI agent integration.
- Provides a local Settings page for configuring AI tools, WSL profiles, and app preferences.

## Monorepo Layout

```text
apps/
  desktop/       Nuxt 4 + Tauri 2 desktop app
  web-landing/   Nuxt landing page (vindicter.xyz)
  web-dashboard/ Nuxt dashboard app (dashboard.vindicter.xyz)
  web-marketing/ Nuxt internal comms app (marketing.vindicta.xyz, firewall/API-backed)
  api/           NestJS + Fastify REST API
```

## Desktop App

The desktop app is built with Nuxt 4, Vue 3, Pinia, Tailwind CSS, lucide icons, and Tauri 2. It is intentionally local-first:

- All app preferences and security data are stored through the Tauri Store plugin with localStorage fallback.
- No project-directory files are created or modified by Vindicter — your project files remain untouched.
- Filesystem, dialog, shell, and store access are controlled by Tauri capabilities.
- Claude and Codex CLIs are launched through Tauri shell allowlisted commands.

Primary project tabs are Overview, Scanner, Findings, Dependencies, Secrets, Reports, History, and Settings.

## AI Workflow

Vindicter calls Claude or Codex through composables in `apps/desktop/app/composables/`.

The app runs AI tools in read-only mode for security analysis. Chain-of-thought is not exposed; Vindicter shows user-facing activity logs, structured reports, findings, evidence, and recommendations.

## Data Storage

All Vindicter data is stored exclusively within the app:

- App preferences and project registry: Tauri Store plugin (`.bin` files in the system app data directory)
- Security findings, scans, and remediation items: Tauri Store plugin, keyed by project ID
- No JSON files are written to your project directories

## Development

Install dependencies:

```bash
pnpm install
```

Run the desktop app in a browser shell:

```bash
pnpm --filter @vindicter/desktop dev
```

Run the Tauri desktop app:

```bash
pnpm desktop:dev
```

Run the web apps:

```bash
pnpm web-landing:dev
pnpm web-dashboard:dev
pnpm web-marketing:dev
```

Build the desktop frontend:

```bash
pnpm --filter @vindicter/desktop build
```

Build the Tauri desktop app:

```bash
pnpm --filter @vindicter/desktop tauri:build
```

## Notes

- Prefer local project data and existing stores/composables over new global state.
- Keep Tauri shell commands allowlisted and narrow.
- Do not embed production secrets in source or bundled app assets.
- Generated artifacts such as Nuxt output and Tauri targets should not be hand-edited.
- When changing AI prompts, keep outputs structured and user-facing.
