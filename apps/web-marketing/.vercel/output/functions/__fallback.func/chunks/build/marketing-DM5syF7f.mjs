import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { u as useApi } from './useApi-wCkPPjv2.mjs';

const useMarketingStore = defineStore("marketing", () => {
  const api = useApi();
  const loading = ref(false);
  const error = ref("");
  const segments = ref([]);
  const contacts = ref([]);
  const campaigns = ref([]);
  const templates = ref([]);
  const sendHistory = ref([]);
  const selectedSegmentIds = ref([]);
  const campaignKind = ref("internal_update");
  const selectedTemplateId = ref("");
  const previewDevice = ref("desktop");
  const deliveryMode = ref("schedule");
  const scheduledFor = ref("");
  const draft = reactive({
    title: "Internal product update",
    fromName: "Vindicter Ops",
    fromEmail: "ops@vindicter.xyz",
    subject: "Internal launch readiness update",
    preheader: "Operational notes for the next Vindicter release.",
    ctaLabel: "Open internal brief",
    ctaUrl: "https://vindicter.xyz",
    body: "Team,\n\nThis internal comms draft summarizes the latest release notes, operational reminders, and follow-up actions for the Vindicter team.\n\nReview the selected distribution lists before sending through SMTP."
  });
  const selectedSegments = computed(
    () => segments.value.filter((segment) => selectedSegmentIds.value.includes(segment.id))
  );
  const totalRecipients = computed(
    () => contacts.value.filter(
      (contact) => contact.status === "subscribed" && contact.segmentId && selectedSegmentIds.value.includes(contact.segmentId)
    ).length
  );
  const activeRecipients = computed(
    () => contacts.value.filter((contact) => contact.status === "subscribed").length
  );
  const draftCampaigns = computed(() => campaigns.value.filter((campaign) => campaign.status === "draft").length);
  const sentCampaigns = computed(() => campaigns.value.filter((campaign) => campaign.status === "sent").length);
  const activeTemplates = computed(() => templates.value.filter((template) => template.status === "active"));
  const currentTemplates = computed(() => templates.value.filter((template) => template.campaignKind === campaignKind.value));
  const selectedTemplate = computed(() => templates.value.find((template) => template.id === selectedTemplateId.value) ?? null);
  const failedSends = computed(() => sendHistory.value.filter((event) => event.status === "failed").length);
  async function loadAll() {
    loading.value = true;
    error.value = "";
    try {
      const [segmentData, contactData, campaignData, templateData, historyData] = await Promise.all([
        api.request("/marketing/segments"),
        api.request("/marketing/contacts"),
        api.request("/marketing/campaigns"),
        api.request("/marketing/templates"),
        api.request("/marketing/history")
      ]);
      segments.value = segmentData ?? [];
      contacts.value = contactData ?? [];
      campaigns.value = campaignData ?? [];
      templates.value = templateData ?? [];
      sendHistory.value = historyData ?? [];
      selectedSegmentIds.value = selectedSegmentIds.value.filter(
        (id) => segments.value.some((segment) => segment.id === id)
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unable to load internal marketing data.";
    } finally {
      loading.value = false;
    }
  }
  function toggleSegment(id) {
    selectedSegmentIds.value = selectedSegmentIds.value.includes(id) ? selectedSegmentIds.value.filter((segmentId) => segmentId !== id) : [...selectedSegmentIds.value, id];
  }
  async function addSegment(payload) {
    const created = await api.request("/marketing/segments", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    segments.value.unshift(created);
    return created;
  }
  async function updateSegment(id, payload) {
    const updated = await api.request(`/marketing/segments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    segments.value = segments.value.map((segment) => segment.id === id ? updated : segment);
    return updated;
  }
  async function removeSegment(id) {
    await api.request(`/marketing/segments/${id}`, { method: "DELETE" });
    segments.value = segments.value.filter((segment) => segment.id !== id);
    contacts.value = contacts.value.map(
      (contact) => contact.segmentId === id ? { ...contact, segmentId: null, segment: null } : contact
    );
    selectedSegmentIds.value = selectedSegmentIds.value.filter((segmentId) => segmentId !== id);
  }
  async function addContact(payload) {
    const created = await api.request("/marketing/contacts", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    contacts.value.unshift(created);
    return created;
  }
  async function updateContact(id, payload) {
    const updated = await api.request(`/marketing/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    contacts.value = contacts.value.map((contact) => contact.id === id ? updated : contact);
    return updated;
  }
  async function removeContact(id) {
    await api.request(`/marketing/contacts/${id}`, { method: "DELETE" });
    contacts.value = contacts.value.filter((contact) => contact.id !== id);
  }
  async function saveCampaign() {
    const campaign = await api.request("/marketing/campaigns", {
      method: "POST",
      body: JSON.stringify({
        title: draft.title,
        campaignKind: campaignKind.value,
        fromName: draft.fromName,
        fromEmail: draft.fromEmail,
        subject: draft.subject,
        preheader: draft.preheader,
        body: draft.body,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        segmentIds: selectedSegmentIds.value,
        scheduledFor: deliveryMode.value === "schedule" && scheduledFor.value ? scheduledFor.value : void 0
      })
    });
    campaigns.value.unshift(campaign);
    return campaign;
  }
  async function sendCampaign(options = {}) {
    const campaign = await saveCampaign();
    const result = await api.request(`/marketing/campaigns/${campaign.id}/send`, {
      method: "POST",
      body: JSON.stringify(options)
    });
    await loadAll();
    return result;
  }
  async function saveTemplate(payload) {
    const created = await api.request("/marketing/templates", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    templates.value.unshift(created);
    return created;
  }
  function applyTemplate(template) {
    selectedTemplateId.value = template.id;
    campaignKind.value = template.campaignKind;
    draft.subject = template.subject;
    draft.preheader = template.preheader ?? "";
    draft.body = template.body;
    draft.ctaLabel = template.ctaLabel ?? "";
    draft.ctaUrl = template.ctaUrl ?? "";
    if (!draft.title) draft.title = template.name;
  }
  function resetDraft() {
    draft.title = "";
    draft.subject = "";
    draft.preheader = "";
    draft.body = "";
    draft.ctaLabel = "";
    draft.ctaUrl = "";
  }
  return {
    loading,
    error,
    segments,
    contacts,
    campaigns,
    templates,
    sendHistory,
    selectedSegmentIds,
    selectedTemplateId,
    selectedSegments,
    totalRecipients,
    activeRecipients,
    draftCampaigns,
    sentCampaigns,
    activeTemplates,
    currentTemplates,
    selectedTemplate,
    failedSends,
    campaignKind,
    previewDevice,
    deliveryMode,
    scheduledFor,
    draft,
    loadAll,
    toggleSegment,
    addSegment,
    updateSegment,
    removeSegment,
    addContact,
    updateContact,
    removeContact,
    saveCampaign,
    sendCampaign,
    saveTemplate,
    applyTemplate,
    resetDraft
  };
});

export { useMarketingStore as u };
//# sourceMappingURL=marketing-DM5syF7f.mjs.map
