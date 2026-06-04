// Academy WSL Daemon — exposes a local HTTP+WebSocket server so the web-dashboard
// can relay terminal commands into the WSL academy sandbox profile.

const DAEMON_PORT = 7476

export interface DaemonState {
  running: boolean
  starting: boolean
  port: number
  log: string[]
}

let _childProcess: any = null
const _state = reactive<DaemonState>({
  running: false,
  starting: false,
  port: DAEMON_PORT,
  log: [],
})

function buildDaemonScript(wslDistro: string): string {
  return `
const http = require('http');
const { execFile } = require('child_process');

const PORT = ${DAEMON_PORT};
const DISTRO = ${JSON.stringify(wslDistro)};

// Upgrade map: ws-id => { ws, child }
const sessions = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ status: 'ok', distro: DISTRO, port: PORT }));
    return;
  }
  if (req.url === '/stop') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
    res.end('stopping');
    process.exit(0);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

// Minimal WebSocket handshake implementation
server.on('upgrade', (req, socket) => {
  if (req.url !== '/terminal') { socket.destroy(); return; }
  const key = req.headers['sec-websocket-key'] ?? '';
  const accept = require('crypto').createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\\r\\n' +
    'Upgrade: websocket\\r\\n' +
    'Connection: Upgrade\\r\\n' +
    \`Sec-WebSocket-Accept: \${accept}\\r\\n\\r\\n\`
  );

  const id = Math.random().toString(36).slice(2);
  let child = null;

  function sendText(text) {
    if (socket.destroyed) return;
    const buf = Buffer.from(text, 'utf8');
    const len = buf.length;
    let header;
    if (len < 126) {
      header = Buffer.from([0x81, len]);
    } else if (len < 65536) {
      header = Buffer.from([0x81, 126, len >> 8, len & 0xff]);
    } else {
      header = Buffer.from([0x81, 127, 0,0,0,0, (len>>24)&0xff,(len>>16)&0xff,(len>>8)&0xff,len&0xff]);
    }
    try { socket.write(Buffer.concat([header, buf])); } catch {}
  }

  sendText(JSON.stringify({ type: 'ready', distro: DISTRO }));

  socket.on('data', (data) => {
    // Parse WebSocket frame
    try {
      const masked = (data[1] & 0x80) !== 0;
      let offset = 2;
      let payloadLen = data[1] & 0x7f;
      if (payloadLen === 126) { payloadLen = (data[2] << 8) | data[3]; offset = 4; }
      const mask = masked ? data.slice(offset, offset + 4) : null;
      if (masked) offset += 4;
      const payload = data.slice(offset, offset + payloadLen);
      if (mask) { for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4]; }
      const text = payload.toString('utf8');
      if (!text.trim()) return;
      const msg = JSON.parse(text);
      if (msg.type === 'cmd') {
        const cmd = msg.cmd || '';
        if (!cmd.trim()) { sendText(JSON.stringify({ type: 'prompt' })); return; }
        const args = DISTRO ? ['--distribution', DISTRO, '--user', 'academy', 'bash', '-c', cmd] : ['bash', '-c', cmd];
        child = execFile('wsl', args, { timeout: 30000 }, (err, stdout, stderr) => {
          if (stdout) sendText(JSON.stringify({ type: 'data', text: stdout }));
          if (stderr) sendText(JSON.stringify({ type: 'data', text: stderr }));
          sendText(JSON.stringify({ type: 'done', code: err ? (err.code ?? 1) : 0 }));
          child = null;
        });
      } else if (msg.type === 'kill') {
        child?.kill?.('SIGINT');
        child = null;
        sendText(JSON.stringify({ type: 'data', text: '^C\\n' }));
        sendText(JSON.stringify({ type: 'done', code: 130 }));
      }
    } catch {}
  });

  socket.on('close', () => {
    child?.kill?.('SIGINT');
    sessions.delete(id);
  });

  sessions.set(id, { socket, get child() { return child; } });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('[academy-daemon] listening on port ' + PORT);
});

process.on('SIGINT', () => { server.close(); process.exit(0); });
`
}

export function useAcademyDaemon() {
  async function start(wslDistro = '') {
    if (_state.running || _state.starting) return
    _state.starting = true
    _state.log = []

    try {
      const { Command } = await import('@tauri-apps/plugin-shell')
      const script = buildDaemonScript(wslDistro)
      const cmd = Command.create('node-mcp-server', ['-e', script])

      cmd.stdout.on('data', (line: string) => {
        _state.log.push(line.trim())
        if (_state.log.length > 200) _state.log.shift()
      })
      cmd.stderr.on('data', (line: string) => {
        _state.log.push('[err] ' + line.trim())
        if (_state.log.length > 200) _state.log.shift()
      })
      cmd.on('close', () => {
        _state.running = false
        _childProcess = null
        _state.log.push('[daemon stopped]')
      })
      cmd.on('error', (err: string) => {
        _state.running = false
        _childProcess = null
        _state.log.push('[error] ' + err)
      })

      _childProcess = await cmd.spawn()
      _state.running = true
      _state.log.push(`[academy-daemon] started on port ${DAEMON_PORT}`)
    }
    catch (e: any) {
      _state.log.push('[failed] ' + (e?.message ?? String(e)))
    }
    finally {
      _state.starting = false
    }
  }

  async function stop() {
    if (_childProcess) {
      try {
        await fetch(`http://127.0.0.1:${DAEMON_PORT}/stop`).catch(() => {})
        await _childProcess.kill().catch(() => {})
      }
      catch { /* ignore */ }
      _childProcess = null
    }
    _state.running = false
    _state.log.push('[academy-daemon] stopped')
  }

  async function ping(): Promise<boolean> {
    try {
      const res = await fetch(`http://127.0.0.1:${DAEMON_PORT}/ping`, { signal: AbortSignal.timeout(800) })
      return res.ok
    }
    catch { return false }
  }

  return { state: _state, start, stop, ping, port: DAEMON_PORT }
}
