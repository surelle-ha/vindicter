import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

export interface DistributionList {
  id: string
  name: string
  source: string
  status: 'active' | 'draft' | 'paused'
  ownerTeam: string
  contacts?: Contact[]
  updatedAt?: string
}

export interface Contact {
  id: string
  email: string
  name: string | null
  company: string | null
  status: 'subscribed' | 'bounced' | 'unsubscribed'
  segmentId: string | null
  segment?: DistributionList | null
  updatedAt?: string
}

export interface Campaign {
  id: string
  title: string
  status: 'draft' | 'queued' | 'sent' | 'failed'
  campaignKind: CampaignKind
  segmentIds: string[]
  subject: string
  sentAt?: string | null
  updatedAt?: string
}

export type CampaignKind = 'internal_update' | 'release_note' | 'operational_notice'

export interface MarketingTemplate {
  id: string
  name: string
  campaignKind: CampaignKind
  subject: string
  preheader: string | null
  body: string
  ctaLabel: string | null
  ctaUrl: string | null
  variableMap: Record<string, string>
  status: 'draft' | 'active' | 'archived'
  updatedAt?: string
}

export interface SendEvent {
  id: string
  campaignId: string | null
  campaignTitle: string
  campaignKind: CampaignKind
  recipientsCount: number
  testOnly: boolean
  testEmail: string | null
  messageId: string | null
  status: 'sent' | 'failed'
  error: string | null
  sentAt: string | null
  createdAt: string
}

export const useMarketingStore = defineStore('marketing', () => {
  // Resolved lazily inside each action so useRuntimeConfig() is always called
  // within an active Nuxt composable context, not at store-creation time.
  const api = () => useApi()

  const loading  = ref(false)
  const error    = ref('')
  const segments = ref<DistributionList[]>([])
  const contacts = ref<Contact[]>([])
  const campaigns    = ref<Campaign[]>([])
  const templates    = ref<MarketingTemplate[]>([])
  const sendHistory  = ref<SendEvent[]>([])
  const selectedSegmentIds  = ref<string[]>([])
  const campaignKind        = ref<CampaignKind>('internal_update')
  const selectedTemplateId  = ref('')
  const previewDevice       = ref<'desktop' | 'mobile'>('desktop')
  const deliveryMode        = ref<'now' | 'schedule'>('schedule')
  const scheduledFor        = ref('')

  const draft = reactive({
    title:      'Internal product update',
    fromName:   'Vindicter Ops',
    fromEmail:  'ops@vindicter.xyz',
    subject:    'Internal launch readiness update',
    preheader:  'Operational notes for the next Vindicter release.',
    ctaLabel:   'Open internal brief',
    ctaUrl:     'https://vindicter.xyz',
    body:       'Team,\n\nThis internal comms draft summarizes the latest release notes and operational reminders.\n\nReview the selected distribution lists before sending.',
  })

  const selectedSegments  = computed(() => segments.value.filter(s => selectedSegmentIds.value.includes(s.id)))
  const totalRecipients   = computed(() => contacts.value.filter(c => c.status === 'subscribed' && c.segmentId && selectedSegmentIds.value.includes(c.segmentId)).length)
  const activeRecipients  = computed(() => contacts.value.filter(c => c.status === 'subscribed').length)
  const draftCampaigns    = computed(() => campaigns.value.filter(c => c.status === 'draft').length)
  const sentCampaigns     = computed(() => campaigns.value.filter(c => c.status === 'sent').length)
  const activeTemplates   = computed(() => templates.value.filter(t => t.status === 'active'))
  const currentTemplates  = computed(() => templates.value.filter(t => t.campaignKind === campaignKind.value))
  const selectedTemplate  = computed(() => templates.value.find(t => t.id === selectedTemplateId.value) ?? null)
  const failedSends       = computed(() => sendHistory.value.filter(e => e.status === 'failed').length)

  async function loadAll() {
    loading.value = true
    error.value   = ''
    try {
      const [segmentData, contactData, campaignData, templateData, historyData] = await Promise.all([
        api().get<DistributionList[]>('/marketing/segments'),
        api().get<Contact[]>('/marketing/contacts'),
        api().get<Campaign[]>('/marketing/campaigns'),
        api().get<MarketingTemplate[]>('/marketing/templates'),
        api().get<SendEvent[]>('/marketing/history'),
      ])
      segments.value    = segmentData ?? []
      contacts.value    = contactData ?? []
      campaigns.value   = campaignData ?? []
      templates.value   = templateData ?? []
      sendHistory.value = historyData ?? []
      selectedSegmentIds.value = selectedSegmentIds.value.filter(id => segments.value.some(s => s.id === id))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unable to load data.'
    } finally {
      loading.value = false
    }
  }

  function toggleSegment(id: string) {
    selectedSegmentIds.value = selectedSegmentIds.value.includes(id)
      ? selectedSegmentIds.value.filter(s => s !== id)
      : [...selectedSegmentIds.value, id]
  }

  async function addSegment(payload: { name: string; source?: string; ownerTeam?: string; status?: DistributionList['status'] }) {
    const created = await api().post<DistributionList>('/marketing/segments', payload)
    segments.value.unshift(created)
    return created
  }

  async function updateSegment(id: string, payload: Partial<Pick<DistributionList, 'name' | 'source' | 'ownerTeam' | 'status'>>) {
    const updated = await api().patch<DistributionList>(`/marketing/segments/${id}`, payload)
    segments.value = segments.value.map(s => s.id === id ? updated : s)
    return updated
  }

  async function removeSegment(id: string) {
    await api().del(`/marketing/segments/${id}`)
    segments.value = segments.value.filter(s => s.id !== id)
    contacts.value = contacts.value.map(c => c.segmentId === id ? { ...c, segmentId: null, segment: null } : c)
    selectedSegmentIds.value = selectedSegmentIds.value.filter(s => s !== id)
  }

  async function addContact(payload: { email: string; name?: string; company?: string; segmentId?: string; status?: Contact['status'] }) {
    const created = await api().post<Contact>('/marketing/contacts', payload)
    contacts.value.unshift(created)
    return created
  }

  async function updateContact(id: string, payload: { email?: string; name?: string | null; company?: string | null; segmentId?: string | null; status?: Contact['status'] }) {
    const updated = await api().patch<Contact>(`/marketing/contacts/${id}`, payload)
    contacts.value = contacts.value.map(c => c.id === id ? updated : c)
    return updated
  }

  async function removeContact(id: string) {
    await api().del(`/marketing/contacts/${id}`)
    contacts.value = contacts.value.filter(c => c.id !== id)
  }

  async function saveCampaign() {
    const campaign = await api().post<Campaign>('/marketing/campaigns', {
      title:        draft.title,
      campaignKind: campaignKind.value,
      fromName:     draft.fromName,
      fromEmail:    draft.fromEmail,
      subject:      draft.subject,
      preheader:    draft.preheader,
      body:         draft.body,
      ctaLabel:     draft.ctaLabel,
      ctaUrl:       draft.ctaUrl,
      segmentIds:   selectedSegmentIds.value,
      scheduledFor: deliveryMode.value === 'schedule' && scheduledFor.value ? scheduledFor.value : undefined,
    })
    campaigns.value.unshift(campaign)
    return campaign
  }

  async function sendCampaign(options: { testOnly?: boolean; testEmail?: string } = {}) {
    const campaign = await saveCampaign()
    const result   = await api().post<{ recipients: number; messageId?: string; testOnly: boolean }>(`/marketing/campaigns/${campaign.id}/send`, options)
    await loadAll()
    return result
  }

  async function saveTemplate(payload: {
    name: string; campaignKind: CampaignKind; subject: string
    preheader?: string; body: string; ctaLabel?: string; ctaUrl?: string
    variableMap?: Record<string, string>; status?: MarketingTemplate['status']
  }) {
    const created = await api().post<MarketingTemplate>('/marketing/templates', payload)
    templates.value.unshift(created)
    return created
  }

  function applyTemplate(template: MarketingTemplate) {
    selectedTemplateId.value = template.id
    campaignKind.value       = template.campaignKind
    draft.subject            = template.subject
    draft.preheader          = template.preheader ?? ''
    draft.body               = template.body
    draft.ctaLabel           = template.ctaLabel ?? ''
    draft.ctaUrl             = template.ctaUrl ?? ''
    if (!draft.title) draft.title = template.name
  }

  function resetDraft() {
    draft.title = ''; draft.subject = ''; draft.preheader = ''
    draft.body  = ''; draft.ctaLabel = ''; draft.ctaUrl = ''
  }

  return {
    loading, error, segments, contacts, campaigns, templates, sendHistory,
    selectedSegmentIds, selectedTemplateId, selectedSegments, totalRecipients,
    activeRecipients, draftCampaigns, sentCampaigns, activeTemplates,
    currentTemplates, selectedTemplate, failedSends, campaignKind,
    previewDevice, deliveryMode, scheduledFor, draft,
    loadAll, toggleSegment, addSegment, updateSegment, removeSegment,
    addContact, updateContact, removeContact,
    saveCampaign, sendCampaign, saveTemplate, applyTemplate, resetDraft,
  }
})

