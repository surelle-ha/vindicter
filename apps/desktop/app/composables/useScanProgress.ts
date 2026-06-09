export interface ScanProgressState {
  running: boolean
  kind: 'scan' | 'validation' | null
  label: string
  detail: string
  tool: string
  effort: string
  startedAt: string | null
}

export function useScanProgress() {
  return useState<ScanProgressState>('scanProgress', () => ({
    running: false,
    kind: null,
    label: '',
    detail: '',
    tool: '',
    effort: '',
    startedAt: null,
  }))
}
