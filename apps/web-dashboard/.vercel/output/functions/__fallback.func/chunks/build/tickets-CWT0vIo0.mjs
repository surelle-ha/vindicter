import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { ShieldAlert, RefreshCw, Search, MessageCircle, ChevronDown, Loader2 } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
import { u as useAuth } from './useAuth-C_mOwM2c.mjs';
import { u as useRouter } from './server.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "tickets",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Support Tickets — Vindicter" });
    useAuth();
    useRouter();
    const tickets = ref([]);
    const loading = ref(true);
    const fetchErr = ref("");
    const search = ref("");
    const filter = ref("all");
    const expanded = ref(null);
    const saving = ref(null);
    const filtered = computed(() => {
      let list = tickets.value;
      if (filter.value !== "all") list = list.filter((t) => (t.status ?? "open") === filter.value);
      const q = search.value.toLowerCase().trim();
      if (q) list = list.filter(
        (t) => t.subject.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
      return list;
    });
    const counts = computed(() => ({
      all: tickets.value.length,
      open: tickets.value.filter((t) => !t.status || t.status === "open").length,
      in_progress: tickets.value.filter((t) => t.status === "in_progress").length,
      resolved: tickets.value.filter((t) => t.status === "resolved").length
    }));
    const statusMeta = {
      open: { label: "Open", style: "background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);" },
      in_progress: { label: "In Progress", style: "background:rgba(79,70,229,0.12);border:1px solid rgba(79,70,229,0.22);color:rgba(129,140,248,0.85);" },
      resolved: { label: "Resolved", style: "background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.20);color:rgba(35,165,90,0.80);" }
    };
    const categoryLabel = {
      setup: "Setup / Install",
      scan: "Scanning",
      billing: "Account",
      bug: "Bug",
      other: "Other"
    };
    function fmt(iso) {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-5xl mx-auto" }, _attrs))}><div class="mb-6 flex items-start justify-between gap-4"><div><div class="flex items-center gap-2 mb-1">`);
      _push(ssrRenderComponent(unref(ShieldAlert), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(248,113,113,0.55)" }
      }, null, _parent));
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.50)" })}">Admin</p></div><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Support Tickets</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Review and respond to user support requests.</p></div><button class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)", "border": "1px solid rgba(255,255,255,0.08)" })}"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3 w-3", unref(loading) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button></div>`);
      if (unref(fetchErr)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(fetchErr))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-wrap items-center gap-3 mb-4"><div class="flex items-center gap-1 rounded-lg p-1" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.07)" })}"><!--[-->`);
      ssrRenderList({ all: "All", open: "Open", in_progress: "In Progress", resolved: "Resolved" }, (tab, key) => {
        _push(`<button class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer" style="${ssrRenderStyle(unref(filter) === key ? "background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.80);" : "color:rgba(255,255,255,0.35);")}">${ssrInterpolate(tab)} <span class="ml-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(unref(counts)[key])}</span></button>`);
      });
      _push(`<!--]--></div><div class="relative flex-1" style="${ssrRenderStyle({ "min-width": "200px", "max-width": "300px" })}">`);
      _push(ssrRenderComponent(unref(Search), {
        class: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} placeholder="Search tickets…" class="w-full rounded-xl pl-8 pr-4 py-2 text-[12px] text-white outline-none border border-white/8 bg-white/[0.03] focus:border-accent/40"></div></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-14 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(fetchErr) && !unref(filtered).length) {
        _push(`<div class="rounded-xl px-5 py-14 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(MessageCircle), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(unref(search) || unref(filter) !== "all" ? "No tickets match your filters." : "No support tickets yet.")}</p></div>`);
      } else if (!unref(loading) && !unref(fetchErr)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(filtered), (t) => {
          _push(`<div class="rounded-xl overflow-hidden" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}"><button class="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors cursor-pointer" style="${ssrRenderStyle(unref(expanded) === t.id ? "background:rgba(79,70,229,0.06);" : "background:rgba(255,255,255,0.02);")}"><div class="shrink-0 h-2 w-2 rounded-full mt-0.5" style="${ssrRenderStyle(t.status === "resolved" ? "background:rgba(35,165,90,0.70);" : t.status === "in_progress" ? "background:rgba(79,70,229,0.70);" : "background:rgba(251,191,36,0.70);")}"></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><p class="text-[13px] font-semibold truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(t.subject)}</p><span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(categoryLabel[t.category] ?? t.category)}</span></div><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(t.name)} · ${ssrInterpolate(t.email)}</p></div><div class="shrink-0 flex items-center gap-3"><span class="hidden sm:block text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">${ssrInterpolate(fmt(t.created_at))}</span><span class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle(statusMeta[t.status ?? "open"]?.style ?? statusMeta.open.style)}">${ssrInterpolate(statusMeta[t.status ?? "open"]?.label ?? "Open")}</span>`);
          _push(ssrRenderComponent(unref(ChevronDown), {
            class: ["h-3.5 w-3.5 shrink-0 transition-transform", unref(expanded) === t.id ? "rotate-180" : ""],
            style: { "color": "rgba(255,255,255,0.20)" }
          }, null, _parent));
          _push(`</div></button>`);
          if (unref(expanded) === t.id) {
            _push(`<div class="px-4 pb-4 pt-3" style="${ssrRenderStyle({ "background": "rgba(79,70,229,0.04)", "border-top": "1px solid rgba(79,70,229,0.10)" })}"><p class="text-[13px] leading-relaxed whitespace-pre-wrap mb-4" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.55)" })}">${ssrInterpolate(t.message)}</p><div class="flex items-center gap-2 flex-wrap"><p class="text-[11px] mr-2" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Set status:</p><!--[-->`);
            ssrRenderList(statusMeta, (meta, key) => {
              _push(`<button class="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50" style="${ssrRenderStyle((t.status ?? "open") === key ? meta.style : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);")}"${ssrIncludeBooleanAttr(unref(saving) === t.id) ? " disabled" : ""}>`);
              if (unref(saving) === t.id && (t.status ?? "open") !== key) {
                _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin inline mr-1" }, null, _parent));
              } else {
                _push(`<!---->`);
              }
              _push(` ${ssrInterpolate(meta.label)}</button>`);
            });
            _push(`<!--]--></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading) && unref(filtered).length) {
        _push(`<p class="mt-3 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}">${ssrInterpolate(unref(filtered).length)} ${ssrInterpolate(unref(filtered).length === 1 ? "ticket" : "tickets")}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/tickets.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=tickets-CWT0vIo0.mjs.map
