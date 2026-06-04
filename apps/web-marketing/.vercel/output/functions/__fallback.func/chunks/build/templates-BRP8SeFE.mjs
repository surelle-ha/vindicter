import { defineComponent, ref, reactive, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { storeToRefs } from 'pinia';
import { Check, Plus, Braces, WandSparkles, Loader2, Save, FileText } from 'lucide-vue-next';
import { u as useMarketingStore } from './marketing-DM5syF7f.mjs';
import { u as useHead } from './composables-BaTf4Ku9.mjs';
import './useApi-wCkPPjv2.mjs';
import './server.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import '@vue/shared';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "templates",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Templates" });
    const store = useMarketingStore();
    const { templates, loading, error } = storeToRefs(store);
    const saving = ref(false);
    const notice = ref("");
    const actionError = ref("");
    const campaignKinds = [
      { value: "internal_update", label: "Internal Update" },
      { value: "release_note", label: "Release Note" },
      { value: "operational_notice", label: "Ops Notice" }
    ];
    const sourceTokens = [
      { value: "distribution.names", label: "Distribution names" },
      { value: "distribution.count", label: "Distribution count" },
      { value: "distribution.ownerTeams", label: "Owner teams" },
      { value: "recipients.count", label: "Recipient count" },
      { value: "system.date", label: "Send date" }
    ];
    const template = reactive({
      name: "Release readiness brief",
      campaignKind: "internal_update",
      subject: "Brief for {{distribution.names}}",
      preheader: "Prepared for {{recipients.count}} internal recipients.",
      body: "Team,\n\nThis template is scoped to {{distribution.names}} and owned by {{distribution.ownerTeams}}.\n\nSend date: {{system.date}}",
      ctaLabel: "Open brief",
      ctaUrl: "https://vindicter.xyz",
      status: "active"
    });
    const variableRows = ref([
      { label: "Audience", token: "distribution.names" },
      { label: "Owner team", token: "distribution.ownerTeams" },
      { label: "Recipient count", token: "recipients.count" }
    ]);
    const filteredTemplates = computed(
      () => templates.value.filter((item) => item.campaignKind === template.campaignKind)
    );
    computed(
      () => Object.fromEntries(variableRows.value.filter((row) => row.label && row.token).map((row) => [row.label, row.token]))
    );
    const bodyLines = computed(() => template.body.split("\n").filter(Boolean));
    const templateScore = computed(() => {
      let score = 0;
      if (template.subject.includes("{{")) score += 25;
      if (template.preheader) score += 20;
      if (template.body.length > 80) score += 25;
      if (template.ctaLabel && template.ctaUrl) score += 15;
      if (variableRows.value.length >= 2) score += 15;
      return Math.min(score, 100);
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl space-y-5" }, _attrs))}><div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Reusable Comms</p><h1 class="font-display text-[26px] font-black uppercase tracking-wide text-white/90">Templates</h1><p class="mt-1 text-[13px] text-white/42">Create per-type templates with mapped variables for distribution attributes.</p></div><div class="grid grid-cols-3 gap-2 md:min-w-[430px]"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Templates</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(templates).length)}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">This Type</p><p class="mt-1 text-lg font-semibold text-teal">${ssrInterpolate(unref(filteredTemplates).length)}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Quality</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(templateScore))}%</p></div></div></div>`);
      if (unref(notice)) {
        _push(`<div class="rounded-md border border-teal/20 bg-teal/10 px-4 py-2.5 text-[12px] text-teal/90">${ssrInterpolate(unref(notice))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(actionError) || unref(error)) {
        _push(`<div class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">${ssrInterpolate(unref(actionError) || unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid gap-5 xl:grid-cols-[420px_1fr_360px]"><section class="space-y-5"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><h2 class="mb-3 text-[13px] font-semibold text-white/82">Comms Type</h2><div class="grid gap-2"><!--[-->`);
      ssrRenderList(campaignKinds, (kind) => {
        _push(`<button class="${ssrRenderClass([unref(template).campaignKind === kind.value ? "border-teal/35 bg-teal/12 text-teal" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:bg-white/[0.05]", "flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] transition-colors"])}"><span>${ssrInterpolate(kind.label)}</span>`);
        if (unref(template).campaignKind === kind.value) {
          _push(ssrRenderComponent(unref(Check), { class: "h-3.5 w-3.5" }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center justify-between"><h2 class="text-[13px] font-semibold text-white/82">Variable Mapping</h2><button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1 text-[11px] text-white/50 hover:bg-white/[0.05]">`);
      _push(ssrRenderComponent(unref(Plus), { class: "h-3.5 w-3.5" }, null, _parent));
      _push(` Add </button></div><div class="space-y-2"><!--[-->`);
      ssrRenderList(unref(variableRows), (row, index) => {
        _push(`<div class="grid grid-cols-[1fr_1.2fr] gap-2"><input${ssrRenderAttr("value", row.label)} class="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Variable label"><select class="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><!--[-->`);
        ssrRenderList(sourceTokens, (source) => {
          _push(`<option${ssrRenderAttr("value", source.value)}${ssrIncludeBooleanAttr(Array.isArray(row.token) ? ssrLooseContain(row.token, source.value) : ssrLooseEqual(row.token, source.value)) ? " selected" : ""}>${ssrInterpolate(source.label)}</option>`);
        });
        _push(`<!--]--></select></div>`);
      });
      _push(`<!--]--></div><div class="mt-3 flex flex-wrap gap-1.5"><!--[-->`);
      ssrRenderList(sourceTokens, (source) => {
        _push(`<button class="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/48 transition-colors hover:border-teal/35 hover:text-teal">`);
        _push(ssrRenderComponent(unref(Braces), { class: "h-3 w-3" }, null, _parent));
        _push(` ${ssrInterpolate(source.label)}</button>`);
      });
      _push(`<!--]--></div></div></section><section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-4 flex items-center justify-between gap-3"><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(WandSparkles), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Template Builder</h2></div><button class="flex items-center justify-center gap-1.5 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>`);
      if (unref(saving)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Save), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(` Save template </button></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Template name</label><input${ssrRenderAttr("value", unref(template).name)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div class="mt-3 grid gap-3 md:grid-cols-[1fr_150px]"><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Subject</label><input${ssrRenderAttr("value", unref(template).subject)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Status</label><select class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><option value="active"${ssrIncludeBooleanAttr(Array.isArray(unref(template).status) ? ssrLooseContain(unref(template).status, "active") : ssrLooseEqual(unref(template).status, "active")) ? " selected" : ""}>Active</option><option value="draft"${ssrIncludeBooleanAttr(Array.isArray(unref(template).status) ? ssrLooseContain(unref(template).status, "draft") : ssrLooseEqual(unref(template).status, "draft")) ? " selected" : ""}>Draft</option><option value="archived"${ssrIncludeBooleanAttr(Array.isArray(unref(template).status) ? ssrLooseContain(unref(template).status, "archived") : ssrLooseEqual(unref(template).status, "archived")) ? " selected" : ""}>Archived</option></select></div></div><div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Preheader</label><input${ssrRenderAttr("value", unref(template).preheader)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Body</label><textarea rows="12" class="w-full resize-y rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] leading-6 text-white outline-none focus:border-teal/45">${ssrInterpolate(unref(template).body)}</textarea></div><div class="mt-3 grid gap-3 md:grid-cols-2"><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA label</label><input${ssrRenderAttr("value", unref(template).ctaLabel)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA URL</label><input${ssrRenderAttr("value", unref(template).ctaUrl)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div></div></section><section class="space-y-5"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(FileText), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Preview</h2></div><div class="overflow-hidden rounded-md border border-white/[0.08] bg-[#f7f8fb] text-[#15171c]"><div class="border-b border-black/10 px-4 py-3"><p class="text-[11px] text-black/45">${ssrInterpolate(unref(template).preheader || "Preheader text")}</p><p class="mt-1 text-[13px] font-bold">${ssrInterpolate(unref(template).subject || "Subject line")}</p></div><div class="px-5 py-6"><p class="font-display text-[20px] font-black uppercase leading-tight">${ssrInterpolate(unref(template).name || "Template name")}</p><div class="mt-4 space-y-3 text-[13px] leading-6 text-black/70"><!--[-->`);
      ssrRenderList(unref(bodyLines), (line, index) => {
        _push(`<p>${ssrInterpolate(line)}</p>`);
      });
      _push(`<!--]--></div>`);
      if (unref(template).ctaLabel) {
        _push(`<a${ssrRenderAttr("href", unref(template).ctaUrl || "#")} class="mt-5 inline-flex rounded-md bg-[#111215] px-4 py-2 text-[12px] font-bold text-white">${ssrInterpolate(unref(template).ctaLabel)}</a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><h2 class="mb-3 text-[13px] font-semibold text-white/82">Library</h2>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-14 animate-pulse rounded-md bg-white/[0.04]"></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(filteredTemplates).slice(0, 8), (item) => {
          _push(`<div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-[12px] font-semibold text-white/82">${ssrInterpolate(item.name)}</p><p class="mt-0.5 truncate text-[11px] text-white/35">${ssrInterpolate(item.subject)}</p></div><span class="${ssrRenderClass([item.status === "active" ? "border-teal/25 bg-teal/10 text-teal" : "border-white/[0.08] text-white/35", "shrink-0 rounded border px-1.5 py-0.5 text-[10px]"])}">${ssrInterpolate(item.status)}</span></div></div>`);
        });
        _push(`<!--]-->`);
        if (!unref(filteredTemplates).length) {
          _push(`<p class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center text-[12px] text-white/35"> No templates for this comms type yet. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div></section></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/templates.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=templates-BRP8SeFE.mjs.map
