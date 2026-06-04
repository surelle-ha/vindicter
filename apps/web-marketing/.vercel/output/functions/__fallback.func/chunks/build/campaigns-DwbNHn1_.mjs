import { _ as __nuxt_component_0 } from './nuxt-link-Ctkw-rT2.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderAttr } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { storeToRefs } from 'pinia';
import { Check, FileText, Mail, RotateCcw, Braces, Monitor, Smartphone, CalendarClock, Loader2, Save, Send } from 'lucide-vue-next';
import { u as useMarketingStore } from './marketing-DM5syF7f.mjs';
import { u as useHead } from './composables-BaTf4Ku9.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';
import '@vue/shared';
import './useApi-wCkPPjv2.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "campaigns",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Comms" });
    const store = useMarketingStore();
    const {
      campaignKind,
      deliveryMode,
      draft,
      loading,
      error,
      previewDevice,
      scheduledFor,
      segments,
      selectedTemplateId,
      currentTemplates,
      selectedSegmentIds,
      selectedSegments,
      totalRecipients
    } = storeToRefs(store);
    const notice = ref("");
    const actionError = ref("");
    const saving = ref(false);
    const sending = ref(false);
    const testEmail = ref("");
    const campaignKinds = [
      { value: "internal_update", label: "Internal Update" },
      { value: "release_note", label: "Release Note" },
      { value: "operational_notice", label: "Ops Notice" }
    ];
    const variableTokens = [
      { token: "distribution.names", label: "List names" },
      { token: "distribution.count", label: "List count" },
      { token: "distribution.ownerTeams", label: "Owner teams" },
      { token: "recipients.count", label: "Recipients" },
      { token: "system.date", label: "Date" }
    ];
    const tokenContext = computed(() => ({
      "distribution.names": selectedSegments.value.map((segment) => segment.name).join(", ") || "Selected lists",
      "distribution.count": String(selectedSegments.value.length),
      "distribution.ownerTeams": [...new Set(selectedSegments.value.map((segment) => segment.ownerTeam))].join(", ") || "Marketing",
      "recipients.count": String(totalRecipients.value),
      "system.date": (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    }));
    const resolveTokens = (value) => value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => tokenContext.value[key] ?? `{{${key}}}`);
    const bodyLines = computed(() => resolveTokens(draft.value.body).split("\n").filter(Boolean));
    const previewSubject = computed(() => resolveTokens(draft.value.subject || "Subject line"));
    const previewPreheader = computed(() => resolveTokens(draft.value.preheader || "Preheader text"));
    const previewTitle = computed(() => resolveTokens(draft.value.title || "Internal update"));
    const previewCta = computed(() => resolveTokens(draft.value.ctaLabel || ""));
    const subjectCount = computed(() => draft.value.subject.length);
    const previewWidthClass = computed(() => previewDevice.value === "mobile" ? "max-w-[360px]" : "max-w-[620px]");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl space-y-5" }, _attrs))}><div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Internal Email</p><h1 class="text-[26px] font-display font-black uppercase tracking-wide text-white/90">Comms</h1><p class="mt-1 text-[13px] text-white/42">Compose internal updates and send through the API SMTP transport.</p></div><div class="grid grid-cols-3 gap-2 md:min-w-[430px]"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(totalRecipients).toLocaleString())}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Lists</p><p class="mt-1 text-lg font-semibold text-teal">${ssrInterpolate(unref(selectedSegments).length)}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Subject</p><p class="${ssrRenderClass([unref(subjectCount) > 70 ? "text-warn" : "text-white/88", "mt-1 text-lg font-semibold"])}">${ssrInterpolate(unref(subjectCount))}</p></div></div></div>`);
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
      _push(`<div class="grid gap-5 xl:grid-cols-[360px_1fr_420px]"><section class="space-y-5"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><h2 class="mb-3 text-[13px] font-semibold text-white/82">Comms Type</h2><div class="grid grid-cols-1 gap-2"><!--[-->`);
      ssrRenderList(campaignKinds, (kind) => {
        _push(`<button class="${ssrRenderClass([unref(campaignKind) === kind.value ? "border-teal/35 bg-teal/12 text-teal" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:bg-white/[0.05]", "flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] transition-colors"])}"><span>${ssrInterpolate(kind.label)}</span>`);
        if (unref(campaignKind) === kind.value) {
          _push(ssrRenderComponent(unref(Check), { class: "h-3.5 w-3.5" }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center justify-between gap-3"><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(FileText), { class: "h-4 w-4 text-teal/70" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Template</h2></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/templates",
        class: "text-[11px] font-medium text-teal/80 hover:text-teal"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Manage`);
          } else {
            return [
              createTextVNode("Manage")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><select class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(selectedTemplateId)) ? ssrLooseContain(unref(selectedTemplateId), "") : ssrLooseEqual(unref(selectedTemplateId), "")) ? " selected" : ""}>Blank composer</option><!--[-->`);
      ssrRenderList(unref(currentTemplates), (template) => {
        _push(`<option${ssrRenderAttr("value", template.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedTemplateId)) ? ssrLooseContain(unref(selectedTemplateId), template.id) : ssrLooseEqual(unref(selectedTemplateId), template.id)) ? " selected" : ""}>${ssrInterpolate(template.name)}</option>`);
      });
      _push(`<!--]--></select><p class="mt-2 text-[11px] text-white/30">${ssrInterpolate(unref(currentTemplates).length)} template${ssrInterpolate(unref(currentTemplates).length === 1 ? "" : "s")} for this comms type.</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center justify-between gap-3"><h2 class="text-[13px] font-semibold text-white/82">Distribution Lists</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/audiences",
        class: "text-[11px] font-medium text-teal/80 hover:text-teal"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Manage`);
          } else {
            return [
              createTextVNode("Manage")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(3, (i) => {
          _push(`<div class="h-12 animate-pulse rounded-md bg-white/[0.04]"></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(segments), (segment) => {
          _push(`<button class="${ssrRenderClass([unref(selectedSegmentIds).includes(segment.id) ? "border-teal/30 bg-teal/10" : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]", "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors"])}"><span class="min-w-0"><span class="block truncate text-[12px] font-medium text-white/78">${ssrInterpolate(segment.name)}</span><span class="mt-0.5 block text-[11px] text-white/30">${ssrInterpolate(segment.ownerTeam)} · ${ssrInterpolate(segment.status)}</span></span><span class="${ssrRenderClass([unref(selectedSegmentIds).includes(segment.id) ? "border-teal bg-teal text-base" : "border-white/15", "flex h-4 w-4 shrink-0 items-center justify-center rounded border"])}">`);
          if (unref(selectedSegmentIds).includes(segment.id)) {
            _push(ssrRenderComponent(unref(Check), { class: "h-3 w-3" }, null, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`</span></button>`);
        });
        _push(`<!--]-->`);
        if (!unref(segments).length) {
          _push(`<p class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-4 text-center text-[12px] text-white/35"> Add a distribution list before sending. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div></section><section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-4 flex items-center justify-between gap-3"><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(Mail), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Composer</h2></div><button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/75">`);
      _push(ssrRenderComponent(unref(RotateCcw), { class: "h-3.5 w-3.5" }, null, _parent));
      _push(` Reset </button></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Internal title</label><input${ssrRenderAttr("value", unref(draft).title)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div class="mt-3 grid gap-3 md:grid-cols-2"><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">From name</label><input${ssrRenderAttr("value", unref(draft).fromName)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">From email</label><input${ssrRenderAttr("value", unref(draft).fromEmail)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div></div><div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Subject</label><input${ssrRenderAttr("value", unref(draft).subject)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Preheader</label><input${ssrRenderAttr("value", unref(draft).preheader)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Body</label><div class="mb-2 flex flex-wrap gap-1.5"><!--[-->`);
      ssrRenderList(variableTokens, (item) => {
        _push(`<button class="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/48 transition-colors hover:border-teal/35 hover:text-teal">`);
        _push(ssrRenderComponent(unref(Braces), { class: "h-3 w-3" }, null, _parent));
        _push(` ${ssrInterpolate(item.label)}</button>`);
      });
      _push(`<!--]--></div><textarea rows="11" class="w-full resize-y rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] leading-6 text-white outline-none focus:border-teal/45">${ssrInterpolate(unref(draft).body)}</textarea></div><div class="mt-3 grid gap-3 md:grid-cols-2"><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA label</label><input${ssrRenderAttr("value", unref(draft).ctaLabel)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div><div><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">CTA URL</label><input${ssrRenderAttr("value", unref(draft).ctaUrl)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"></div></div></section><section class="space-y-5"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center justify-between gap-3"><h2 class="text-[13px] font-semibold text-white/82">Preview</h2><div class="flex rounded-md border border-white/[0.08] bg-white/[0.035] p-0.5"><button class="${ssrRenderClass([unref(previewDevice) === "desktop" ? "bg-teal text-base" : "text-white/45", "rounded px-2 py-1 text-[11px]"])}" title="Desktop preview">`);
      _push(ssrRenderComponent(unref(Monitor), { class: "h-3.5 w-3.5" }, null, _parent));
      _push(`</button><button class="${ssrRenderClass([unref(previewDevice) === "mobile" ? "bg-teal text-base" : "text-white/45", "rounded px-2 py-1 text-[11px]"])}" title="Mobile preview">`);
      _push(ssrRenderComponent(unref(Smartphone), { class: "h-3.5 w-3.5" }, null, _parent));
      _push(`</button></div></div><div class="${ssrRenderClass([unref(previewWidthClass), "mx-auto overflow-hidden rounded-md border border-white/[0.08] bg-[#f7f8fb] text-[#15171c]"])}"><div class="border-b border-black/10 px-4 py-3"><p class="text-[11px] font-semibold text-black/55">${ssrInterpolate(unref(draft).fromName)} &lt;${ssrInterpolate(unref(draft).fromEmail)}&gt;</p><p class="mt-1 text-[13px] font-bold">${ssrInterpolate(unref(previewSubject))}</p><p class="mt-0.5 text-[11px] text-black/45">${ssrInterpolate(unref(previewPreheader))}</p></div><div class="px-5 py-6"><img${ssrRenderAttr("src", _imports_0)} alt="" class="mb-5 h-9 w-9 rounded-md"><p class="font-display text-[22px] font-black uppercase leading-tight">${ssrInterpolate(unref(previewTitle))}</p><div class="mt-4 space-y-3 text-[13px] leading-6 text-black/70"><!--[-->`);
      ssrRenderList(unref(bodyLines), (line, index) => {
        _push(`<p>${ssrInterpolate(line)}</p>`);
      });
      _push(`<!--]--></div>`);
      if (unref(draft).ctaLabel) {
        _push(`<a${ssrRenderAttr("href", unref(draft).ctaUrl || "#")} class="mt-5 inline-flex rounded-md bg-[#111215] px-4 py-2 text-[12px] font-bold text-white">${ssrInterpolate(unref(previewCta))}</a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><h2 class="mb-3 text-[13px] font-semibold text-white/82">Delivery</h2><div class="grid grid-cols-2 gap-2"><button class="${ssrRenderClass([unref(deliveryMode) === "now" ? "border-teal/35 bg-teal/12 text-teal" : "border-white/[0.08] text-white/50", "rounded-md border px-3 py-2 text-[12px]"])}"> Send now </button><button class="${ssrRenderClass([unref(deliveryMode) === "schedule" ? "border-teal/35 bg-teal/12 text-teal" : "border-white/[0.08] text-white/50", "rounded-md border px-3 py-2 text-[12px]"])}"> Schedule </button></div>`);
      if (unref(deliveryMode) === "schedule") {
        _push(`<div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Scheduled time</label><div class="relative">`);
        _push(ssrRenderComponent(unref(CalendarClock), { class: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
        _push(`<input${ssrRenderAttr("value", unref(scheduledFor))} type="datetime-local" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white outline-none focus:border-teal/45"></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-3"><label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/32">Test recipient</label><input${ssrRenderAttr("value", unref(testEmail))} type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="teammate@vindicter.xyz"></div><div class="mt-4 grid grid-cols-3 gap-2"><button class="flex items-center justify-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-white/58 transition-colors hover:bg-white/[0.05] disabled:opacity-60"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>`);
      if (unref(saving)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Save), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(` Save </button><button class="rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-white/58 transition-colors hover:bg-white/[0.05] disabled:opacity-60"${ssrIncludeBooleanAttr(unref(sending) || !unref(testEmail)) ? " disabled" : ""}>Test</button><button class="flex items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60"${ssrIncludeBooleanAttr(unref(sending) || !unref(selectedSegmentIds).length) ? " disabled" : ""}>`);
      if (unref(sending)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Send), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(` Send </button></div></div></section></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/campaigns.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=campaigns-DwbNHn1_.mjs.map
