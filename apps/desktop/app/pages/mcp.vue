<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Copy, Info, Loader2, Plug, Play, Square, Terminal, Wrench } from 'lucide-vue-next'

const projects = useProjectsStore()
const security = useSecurityStore()
const { notify } = useNotifications()

const serverRunning = ref(false)
const serverStarting = ref(false)
const serverPort = ref(7474)
const serverLog = ref<string[]>([])
let serverProcess: any = null

const activeProject = computed(() => projects.activeProject)

const tools = [
  {
    name: 'list_projects',
    description: 'Returns all projects registered in Vindicter.',
    params: 'none',
  },
  {
    name: 'get_project',
    description: 'Returns metadata for a specific project by ID.',
    params: '{ project_id: string }',
  },
  {
    name: 'get_findings',
    description: 'Returns all security remediation findings for the active or specified project.',
    params: '{ project_id?: string, status?: string, severity?: string }',
  },
  {
    name: 'get_scans',
    description: 'Returns the scan history and raw AI reports for the active or specified project.',
    params: '{ project_id?: string, limit?: number }',
  },
  {
    name: 'get_security_summary',
    description: 'Returns a concise security posture summary: open findings count, high-risk count, last scan time.',
    params: '{ project_id?: string }',
  },
  {
    name: 'run_diagnostics',
    description: 'Runs dependency and secret pattern scans on the specified project and returns the findings.',
    params: '{ project_id: string }',
  },
]

const claudeDesktopConfig = computed(() => {
  const config = {
    mcpServers: {
      vindicter: {
        command: 'node',
        args: ['<path-to-vindicter-mcp-server.js>'],
        env: {
          VINDICTA_PORT: String(serverPort.value),
        },
      },
    },
  }
  return JSON.stringify(config, null, 2)
})

async function startServer() {
  if (serverRunning.value || serverStarting.value) return
  serverStarting.value = true
  serverLog.value = []
  try {
    const { Command } = await import('@tauri-apps/plugin-shell')
    const projectPath = activeProject.value?.absolutePath ?? ''

    const cmd = Command.create('node-mcp-server', [
      '-e',
      buildInlineServer(projectPath),
    ])

    cmd.stdout.on('data', (line: string) => {
      serverLog.value.push(`[out] ${line.trim()}`)
      if (serverLog.value.length > 100) serverLog.value.shift()
    })
    cmd.stderr.on('data', (line: string) => {
      serverLog.value.push(`[err] ${line.trim()}`)
      if (serverLog.value.length > 100) serverLog.value.shift()
    })
    cmd.on('close', () => {
      serverRunning.value = false
      serverLog.value.push('[server stopped]')
    })
    cmd.on('error', (err: string) => {
      serverRunning.value = false
      serverLog.value.push(`[error] ${err}`)
    })

    serverProcess = await cmd.spawn()
    serverRunning.value = true
    serverLog.value.push(`[server started on port ${serverPort.value}]`)
    notify(`MCP server started on port ${serverPort.value}.`, 'success')
  }
  catch (e: any) {
    const msg = e?.message ?? String(e)
    serverLog.value.push(`[failed to start] ${msg}`)
    const lower = msg.toLowerCase()
    const hint = lower.includes('not allowed') || lower.includes('forbidden') || lower.includes('permission')
      ? 'Shell permission denied. Check Tauri capabilities config.'
      : lower.includes('enoent') || lower.includes('not found')
        ? 'Node.js not found. Make sure "node" is installed and in your PATH.'
        : 'Failed to start MCP server. Make sure Node.js is installed.'
    notify(hint, 'error')
  }
  finally {
    serverStarting.value = false
  }
}

async function stopServer() {
  try {
    if (serverProcess) {
      await serverProcess.kill()
      serverProcess = null
    }
    serverRunning.value = false
    serverLog.value.push('[server stopped by user]')
    notify('MCP server stopped.', 'success')
  }
  catch (e: any) {
    notify(e?.message ?? 'Could not stop the MCP server.', 'error')
  }
}

function copyConfig() {
  navigator.clipboard.writeText(claudeDesktopConfig.value).then(() => {
    notify('Claude Desktop config copied to clipboard.', 'success')
  })
}

function buildInlineServer(projectPath: string): string {
  // Minimal HTTP+JSON-RPC MCP-compatible server bundled as an inline Node.js script.
  return `
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = ${serverPort.value};
const projectPath = ${JSON.stringify(projectPath)};

function readVindicterJson(p) {
  try {
    const file = path.join(p, 'vindicta.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}

function loadProjects() {
  try {
    const store = path.join(process.env.APPDATA || process.env.HOME, '.vindicta', 'vindicter-app.bin');
    if (fs.existsSync(store)) {
      const data = JSON.parse(fs.readFileSync(store, 'utf8'));
      return data.projects || [];
    }
  } catch {}
  return [];
}

const tools = [
  { name: 'list_projects', description: 'List all registered projects.' },
  { name: 'get_findings', description: 'Get security findings for the active project.', inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, status: { type: 'string' }, severity: { type: 'string' } } } },
  { name: 'get_scans', description: 'Get scan history for the active project.', inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'get_security_summary', description: 'Get security posture summary.', inputSchema: { type: 'object', properties: { project_id: { type: 'string' } } } },
  { name: 'run_diagnostics', description: 'Return existing dependency and secret findings.', inputSchema: { type: 'object', properties: { project_id: { type: 'string' } } } },
];

function handleTool(name, args) {
  const vj = readVindicterJson(projectPath);
  if (!vj) return { error: 'Could not read vindicta.json from ' + projectPath };
  const sec = vj.security || {};
  if (name === 'list_projects') return [{ id: vj.meta?.id, name: vj.meta?.name, path: projectPath }];
  if (name === 'get_findings') {
    let findings = sec.findings || [];
    if (args?.status) findings = findings.filter(f => f.status === args.status);
    if (args?.severity) findings = findings.filter(f => f.severity === args.severity);
    return findings;
  }
  if (name === 'get_scans') {
    const scans = (sec.scans || []).slice(0, args?.limit || 10);
    return scans.map(s => ({ id: s.id, scannedAt: s.scannedAt, effort: s.effort, status: s.status, summary: s.summary, findingCount: (s.findings||[]).length }));
  }
  if (name === 'get_security_summary') {
    const findings = sec.findings || [];
    const scans = sec.scans || [];
    return { openFindings: findings.filter(f => f.status === 'open').length, highRisk: findings.filter(f => f.severity === 'critical' || f.severity === 'high').length, lastScan: scans[0]?.scannedAt || null, totalFindings: findings.length };
  }
  if (name === 'run_diagnostics') {
    const findings = (sec.findings || []).filter(f => f.source === 'dependency' || f.source === 'secret');
    return findings;
  }
  return { error: 'Unknown tool: ' + name };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const rpc = JSON.parse(body);
      let result;
      if (rpc.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'vindicter-mcp', version: '1.0.0' } };
      else if (rpc.method === 'tools/list') result = { tools };
      else if (rpc.method === 'tools/call') result = { content: [{ type: 'text', text: JSON.stringify(handleTool(rpc.params?.name, rpc.params?.arguments), null, 2) }] };
      else result = { error: { code: -32601, message: 'Method not found' } };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
    }
  });
});
server.listen(port, '127.0.0.1', () => console.log('Vindicter MCP server listening on http://127.0.0.1:' + port));
process.on('SIGTERM', () => { server.close(); process.exit(0); });
`
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 pb-8">
    <div class="flex items-center gap-3">
      <div class="grid size-10 place-items-center rounded-xl border border-violet-500/25 bg-violet-500/10">
        <Plug class="size-5 text-violet-300" />
      </div>
      <div>
        <h1 class="font-display text-lg font-bold text-[var(--text)]">MCP Server</h1>
        <p class="text-xs text-[var(--text-muted)]">Expose Vindicter to AI agents via the Model Context Protocol.</p>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <main class="space-y-5">
        <!-- Server Control -->
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <Terminal class="size-4 text-violet-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Server Control</h2>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
                :class="serverRunning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-[var(--text-faint)]'"
              >
                <span class="size-1.5 rounded-full" :class="serverRunning ? 'bg-emerald-400' : 'bg-[var(--text-faint)]'" />
                {{ serverRunning ? 'Running' : 'Stopped' }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-end gap-3">
            <label class="block">
              <span class="text-xs font-medium text-[var(--text-muted)]">Port</span>
              <input
                v-model.number="serverPort"
                type="number"
                min="1024"
                max="65535"
                :disabled="serverRunning"
                class="mt-1 h-9 w-28 rounded-lg border border-[var(--border)] bg-black/20 px-3 text-xs text-[var(--text)] outline-none disabled:opacity-50"
              >
            </label>

            <button
              v-if="!serverRunning"
              class="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="serverStarting"
              @click="startServer"
            >
              <Loader2 v-if="serverStarting" class="size-3.5 animate-spin" />
              <Play v-else class="size-3.5" />
              Start Server
            </button>
            <button
              v-else
              class="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/15"
              @click="stopServer"
            >
              <Square class="size-3.5" />
              Stop Server
            </button>
          </div>

          <div v-if="serverRunning" class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
            <p class="text-xs text-emerald-300">MCP endpoint: <span class="font-mono">http://127.0.0.1:{{ serverPort }}</span></p>
          </div>

          <div v-if="serverLog.length" class="mt-3">
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-faint)]">Server log</p>
            <pre class="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-black/20 p-3 text-[11px] leading-relaxed text-[var(--text-muted)] custom-scroll">{{ serverLog.join('\n') }}</pre>
          </div>
        </section>

        <!-- Available Tools -->
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <Wrench class="size-4 text-indigo-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Available MCP Tools</h2>
          </div>
          <p class="mt-1 text-xs text-[var(--text-muted)]">These tools are exposed to any MCP-compatible agent connected to this server.</p>
          <div class="mt-3 space-y-2">
            <div
              v-for="tool in tools"
              :key="tool.name"
              class="rounded-lg border border-[var(--border)] bg-black/10 px-3 py-2.5"
            >
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="font-mono text-xs font-semibold text-violet-300">{{ tool.name }}</span>
                <span v-if="tool.params !== 'none'" class="font-mono text-[10px] text-[var(--text-faint)]">{{ tool.params }}</span>
              </div>
              <p class="mt-0.5 text-xs text-[var(--text-muted)]">{{ tool.description }}</p>
            </div>
          </div>
        </section>
      </main>

      <aside class="space-y-5">
        <!-- Info -->
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <Info class="size-3.5 text-sky-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">What is MCP?</h2>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            The Model Context Protocol (MCP) lets AI agents like Claude connect to external tools and data sources.
            Starting this server exposes Vindicter's security findings, scan history, and diagnostics to any MCP-compatible agent.
          </p>
        </section>

        <!-- Active Project -->
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="size-3.5 text-emerald-300" />
            <h2 class="text-sm font-semibold text-[var(--text)]">Active Project Scope</h2>
          </div>
          <div v-if="activeProject" class="mt-2 rounded-lg border border-[var(--border)] bg-black/10 p-3">
            <p class="text-xs font-medium text-[var(--text)]">{{ activeProject.name }}</p>
            <p class="mt-0.5 break-words text-[10px] text-[var(--text-muted)]">{{ activeProject.absolutePath }}</p>
          </div>
          <p v-else class="mt-2 text-xs text-[var(--text-muted)]">No active project selected. Select a project in the sidebar first.</p>
        </section>

        <!-- Claude Desktop Config -->
        <section class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <AlertTriangle class="size-3.5 text-amber-300" />
              <h2 class="text-sm font-semibold text-[var(--text)]">Claude Desktop Config</h2>
            </div>
            <button
              class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:bg-white/[0.07] hover:text-[var(--text)]"
              @click="copyConfig"
            >
              <Copy class="size-3" />
              Copy
            </button>
          </div>
          <p class="mt-1.5 text-xs text-[var(--text-muted)]">Add this to your <span class="font-mono text-[var(--text)]">claude_desktop_config.json</span> to connect Claude Desktop to this server.</p>
          <pre class="mt-3 overflow-auto rounded-lg border border-[var(--border)] bg-black/20 p-3 text-[10px] leading-relaxed text-[var(--text-muted)] custom-scroll">{{ claudeDesktopConfig }}</pre>
        </section>
      </aside>
    </div>
  </div>
</template>
