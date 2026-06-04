import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderAttr, ssrRenderList } from 'vue/server-renderer';
import { storeToRefs } from 'pinia';
import { Search, CheckCircle2, AlertTriangle, History, MailCheck, TestTube2 } from 'lucide-vue-next';
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
  __name: "history",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Send History" });
    const store = useMarketingStore();
    const { sendHistory, campaigns, loading, error, failedSends } = storeToRefs(store);
    const query = ref("");
    const statusFilter = ref("all");
    const statusFilters = ["all", "sent", "test", "failed"];
    const filteredHistory = computed(() => {
      const q = query.value.trim().toLowerCase();
      return sendHistory.value.filter((event) => {
        const matchesQuery = !q || event.campaignTitle.toLowerCase().includes(q) || event.campaignKind.toLowerCase().includes(q) || (event.testEmail ?? "").toLowerCase().includes(q) || (event.messageId ?? "").toLowerCase().includes(q);
        const matchesStatus = statusFilter.value === "all" || (statusFilter.value === "test" ? event.testOnly : event.status === statusFilter.value);
        return matchesQuery && matchesStatus;
      });
    });
    const sentCount = computed(() => sendHistory.value.filter((event) => event.status === "sent" && !event.testOnly).length);
    const testCount = computed(() => sendHistory.value.filter((event) => event.testOnly).length);
    const totalRecipients = computed(() => sendHistory.value.filter((event) => event.status === "sent" && !event.testOnly).reduce((sum, event) => sum + event.recipientsCount, 0));
    const latestEvent = computed(() => sendHistory.value[0] ?? null);
    function fmt(value) {
      if (!value) return "Not sent";
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    }
    function kindLabel(value) {
      return value.replaceAll("_", " ");
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl space-y-5" }, _attrs))}><div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Audit Trail</p><h1 class="font-display text-[26px] font-black uppercase tracking-wide text-white/90">Send History</h1><p class="mt-1 text-[13px] text-white/42">Track sent, test, and failed internal comms from the SMTP pipeline.</p></div><div class="grid grid-cols-4 gap-2 md:min-w-[560px]"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Sends</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(sentCount))}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Tests</p><p class="mt-1 text-lg font-semibold text-teal">${ssrInterpolate(unref(testCount))}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(totalRecipients).toLocaleString())}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Failed</p><p class="${ssrRenderClass([unref(failedSends) ? "text-err" : "text-white/88", "mt-1 text-lg font-semibold"])}">${ssrInterpolate(unref(failedSends))}</p></div></div></div>`);
      if (unref(error)) {
        _push(`<div class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid gap-5 xl:grid-cols-[1fr_340px]"><section class="rounded-md border border-white/[0.08] bg-white/[0.025]"><div class="flex flex-col gap-3 border-b border-white/[0.07] p-4 md:flex-row md:items-center md:justify-between"><div class="relative md:w-[340px]">`);
      _push(ssrRenderComponent(unref(Search), { class: "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(query))} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Search campaign, message id, email"></div><div class="grid grid-cols-4 gap-1 rounded-md border border-white/[0.08] bg-white/[0.035] p-1"><!--[-->`);
      ssrRenderList(statusFilters, (item) => {
        _push(`<button class="${ssrRenderClass([unref(statusFilter) === item ? "bg-teal text-base" : "text-white/45 hover:bg-white/[0.05]", "rounded px-3 py-1.5 text-[11px] capitalize"])}">${ssrInterpolate(item)}</button>`);
      });
      _push(`<!--]--></div></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2 p-4"><!--[-->`);
        ssrRenderList(5, (i) => {
          _push(`<div class="h-16 animate-pulse rounded-md bg-white/[0.04]"></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="divide-y divide-white/[0.06]"><!--[-->`);
        ssrRenderList(unref(filteredHistory), (event) => {
          _push(`<div class="grid gap-3 px-4 py-3 md:grid-cols-[1fr_120px_120px_120px] md:items-center"><div class="min-w-0"><div class="flex items-center gap-2">`);
          if (event.status === "sent") {
            _push(ssrRenderComponent(unref(CheckCircle2), { class: "h-4 w-4 text-teal" }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(AlertTriangle), { class: "h-4 w-4 text-err" }, null, _parent));
          }
          _push(`<p class="truncate text-[13px] font-semibold text-white/84">${ssrInterpolate(event.campaignTitle)}</p></div><p class="mt-1 truncate text-[11px] text-white/32">${ssrInterpolate(kindLabel(event.campaignKind))} `);
          if (event.testOnly) {
            _push(`<span> / test to ${ssrInterpolate(event.testEmail)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (event.messageId) {
            _push(`<span> / ${ssrInterpolate(event.messageId)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p>`);
          if (event.error) {
            _push(`<p class="mt-1 truncate text-[11px] text-err/70">${ssrInterpolate(event.error)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><span class="text-[12px] text-white/45">${ssrInterpolate(event.recipientsCount)} recipient${ssrInterpolate(event.recipientsCount === 1 ? "" : "s")}</span><span class="${ssrRenderClass([event.testOnly ? "border-warn/25 bg-warn/10 text-warn" : event.status === "sent" ? "border-teal/25 bg-teal/10 text-teal" : "border-err/25 bg-err/10 text-err", "rounded border px-2 py-1 text-center text-[11px]"])}">${ssrInterpolate(event.testOnly ? "test" : event.status)}</span><span class="text-right text-[11px] text-white/35 md:text-left">${ssrInterpolate(fmt(event.createdAt))}</span></div>`);
        });
        _push(`<!--]-->`);
        if (!unref(filteredHistory).length) {
          _push(`<p class="px-4 py-10 text-center text-[12px] text-white/35"> No send events match this view. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</section><section class="space-y-5"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(History), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Latest Activity</h2></div>`);
      if (unref(latestEvent)) {
        _push(`<div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-3"><p class="text-[12px] font-semibold text-white/82">${ssrInterpolate(unref(latestEvent).campaignTitle)}</p><p class="mt-1 text-[11px] text-white/35">${ssrInterpolate(fmt(unref(latestEvent).createdAt))}</p><p class="${ssrRenderClass([unref(latestEvent).status === "sent" ? "text-teal" : "text-err", "mt-3 text-[22px] font-semibold"])}">${ssrInterpolate(unref(latestEvent).recipientsCount)}</p><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Recipients processed</p></div>`);
      } else {
        _push(`<p class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-6 text-center text-[12px] text-white/35"> No SMTP sends recorded yet. </p>`);
      }
      _push(`</div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(MailCheck), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Campaign Outcomes</h2></div><div class="space-y-2"><!--[-->`);
      ssrRenderList(unref(campaigns).slice(0, 6), (campaign) => {
        _push(`<div class="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2"><div class="min-w-0"><p class="truncate text-[12px] font-medium text-white/78">${ssrInterpolate(campaign.title)}</p><p class="truncate text-[11px] text-white/32">${ssrInterpolate(campaign.subject)}</p></div><span class="${ssrRenderClass([campaign.status === "sent" ? "border-teal/25 bg-teal/10 text-teal" : campaign.status === "failed" ? "border-err/25 bg-err/10 text-err" : "border-white/[0.08] text-white/35", "shrink-0 rounded border px-1.5 py-0.5 text-[10px]"])}">${ssrInterpolate(campaign.status)}</span></div>`);
      });
      _push(`<!--]--></div></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-3 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(TestTube2), { class: "h-4 w-4 text-warn" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Preflight Checks</h2></div><div class="space-y-2 text-[12px] text-white/48"><div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2"><span>Test sends logged</span><span class="font-semibold text-white/76">${ssrInterpolate(unref(testCount))}</span></div><div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2"><span>Production sends logged</span><span class="font-semibold text-white/76">${ssrInterpolate(unref(sentCount))}</span></div><div class="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2"><span>Recent failures</span><span class="${ssrRenderClass([unref(failedSends) ? "text-err" : "text-white/76", "font-semibold"])}">${ssrInterpolate(unref(failedSends))}</span></div></div></div></section></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/history.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=history-CP9n3PWr.mjs.map
