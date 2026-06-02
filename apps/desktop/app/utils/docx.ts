import type { Ticket } from '~/types/vindicta'

export interface VindicterDocxFinding {
  id: string
  title: string
  area: string
  severity: string
  status: string
  owaspCategory: string
  detail: string
  evidence: string
  recommendation: string
}

export interface VindicterSecurityDocxReport {
  projectName: string
  projectCode: string
  projectPath: string
  githubRepo?: string | null
  generatedAt: string
  scannedAt: string
  summary: string
  rawReport: string
  findings: VindicterDocxFinding[]
}

const encoder = new TextEncoder()

function xml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── Shared legacy helpers (used by sprint doc) ────────────────────────────────

function para(text: string, style?: string) {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  const lines = String(text || '').split(/\r?\n/)
  const runs = lines.map((line, index) => {
    const br = index ? '<w:br/>' : ''
    return `<w:r>${br}<w:t xml:space="preserve">${xml(line)}</w:t></w:r>`
  }).join('')
  return `<w:p>${styleXml}${runs}</w:p>`
}

function bullet(text: string) {
  return `<w:p><w:pPr><w:pStyle w:val="Bullet"/></w:pPr><w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`
}

function stat(label: string, value: string | number) {
  return para(`${label}: ${value}`, 'Metric')
}

// ── Security report helpers ───────────────────────────────────────────────────

const SEV: Record<string, { text: string; bg: string; border: string; label: string }> = {
  critical: { text: 'B91C1C', bg: 'FEF2F2', border: 'DC2626', label: 'CRITICAL' },
  high:     { text: 'C2410C', bg: 'FFF7ED', border: 'EA580C', label: 'HIGH'     },
  medium:   { text: '92400E', bg: 'FFFBEB', border: 'D97706', label: 'MEDIUM'   },
  low:      { text: '075985', bg: 'F0F9FF', border: '0284C7', label: 'LOW'      },
}

function sevPalette(severity: string) {
  return SEV[severity.toLowerCase()] ?? SEV.medium!
}

function severityCount(findings: VindicterDocxFinding[], severity: string) {
  return findings.filter(f => f.severity.toLowerCase() === severity).length
}

function sRun(text: string, opts: { b?: boolean; i?: boolean; color?: string; sz?: number; font?: string } = {}) {
  const rPr = [
    opts.b ? '<w:b/>' : '',
    opts.i ? '<w:i/>' : '',
    opts.color ? `<w:color w:val="${opts.color}"/>` : '',
    opts.sz ? `<w:sz w:val="${opts.sz}"/><w:szCs w:val="${opts.sz}"/>` : '',
    opts.font ? `<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}"/>` : '',
  ].filter(Boolean).join('')
  return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`
}

function sPara(runs: string, pPrInner = '', pStyle?: string) {
  const stylePart = pStyle ? `<w:pStyle w:val="${pStyle}"/>` : ''
  const pPr = (stylePart || pPrInner) ? `<w:pPr>${stylePart}${pPrInner}</w:pPr>` : ''
  return `<w:p>${pPr}${runs}</w:p>`
}

function sParaText(text: string, pPrInner = '', runOpts: Parameters<typeof sRun>[1] = {}) {
  return sPara(
    String(text || '').split(/\r?\n/).map((line, i) =>
      `<w:r>${Object.keys(runOpts).length ? `<w:rPr>${[
        runOpts.b ? '<w:b/>' : '',
        runOpts.color ? `<w:color w:val="${runOpts.color}"/>` : '',
        runOpts.sz ? `<w:sz w:val="${runOpts.sz}"/><w:szCs w:val="${runOpts.sz}"/>` : '',
        runOpts.font ? `<w:rFonts w:ascii="${runOpts.font}" w:hAnsi="${runOpts.font}"/>` : '',
      ].filter(Boolean).join('')}</w:rPr>` : ''}${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${xml(line)}</w:t></w:r>`,
    ).join(''),
    pPrInner,
  )
}

function spacer() {
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr></w:p>`
}

function dividerLine(color = 'CBD5E1') {
  return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="${color}"/></w:pBdr><w:spacing w:before="0" w:after="160"/></w:pPr></w:p>`
}

function sectionHeading(num: string, title: string) {
  return `<w:p>
    <w:pPr>
      <w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="E2E8F0"/></w:pBdr>
      <w:spacing w:before="320" w:after="160"/>
    </w:pPr>
    ${sRun(num + '  ', { b: true, color: '94A3B8', sz: 18 })}
    ${sRun(title, { b: true, color: '0F172A', sz: 22 })}
  </w:p>`
}

function fieldLabel(text: string) {
  return `<w:p>
    <w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>
    ${sRun(text.toUpperCase(), { b: true, color: '059669', sz: 16, font: 'Calibri' })}
  </w:p>`
}

function fieldText(text: string) {
  return sParaText(text || '—',
    '<w:spacing w:before="0" w:after="80"/>',
    { color: '334155', sz: 18 },
  )
}

function evidenceBlock(text: string) {
  return sParaText(text || '—',
    `<w:shd w:fill="F8FAFC" w:color="auto" w:val="clear"/>
     <w:pBdr><w:left w:val="single" w:sz="12" w:space="4" w:color="CBD5E1"/></w:pBdr>
     <w:ind w:left="240"/>
     <w:spacing w:before="40" w:after="80"/>`,
    { color: '475569', sz: 18, font: 'Consolas' },
  )
}

function sBullet(text: string) {
  return `<w:p>
    <w:pPr>
      <w:ind w:left="360" w:hanging="180"/>
      <w:spacing w:after="80"/>
    </w:pPr>
    ${sRun('• ', { color: '059669', sz: 18 })}
    ${sRun(text, { color: '334155', sz: 18 })}
  </w:p>`
}

function metaLine(parts: { label: string; value: string }[]) {
  const runs = parts.flatMap((p, i) => [
    sRun(p.label + ': ', { b: true, color: '64748B', sz: 16 }),
    sRun(p.value || '—', { color: '334155', sz: 16 }),
    i < parts.length - 1 ? sRun('  ·  ', { color: 'CBD5E1', sz: 16 }) : '',
  ])
  return sPara(runs.join(''), '<w:spacing w:before="60" w:after="60"/>')
}

function riskTableRow(sev: string, count: number, impact: string, shaded: boolean) {
  const p = sevPalette(sev)
  const fill = shaded ? 'F8FAFC' : 'FFFFFF'
  function tc(content: string, width: number, fill2 = fill) {
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:fill="${fill2}" w:color="auto" w:val="clear"/>
        <w:tcMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${content}</w:p>
    </w:tc>`
  }
  return `<w:tr>
    ${tc(`${sRun(p.label, { b: true, color: p.text, sz: 18 })}`, 2880)}
    ${tc(`${sRun(String(count), { b: true, color: count > 0 ? p.text : '94A3B8', sz: 20 })}`, 1200)}
    ${tc(`${sRun(impact, { color: '64748B', sz: 18 })}`, 6720)}
  </w:tr>`
}

function riskTable(findings: VindicterDocxFinding[]) {
  const borders = `<w:tblBorders>
    <w:top    w:val="single" w:sz="4" w:color="E2E8F0"/>
    <w:left   w:val="single" w:sz="4" w:color="E2E8F0"/>
    <w:bottom w:val="single" w:sz="4" w:color="E2E8F0"/>
    <w:right  w:val="single" w:sz="4" w:color="E2E8F0"/>
    <w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/>
    <w:insideV w:val="single" w:sz="4" w:color="E2E8F0"/>
  </w:tblBorders>`
  function headerTc(text: string, width: number) {
    return `<w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:shd w:fill="0F172A" w:color="auto" w:val="clear"/>
        <w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>
      </w:tcPr>
      <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${sRun(text, { b: true, color: 'F1F5F9', sz: 17 })}</w:p>
    </w:tc>`
  }
  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="10800" w:type="dxa"/>
      ${borders}
      <w:tblLook w:val="0000"/>
    </w:tblPr>
    <w:tr>
      <w:trPr><w:tblHeader/></w:trPr>
      ${headerTc('Severity', 2880)}
      ${headerTc('Count', 1200)}
      ${headerTc('Recommended Action', 6720)}
    </w:tr>
    ${riskTableRow('critical', severityCount(findings, 'critical'), 'Immediate action required — stop-the-line issue', false)}
    ${riskTableRow('high',     severityCount(findings, 'high'),     'Address in current sprint before release',      true)}
    ${riskTableRow('medium',   severityCount(findings, 'medium'),   'Schedule for near-term remediation',            false)}
    ${riskTableRow('low',      severityCount(findings, 'low'),      'Monitor, document, and address when feasible',  true)}
  </w:tbl>`
}

function findingBlock(finding: VindicterDocxFinding, index: number) {
  const p = sevPalette(finding.severity)
  const num = String(index + 1).padStart(2, '0')
  const banner = `<w:p>
    <w:pPr>
      <w:shd w:fill="${p.bg}" w:color="auto" w:val="clear"/>
      <w:pBdr><w:left w:val="single" w:sz="24" w:space="4" w:color="${p.border}"/></w:pBdr>
      <w:ind w:left="200"/>
      <w:spacing w:before="120" w:after="60"/>
    </w:pPr>
    ${sRun(num + '  ', { b: true, color: '94A3B8', sz: 18 })}
    ${sRun('[' + p.label + ']', { b: true, color: p.text, sz: 18 })}
    ${sRun('  ' + finding.title, { b: true, color: '0F172A', sz: 20 })}
  </w:p>`

  return [
    banner,
    metaLine([
      { label: 'ID', value: finding.id },
      { label: 'Area', value: finding.area || 'Project' },
      { label: 'Category', value: finding.owaspCategory || 'Security review' },
      { label: 'Status', value: finding.status },
    ]),
    fieldLabel('Description'),
    fieldText(finding.detail),
    fieldLabel('Evidence'),
    evidenceBlock(finding.evidence),
    fieldLabel('Recommended Fix'),
    fieldText(finding.recommendation),
    spacer(),
    dividerLine('E2E8F0'),
  ].join('')
}

function buildHeaderXml(projectName: string) {
  const name = xml(projectName || 'Security Report')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="E2E8F0"/></w:pBdr>
      <w:spacing w:before="0" w:after="80"/>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="059669"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr><w:t>VINDICTA</w:t></w:r>
    <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">  ·  Security Assessment Report  ·  ${name}</w:t></w:r>
    <w:r><w:rPr><w:color w:val="auto"/><w:sz w:val="18"/></w:rPr><w:tab/></w:r>
    <w:r><w:rPr><w:b/><w:color w:val="DC2626"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>CONFIDENTIAL</w:t></w:r>
  </w:p>
</w:hdr>`
}

function buildFooterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr><w:top w:val="single" w:sz="4" w:space="1" w:color="E2E8F0"/></w:pBdr>
      <w:spacing w:before="80" w:after="0"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">AI-generated report — validate before acting  ·  Page </w:t></w:r>
    <w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
    <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r>
    <w:fldSimple w:instr=" NUMPAGES "><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
  </w:p>
</w:ftr>`
}

function buildSecurityStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="20"/><w:szCs w:val="20"/>
        <w:color w:val="334155"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Header">
    <w:name w:val="header"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0"/><w:tabs><w:tab w:val="right" w:pos="10800"/></w:tabs></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Footer">
    <w:name w:val="footer"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Bullet">
    <w:name w:val="Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360" w:hanging="180"/><w:spacing w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock">
    <w:name w:val="Code Block"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>
      <w:sz w:val="17"/><w:szCs w:val="17"/>
      <w:color w:val="334155"/>
    </w:rPr>
    <w:pPr>
      <w:shd w:fill="F1F5F9" w:color="auto" w:val="clear"/>
      <w:ind w:left="180"/>
      <w:spacing w:before="80" w:after="80" w:line="252" w:lineRule="auto"/>
    </w:pPr>
  </w:style>
</w:styles>`
}

function buildDocumentXml(report: VindicterSecurityDocxReport) {
  const total = report.findings.length
  const critCount = severityCount(report.findings, 'critical')
  const highCount  = severityCount(report.findings, 'high')
  const medCount   = severityCount(report.findings, 'medium')
  const lowCount   = severityCount(report.findings, 'low')
  const highRisk   = critCount + highCount
  const scanDate   = new Date(report.scannedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
  const genDate    = new Date(report.generatedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
  const summary    = report.summary || 'No executive summary was captured for this scan.'

  const coverBlock = [
    // Big branded title
    sPara(
      sRun('VINDICTA', { b: true, color: '059669', sz: 52, font: 'Calibri' }),
      `<w:spacing w:before="0" w:after="60"/>`,
    ),
    sPara(
      sRun('Security Assessment Report', { color: '475569', sz: 26 }),
      `<w:spacing w:before="0" w:after="60"/>`,
    ),
    dividerLine('10B981'),
    spacer(),
    // Classification badge row
    sPara(
      sRun('■ CONFIDENTIAL', { b: true, color: 'DC2626', sz: 18 }) +
      sRun('   —   for internal use only', { color: '94A3B8', sz: 16 }),
      `<w:spacing w:before="60" w:after="160"/>`,
    ),
    // Project metadata table
    metaLine([{ label: 'Project', value: report.projectName || 'Unknown' }]),
    metaLine([{ label: 'Project Code', value: report.projectCode || 'N/A' }]),
    metaLine([{ label: 'Project Path', value: report.projectPath || 'N/A' }]),
    ...(report.githubRepo ? [metaLine([{ label: 'GitHub Repository', value: report.githubRepo }])] : []),
    metaLine([{ label: 'Scan Date', value: scanDate }]),
    metaLine([{ label: 'Report Generated', value: genDate }]),
    metaLine([{ label: 'Total Findings', value: `${total} (${highRisk} high-risk)` }]),
    spacer(),
    dividerLine('E2E8F0'),
  ].join('')

  const summaryBlock = [
    sectionHeading('01', 'Executive Summary'),
    sParaText(summary, '<w:spacing w:after="120"/>', { color: '334155', sz: 20 }),
    spacer(),
  ].join('')

  const riskBlock = [
    sectionHeading('02', 'Risk Overview'),
    riskTable(report.findings),
    spacer(),
    sPara(
      sRun(`${total} total findings · `, { color: '64748B', sz: 17 }) +
      sRun(`${critCount} critical  ${highCount} high  ${medCount} medium  ${lowCount} low`, { b: true, color: '0F172A', sz: 17 }),
      `<w:spacing w:before="120" w:after="120"/>`,
    ),
    spacer(),
  ].join('')

  const methodBlock = [
    sectionHeading('03', 'Methodology'),
    sBullet('The AI agent reviewed the project in read-only mode using static analysis of source files, configuration, and dependency manifests.'),
    sBullet('The review targeted OWASP-class risks: injection, authentication, configuration exposure, insecure deserialization, broken access control, secrets leakage, and desktop-specific trust-boundary issues.'),
    sBullet('OSS scanners (npm audit, Trivy, Semgrep, cargo-audit) were run in parallel and their findings merged with the AI findings.'),
    sBullet('All findings are AI-generated and should be validated by a human engineer before remediation is considered complete.'),
    spacer(),
  ].join('')

  const findingsBlock = [
    sectionHeading('04', `Security Findings  (${total})`),
    ...(total
      ? report.findings.map((f, i) => findingBlock(f, i))
      : [sParaText('No structured findings were returned for this scan.', '', { color: '94A3B8', sz: 18 })]),
  ].join('')

  const body = [coverBlock, summaryBlock, riskBlock, methodBlock, findingsBlock].join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${body}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="864" w:right="720" w:bottom="864" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

// ── Legacy shared styles (used by sprint doc) ─────────────────────────────────

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="1F2937"/></w:rPr>
    <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display"/><w:b/><w:sz w:val="44"/><w:color w:val="047857"/></w:rPr>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="26"/><w:color w:val="4B5563"/></w:rPr>
    <w:pPr><w:spacing w:after="360"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="111827"/></w:rPr>
    <w:pPr><w:spacing w:before="320" w:after="160"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="374151"/></w:rPr>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="047857"/></w:rPr>
    <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Metric">
    <w:name w:val="Metric"/>
    <w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:b/><w:sz w:val="21"/><w:color w:val="374151"/></w:rPr>
    <w:pPr><w:spacing w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Bullet">
    <w:name w:val="Bullet"/>
    <w:rPr><w:sz w:val="21"/><w:color w:val="374151"/></w:rPr>
    <w:pPr><w:ind w:left="360" w:hanging="180"/><w:spacing w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock">
    <w:name w:val="Code Block"/>
    <w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/><w:color w:val="374151"/></w:rPr>
    <w:pPr><w:shd w:fill="F3F4F6"/><w:spacing w:before="120" w:after="120"/></w:pPr>
  </w:style>
</w:styles>`
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosTime(date = new Date()) {
  return ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f)
}

function dosDate(date = new Date()) {
  return (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f)
}

function writeUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff)
}

function writeUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function pushBytes(target: number[], data: Uint8Array) {
  for (const byte of data) target.push(byte)
}

function createZip(files: { name: string; content: string }[]) {
  const now = new Date()
  const output: number[] = []
  const central: number[] = []
  const records: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = []

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const offset = output.length

    writeUint32(output, 0x04034b50)
    writeUint16(output, 20)
    writeUint16(output, 0)
    writeUint16(output, 0)
    writeUint16(output, dosTime(now))
    writeUint16(output, dosDate(now))
    writeUint32(output, crc)
    writeUint32(output, data.length)
    writeUint32(output, data.length)
    writeUint16(output, name.length)
    writeUint16(output, 0)
    pushBytes(output, name)
    pushBytes(output, data)

    records.push({ name, data, crc, offset })
  }

  const centralOffset = output.length

  for (const record of records) {
    writeUint32(central, 0x02014b50)
    writeUint16(central, 20)
    writeUint16(central, 20)
    writeUint16(central, 0)
    writeUint16(central, 0)
    writeUint16(central, dosTime(now))
    writeUint16(central, dosDate(now))
    writeUint32(central, record.crc)
    writeUint32(central, record.data.length)
    writeUint32(central, record.data.length)
    writeUint16(central, record.name.length)
    writeUint16(central, 0)
    writeUint16(central, 0)
    writeUint16(central, 0)
    writeUint16(central, 0)
    writeUint32(central, 0)
    writeUint32(central, record.offset)
    pushBytes(central, record.name)
  }

  pushBytes(output, new Uint8Array(central))

  writeUint32(output, 0x06054b50)
  writeUint16(output, 0)
  writeUint16(output, 0)
  writeUint16(output, records.length)
  writeUint16(output, records.length)
  writeUint32(output, central.length)
  writeUint32(output, centralOffset)
  writeUint16(output, 0)

  return new Uint8Array(output)
}

export function createVindicterSecurityDocx(report: VindicterSecurityDocxReport) {
  return createZip(sharedDocZipFiles(
    report.projectName,
    buildDocumentXml(report),
    buildSecurityStylesXml(),
    buildHeaderXml(report.projectName),
    buildFooterXml(),
    report.generatedAt,
    `Vindicter Security Review — ${report.projectName}`,
  ))
}

// ── Raw AI Report DOCX ────────────────────────────────────────────────────────

function buildRawReportDocumentXml(report: VindicterSecurityDocxReport) {
  const scanDate = new Date(report.scannedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
  const genDate  = new Date(report.generatedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
  const raw      = report.rawReport || 'No raw AI report was captured for this scan.'

  const header = [
    sPara(sRun('VINDICTA', { b: true, color: '059669', sz: 48, font: 'Calibri' }), '<w:spacing w:before="0" w:after="60"/>'),
    sPara(sRun('Raw AI Report', { color: '475569', sz: 24 }), '<w:spacing w:before="0" w:after="60"/>'),
    dividerLine('10B981'),
    spacer(),
    metaLine([{ label: 'Project', value: report.projectName || 'Unknown' }]),
    metaLine([{ label: 'Project Code', value: report.projectCode || 'N/A' }]),
    metaLine([{ label: 'Project Path', value: report.projectPath || 'N/A' }]),
    ...(report.githubRepo ? [metaLine([{ label: 'GitHub Repository', value: report.githubRepo }])] : []),
    metaLine([{ label: 'Scan Date', value: scanDate }]),
    metaLine([{ label: 'Generated', value: genDate }]),
    spacer(),
    dividerLine('E2E8F0'),
    sectionHeading('', 'Unprocessed AI Output'),
    sParaText(
      'This is the verbatim output returned by the AI agent before any parsing or structuring. Use it for audit, debugging, or manual review.',
      '<w:spacing w:after="160"/>',
      { color: '64748B', sz: 17 },
    ),
    ...raw.split(/\r?\n/).map(line =>
      `<w:p><w:pPr><w:pStyle w:val="CodeBlock"/></w:pPr><w:r><w:t xml:space="preserve">${xml(line)}</w:t></w:r></w:p>`,
    ),
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${header}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId2"/>
      <w:footerReference w:type="default" r:id="rId3"/>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="864" w:right="720" w:bottom="864" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

function buildRawHeaderXml(projectName: string) {
  const name = xml(projectName || 'Raw Report')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="E2E8F0"/></w:pBdr>
      <w:spacing w:before="0" w:after="80"/>
      <w:jc w:val="both"/>
    </w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="059669"/><w:sz w:val="18"/><w:szCs w:val="18"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr><w:t>VINDICTA</w:t></w:r>
    <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">  ·  Raw AI Report  ·  ${name}</w:t></w:r>
    <w:r><w:rPr><w:color w:val="auto"/><w:sz w:val="18"/></w:rPr><w:tab/></w:r>
    <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t>INTERNAL USE ONLY</w:t></w:r>
  </w:p>
</w:hdr>`
}

function sharedDocZipFiles(
  projectName: string,
  documentXml: string,
  stylesXml: string,
  headerXml: string,
  footerXml: string,
  generatedAt: string,
  titleOverride?: string,
) {
  const now = new Date(generatedAt).toISOString()
  const title = xml(titleOverride ?? `Vindicter Security Report — ${projectName}`)
  return [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
</Relationships>`,
    },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/styles.xml',   content: stylesXml },
    { name: 'word/header1.xml',  content: headerXml },
    { name: 'word/footer1.xml',  content: footerXml },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${title}</dc:title>
  <dc:creator>Vindicter</dc:creator>
  <cp:keywords>security,OWASP,Vindicter,AI scan</cp:keywords>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Vindicter</Application>
  <Company>Vindicter Security Platform</Company>
</Properties>`,
    },
  ]
}

export function buildSecurityReviewMarkdown(report: VindicterSecurityDocxReport): string {
  const scanDate = new Date(report.scannedAt).toLocaleDateString(undefined, { dateStyle: 'long' })
  const genDate  = new Date(report.generatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })
  const sevCount = (sev: string) => report.findings.filter(f => f.severity.toLowerCase() === sev).length

  const lines: string[] = [
    `# Vindicter Security Assessment Report`,
    ``,
    `> **CONFIDENTIAL — for internal use only**`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Project** | ${report.projectName || 'Unknown'} |`,
    `| **Project Code** | ${report.projectCode || 'N/A'} |`,
    `| **Project Path** | ${report.projectPath || 'N/A'} |`,
    ...(report.githubRepo ? [`| **GitHub Repository** | ${report.githubRepo} |`] : []),
    `| **Scan Date** | ${scanDate} |`,
    `| **Report Generated** | ${genDate} |`,
    `| **Total Findings** | ${report.findings.length} (${sevCount('critical') + sevCount('high')} high-risk) |`,
    ``,
    `---`,
    ``,
    `## 01  Executive Summary`,
    ``,
    report.summary || '_No executive summary was captured for this scan._',
    ``,
    `---`,
    ``,
    `## 02  Risk Overview`,
    ``,
    `| Severity | Count | Recommended Action |`,
    `|---|---|---|`,
    `| 🔴 Critical | ${sevCount('critical')} | Immediate action required — stop-the-line issue |`,
    `| 🟠 High | ${sevCount('high')} | Address in current sprint before release |`,
    `| 🟡 Medium | ${sevCount('medium')} | Schedule for near-term remediation |`,
    `| 🔵 Low | ${sevCount('low')} | Monitor, document, and address when feasible |`,
    ``,
    `---`,
    ``,
    `## 03  Methodology`,
    ``,
    `- The AI agent reviewed the project in read-only mode using static analysis of source files, configuration, and dependency manifests.`,
    `- The review targeted OWASP-class risks: injection, authentication, configuration exposure, insecure deserialization, broken access control, secrets leakage, and desktop-specific trust-boundary issues.`,
    `- OSS scanners (npm audit, Trivy, Semgrep, cargo-audit) were run in parallel and their findings merged with AI findings.`,
    `- All findings are AI-generated and should be validated by a human engineer before remediation is considered complete.`,
    ``,
    `---`,
    ``,
    `## 04  Security Findings  (${report.findings.length})`,
    ``,
  ]

  if (!report.findings.length) {
    lines.push('_No structured findings were returned for this scan._')
  }
  else {
    report.findings.forEach((f, i) => {
      const num = String(i + 1).padStart(2, '0')
      const sevEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[f.severity.toLowerCase()] ?? '⚪'
      lines.push(`### ${num}. ${sevEmoji} [${f.severity.toUpperCase()}] ${f.title}`)
      lines.push(``)
      lines.push(`**ID:** \`${f.id}\`  **Area:** ${f.area || 'Project'}  **Category:** ${f.owaspCategory || 'Security review'}  **Status:** ${f.status}`)
      lines.push(``)
      lines.push(`**Description:**`)
      lines.push(``)
      lines.push(f.detail || '_No detail provided._')
      lines.push(``)
      if (f.evidence) {
        lines.push(`**Evidence:**`)
        lines.push(``)
        lines.push('```')
        lines.push(f.evidence)
        lines.push('```')
        lines.push(``)
      }
      lines.push(`**Recommended Fix:**`)
      lines.push(``)
      lines.push(f.recommendation || '_No recommendation provided._')
      lines.push(``)
      lines.push(`---`)
      lines.push(``)
    })
  }

  lines.push(`_Generated by [Vindicter](https://github.com/Vindicter/vindicter)_`)
  return lines.join('\n')
}

export function buildRawReportMarkdown(report: VindicterSecurityDocxReport): string {
  const scanDate = new Date(report.scannedAt).toLocaleDateString(undefined, { dateStyle: 'long' })
  return [
    `# Vindicter Raw AI Report`,
    ``,
    `**Project:** ${report.projectName || 'Unknown'}  **Scan Date:** ${scanDate}`,
    ``,
    `**Project Code:** ${report.projectCode || 'N/A'}`,
    `**Project Path:** ${report.projectPath || 'N/A'}`,
    ...(report.githubRepo ? [`**GitHub Repository:** ${report.githubRepo}`] : []),
    ``,
    `> This is the verbatim output returned by the AI agent before any parsing or structuring.`,
    ``,
    `---`,
    ``,
    report.rawReport || '_No raw AI report was captured for this scan._',
    ``,
    `---`,
    ``,
    `_Generated by [Vindicter](https://github.com/Vindicter/vindicter)_`,
  ].join('\n')
}

export function createVindicterRawReportDocx(report: VindicterSecurityDocxReport) {
  return createZip(sharedDocZipFiles(
    report.projectName,
    buildRawReportDocumentXml(report),
    buildSecurityStylesXml(),
    buildRawHeaderXml(report.projectName),
    buildFooterXml(),
    report.generatedAt,
    `Vindicter Raw AI Report — ${report.projectName}`,
  ))
}

// ── Fix Prompts Markdown ──────────────────────────────────────────────────────

export function buildFixPromptsMarkdown(report: VindicterSecurityDocxReport): string {
  const scanDate = new Date(report.scannedAt).toLocaleDateString(undefined, { dateStyle: 'long' })
  const lines: string[] = [
    `# Vindicter — AI Fix Prompts`,
    ``,
    `**Project:** ${report.projectName || 'Unknown'}`,
    `**Scan date:** ${scanDate}`,
    `**Findings:** ${report.findings.length}`,
    ``,
    `> These prompts are ready to paste into any AI coding assistant.`,
    `> Each prompt instructs the AI to apply a minimum-scope fix for the described finding.`,
    ``,
    `---`,
    ``,
  ]

  if (!report.findings.length) {
    lines.push('_No structured findings were available for this export._')
    return lines.join('\n')
  }

  report.findings.forEach((finding, i) => {
    const num = String(i + 1).padStart(2, '0')
    lines.push(`## ${num}. ${finding.title}`)
    lines.push(``)
    lines.push(`**Severity:** ${finding.severity.toUpperCase()}  `)
    lines.push(`**Category:** ${finding.owaspCategory || 'Security review'}  `)
    lines.push(`**Area:** ${finding.area || 'Project'}  `)
    lines.push(`**Status:** ${finding.status}`)
    lines.push(``)
    lines.push(`### Fix Prompt`)
    lines.push(``)
    lines.push('```')
    lines.push(`You are a security engineer. Fix the following security finding in this codebase.`)
    lines.push(``)
    lines.push(`Finding: ${finding.title}`)
    lines.push(`Severity: ${finding.severity.toUpperCase()}`)
    lines.push(`Category: ${finding.owaspCategory || 'Security review'}`)
    lines.push(`Affected area: ${finding.area || 'Project'}`)
    if (finding.detail) {
      lines.push(``)
      lines.push(`Description:`)
      lines.push(finding.detail)
    }
    if (finding.evidence) {
      lines.push(``)
      lines.push(`Evidence:`)
      lines.push(finding.evidence)
    }
    if (finding.recommendation) {
      lines.push(``)
      lines.push(`Recommended fix:`)
      lines.push(finding.recommendation)
    }
    lines.push(``)
    lines.push(`Apply the minimum-scope fix needed to resolve this finding without breaking existing functionality. Explain what you changed and why.`)
    lines.push('```')
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  })

  lines.push(`_Generated by Vindicter — https://github.com/Vindicter/vindicter_`)
  return lines.join('\n')
}

export interface VindicterSprintDocReport {
  projectName: string
  projectCode: string
  sprintName: string
  sprintGoal: string
  generatedAt: string
  markdown: string
  completedTickets: Ticket[]
  incompleteTickets: Ticket[]
}

function buildSprintDocumentXml(report: VindicterSprintDocReport) {
  const body = [
    para('Vindicter Sprint Report', 'Title'),
    para(report.sprintName, 'Subtitle'),
    para(`Project: ${report.projectName || 'Unknown project'}`, 'Heading1'),
    para(`Project code: ${report.projectCode || 'N/A'}`),
    para(`Generated: ${new Date(report.generatedAt).toLocaleString()}`),
    para('Sprint Goal', 'Heading1'),
    para(report.sprintGoal || 'No sprint goal was recorded.'),
    para('Outcome', 'Heading1'),
    stat('Completed tickets', report.completedTickets.length),
    stat('Returned to backlog', report.incompleteTickets.length),
    para('Completed Tickets', 'Heading1'),
    ...(report.completedTickets.length
      ? report.completedTickets.flatMap(ticket => [
          para(`#${ticket.number} ${ticket.title}`, 'Heading2'),
          stat('Type', ticket.type),
          stat('Priority', ticket.priority),
          stat('Status', ticket.status),
          para(ticket.description || 'No description provided.'),
        ])
      : [para('No tickets were marked done before the sprint was ended.')]),
    para('Incomplete Tickets Returned To Backlog', 'Heading1'),
    ...(report.incompleteTickets.length
      ? report.incompleteTickets.map(ticket => bullet(`#${ticket.number} ${ticket.title} (${ticket.status})`))
      : [para('No incomplete tickets were returned to the backlog.')]),
    para('Markdown Source', 'Heading1'),
    para(report.markdown || 'No markdown report was generated.', 'CodeBlock'),
  ].join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable="w14 wp14">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

export function createVindicterSprintDocx(report: VindicterSprintDocReport) {
  const now = new Date(report.generatedAt).toISOString()
  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'word/document.xml', content: buildSprintDocumentXml(report) },
    { name: 'word/styles.xml', content: buildStylesXml() },
    {
      name: 'docProps/core.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xml(`Vindicter Sprint Report - ${report.sprintName}`)}</dc:title>
  <dc:subject>Sprint Report</dc:subject>
  <dc:creator>Vindicter</dc:creator>
  <cp:keywords>sprint,Vindicter,report</cp:keywords>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: 'docProps/app.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Vindicter</Application>
  <Company>Vindicter</Company>
</Properties>`,
    },
  ])
}

function pdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrapText(value: string, width = 86) {
  const lines: string[] = []
  for (const rawLine of value.split(/\r?\n/)) {
    let line = rawLine.replace(/^#+\s*/, '').replace(/\*\*/g, '')
    while (line.length > width) {
      let split = line.lastIndexOf(' ', width)
      if (split < 20) split = width
      lines.push(line.slice(0, split))
      line = line.slice(split).trim()
    }
    lines.push(line)
  }
  return lines
}

export function createVindicterSprintPdf(report: VindicterSprintDocReport) {
  const contentLines = wrapText(report.markdown || `${report.sprintName}\nNo report content generated.`).slice(0, 180)
  const pages: string[][] = []
  for (let i = 0; i < contentLines.length; i += 42) pages.push(contentLines.slice(i, i + 42))
  if (!pages.length) pages.push(['No report content generated.'])

  const objects: string[] = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`)

  pages.forEach((lines, index) => {
    const pageObject = 3 + index * 2
    const contentObject = pageObject + 1
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObject} 0 R >>`)
    const stream = [
      'BT',
      '/F2 16 Tf',
      '72 740 Td',
      `(${pdfText(index === 0 ? `Vindicter Sprint Report - ${report.sprintName}` : `${report.sprintName} continued`)}) Tj`,
      '/F1 10 Tf',
      '0 -24 Td',
      ...lines.map(line => `(${pdfText(line)}) Tj 0 -15 Td`),
      'ET',
    ].join('\n')
    objects.push(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`)
  })

  const chunks = ['%PDF-1.4\n']
  const offsets: number[] = [0]
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(chunks.join('')).length)
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`)
  })
  const xrefOffset = encoder.encode(chunks.join('')).length
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`)
  for (const offset of offsets.slice(1)) chunks.push(`${String(offset).padStart(10, '0')} 00000 n \n`)
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)
  return encoder.encode(chunks.join(''))
}
