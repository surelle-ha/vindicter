#!/usr/bin/env node
/**
 * Downloads the correct Trivy binary for the current platform and places it in
 * tauri/binaries/ with the Tauri target-triple naming convention.
 *
 * Run: pnpm download-sidecars
 * Runs automatically before tauri:dev and tauri:build via pre-hooks.
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BINARIES_DIR = path.join(__dirname, '..', 'tauri', 'binaries')

const PLATFORM_MAP = {
  'win32-x64':    { archive: 'trivy_{v}_windows-64bit.zip',    bin: 'trivy.exe', triple: 'x86_64-pc-windows-msvc'    },
  'win32-arm64':  { archive: 'trivy_{v}_windows-arm64.zip',    bin: 'trivy.exe', triple: 'aarch64-pc-windows-msvc'   },
  'darwin-arm64': { archive: 'trivy_{v}_macos-arm64.tar.gz',   bin: 'trivy',     triple: 'aarch64-apple-darwin'      },
  'darwin-x64':   { archive: 'trivy_{v}_macos-64bit.tar.gz',   bin: 'trivy',     triple: 'x86_64-apple-darwin'       },
  'linux-x64':    { archive: 'trivy_{v}_linux-64bit.tar.gz',   bin: 'trivy',     triple: 'x86_64-unknown-linux-gnu'  },
  'linux-arm64':  { archive: 'trivy_{v}_linux-arm64.tar.gz',   bin: 'trivy',     triple: 'aarch64-unknown-linux-gnu' },
}

const platformKey = `${process.platform}-${process.arch}`
const cfg = PLATFORM_MAP[platformKey]
if (!cfg) {
  console.error(`Unsupported platform for Trivy sidecar: ${platformKey}`)
  process.exit(1)
}

const ext = process.platform === 'win32' ? '.exe' : ''
const destName = `trivy-${cfg.triple}${ext}`
const destPath = path.join(BINARIES_DIR, destName)

if (fs.existsSync(destPath)) {
  console.log(`Trivy sidecar already present: ${destName}`)
  process.exit(0)
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'vindicter-sidecar-downloader/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpsGet(res.headers.location))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function downloadFile(url, dest) {
  process.stdout.write(`Downloading ${path.basename(url)} ... `)
  const res = await httpsGet(url)
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
  fs.writeFileSync(dest, res.body)
  console.log(`${(res.body.length / 1_048_576).toFixed(1)} MB`)
}

async function main() {
  console.log('Fetching latest Trivy release info...')
  const apiRes = await httpsGet('https://api.github.com/repos/aquasecurity/trivy/releases/latest')
  if (apiRes.status !== 200) throw new Error(`GitHub API returned HTTP ${apiRes.status}`)

  const release = JSON.parse(apiRes.body.toString())
  const version = release.tag_name.replace(/^v/, '')
  console.log(`Latest Trivy: v${version}`)

  const archiveName = cfg.archive.replace('{v}', version)
  const archiveUrl = `https://github.com/aquasecurity/trivy/releases/download/v${version}/${archiveName}`

  fs.mkdirSync(BINARIES_DIR, { recursive: true })

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trivy-dl-'))
  const archivePath = path.join(tmpDir, archiveName)

  try {
    await downloadFile(archiveUrl, archivePath)

    if (archiveName.endsWith('.zip')) {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${tmpDir}' -Force"`, { stdio: 'pipe' })
    } else {
      execSync(`tar -xzf "${archivePath}" -C "${tmpDir}" ${cfg.bin}`, { stdio: 'pipe' })
    }

    const extracted = path.join(tmpDir, cfg.bin)
    fs.copyFileSync(extracted, destPath)
    if (process.platform !== 'win32') fs.chmodSync(destPath, 0o755)

    console.log(`Trivy sidecar saved → ${destName}`)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch(err => {
  console.error(`Failed to download Trivy sidecar: ${err.message}`)
  process.exit(1)
})
