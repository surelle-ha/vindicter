const API_BASE = import.meta.env.DEV
  ? 'http://localhost:4000/api/v1'
  : 'https://api.vindicter.xyz/api/v1'

// All API responses are wrapped: { success, data, meta }
type Envelope<T> = { success: boolean; data: T }

export interface ApiUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  jobRole: string | null
  experienceLevel: string | null
  onboardingComplete: boolean
  isActive: boolean
  roles: string[]
  accesses: string[]
  workspaces: ApiWorkspace[]
}

export interface ApiWorkspace {
  id: string
  name: string
  memberRole: string
  subscription?: {
    id: string
    status: string
    seatLimit: number
    projectLimit: number
    plan?: { id: string; name: string; priceUsd: number }
  } | null
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, clientApp: 'desktop' }),
  })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({})) as Envelope<Record<string, unknown>> | Record<string, unknown>
    const msg = ('data' in body ? (body as Envelope<Record<string, unknown>>).data?.message : (body as Record<string, unknown>).message) as string | undefined
    throw new Error(msg || `Login failed (${resp.status})`)
  }
  const envelope = await resp.json() as Envelope<{ access_token?: string; accessToken?: string }>
  const token = envelope.data?.access_token ?? envelope.data?.accessToken ?? ''
  if (!token) throw new Error('No token received from server')
  const user = await apiFetchMe(token)
  return { token, user }
}

export async function apiFetchMe(token: string): Promise<ApiUser> {
  const resp = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error(`Session expired (${resp.status})`)
  const envelope = await resp.json() as Envelope<ApiUser>
  return envelope.data
}

export async function apiFetchWorkspaces(token: string): Promise<ApiWorkspace[]> {
  const resp = await fetch(`${API_BASE}/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) return []
  const envelope = await resp.json() as Envelope<ApiWorkspace[]>
  return envelope.data ?? []
}

export async function apiUpdateProfile(token: string, patch: {
  firstName?: string
  lastName?: string
  jobRole?: string
  experienceLevel?: string
}): Promise<ApiUser> {
  const resp = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  })
  if (!resp.ok) throw new Error(`Failed to update profile (${resp.status})`)
  const envelope = await resp.json() as Envelope<ApiUser>
  return envelope.data
}

export async function apiCreateWorkspace(token: string, name: string): Promise<ApiWorkspace> {
  const resp = await fetch(`${API_BASE}/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  })
  if (!resp.ok) throw new Error(`Failed to create workspace (${resp.status})`)
  const envelope = await resp.json() as Envelope<ApiWorkspace>
  return envelope.data
}
