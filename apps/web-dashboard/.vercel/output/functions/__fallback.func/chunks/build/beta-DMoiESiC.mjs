import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { ShieldAlert, RefreshCw, Search, Star, Building2, ChevronDown, Loader2 } from 'lucide-vue-next';
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
  __name: "beta",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Beta Requests — Vindicter" });
    useAuth();
    useRouter();
    const applications = ref([]);
    const loading = ref(true);
    const fetchErr = ref("");
    const search = ref("");
    const filter = ref("all");
    const expanded = ref(null);
    const saving = ref(null);
    const filtered = computed(() => {
      let list = applications.value;
      if (filter.value !== "all") list = list.filter((a) => (a.status ?? "pending") === filter.value);
      const q = search.value.toLowerCase().trim();
      if (q) list = list.filter(
        (a) => a.org_name.toLowerCase().includes(q) || a.contact_name.toLowerCase().includes(q) || a.contact_email.toLowerCase().includes(q) || a.country.toLowerCase().includes(q) || a.partner_type.toLowerCase().includes(q)
      );
      return list;
    });
    const counts = computed(() => ({
      all: applications.value.length,
      pending: applications.value.filter((a) => !a.status || a.status === "pending").length,
      approved: applications.value.filter((a) => a.status === "approved").length,
      rejected: applications.value.filter((a) => a.status === "rejected").length
    }));
    const statusMeta = {
      pending: { label: "Pending", style: "background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);" },
      approved: { label: "Approved", style: "background:rgba(35,165,90,0.10);border:1px solid rgba(35,165,90,0.20);color:rgba(35,165,90,0.80);" },
      rejected: { label: "Rejected", style: "background:rgba(242,63,66,0.10);border:1px solid rgba(242,63,66,0.20);color:rgba(242,63,66,0.75);" }
    };
    const partnerMeta = {
      partner: { label: "Partner", style: "background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.20);color:rgba(167,139,250,0.80);" },
      trusted: { label: "Trusted", style: "background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.20);color:rgba(129,140,248,0.80);" }
    };
    const orgSizeLabel = {
      "1-10": "1–10",
      "11-50": "11–50",
      "51-200": "51–200",
      "201-500": "201–500",
      "501+": "500+"
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
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.50)" })}">Admin</p></div><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Special Beta Requests</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Review and action organisational early access applications.</p></div><button class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)", "border": "1px solid rgba(255,255,255,0.08)" })}"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
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
      ssrRenderList({ all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected" }, (tab, key) => {
        _push(`<button class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer" style="${ssrRenderStyle(unref(filter) === key ? "background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.80);" : "color:rgba(255,255,255,0.35);")}">${ssrInterpolate(tab)} <span class="ml-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(unref(counts)[key])}</span></button>`);
      });
      _push(`<!--]--></div><div class="relative flex-1" style="${ssrRenderStyle({ "min-width": "200px", "max-width": "300px" })}">`);
      _push(ssrRenderComponent(unref(Search), {
        class: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} placeholder="Search by org, contact, country…" class="w-full rounded-xl pl-8 pr-4 py-2 text-[12px] text-white outline-none border border-white/8 bg-white/[0.03] focus:border-accent/40"></div></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-14 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(fetchErr) && !unref(filtered).length) {
        _push(`<div class="rounded-xl px-5 py-14 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(Star), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(unref(search) || unref(filter) !== "all" ? "No applications match your filters." : "No beta applications yet.")}</p></div>`);
      } else if (!unref(loading) && !unref(fetchErr)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(filtered), (a) => {
          _push(`<div class="rounded-xl overflow-hidden" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}"><button class="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors cursor-pointer" style="${ssrRenderStyle(unref(expanded) === a.id ? "background:rgba(139,92,246,0.06);" : "background:rgba(255,255,255,0.02);")}"><div class="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.18)" })}">`);
          _push(ssrRenderComponent(unref(Building2), {
            class: "h-3.5 w-3.5",
            style: { "color": "rgba(167,139,250,0.65)" }
          }, null, _parent));
          _push(`</div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><p class="text-[13px] font-semibold truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(a.org_name)}</p><span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style="${ssrRenderStyle(partnerMeta[a.partner_type]?.style ?? partnerMeta.partner.style)}">${ssrInterpolate(partnerMeta[a.partner_type]?.label ?? a.partner_type)}</span></div><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(a.contact_name)} · ${ssrInterpolate(a.contact_email)} · ${ssrInterpolate(a.country)} `);
          if (a.org_size) {
            _push(`<span class="ml-1">(${ssrInterpolate(orgSizeLabel[a.org_size] ?? a.org_size)} employees)</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p></div><div class="shrink-0 flex items-center gap-3"><span class="hidden sm:block text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">${ssrInterpolate(fmt(a.created_at))}</span><span class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle(statusMeta[a.status ?? "pending"]?.style ?? statusMeta.pending.style)}">${ssrInterpolate(statusMeta[a.status ?? "pending"]?.label ?? "Pending")}</span>`);
          _push(ssrRenderComponent(unref(ChevronDown), {
            class: ["h-3.5 w-3.5 shrink-0 transition-transform", unref(expanded) === a.id ? "rotate-180" : ""],
            style: { "color": "rgba(255,255,255,0.20)" }
          }, null, _parent));
          _push(`</div></button>`);
          if (unref(expanded) === a.id) {
            _push(`<div class="px-4 pb-4 pt-3" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.03)", "border-top": "1px solid rgba(139,92,246,0.10)" })}"><div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"><!--[-->`);
            ssrRenderList([
              { label: "Org size", value: orgSizeLabel[a.org_size] ?? a.org_size },
              { label: "Country", value: a.country },
              { label: "Partner type", value: partnerMeta[a.partner_type]?.label ?? a.partner_type },
              { label: "Referral", value: a.referral ?? "—" }
            ], (field) => {
              _push(`<div class="rounded-lg px-3 py-2" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.06)" })}"><p class="text-[10px] uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(field.label)}</p><p class="text-[12px] font-medium" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">${ssrInterpolate(field.value)}</p></div>`);
            });
            _push(`<!--]--></div><div class="flex items-center gap-2 flex-wrap"><p class="text-[11px] mr-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Action:</p><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50" style="${ssrRenderStyle((a.status ?? "pending") === "approved" ? "background:rgba(35,165,90,0.15);border:1px solid rgba(35,165,90,0.25);color:rgba(35,165,90,0.85);" : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.45);")}"${ssrIncludeBooleanAttr(unref(saving) === a.id) ? " disabled" : ""}>`);
            if (unref(saving) === a.id) {
              _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(` Approve </button><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50" style="${ssrRenderStyle((a.status ?? "pending") === "pending" ? "background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.20);color:rgba(251,191,36,0.80);" : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.35);")}"${ssrIncludeBooleanAttr(unref(saving) === a.id) ? " disabled" : ""}> Reset to Pending </button><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50" style="${ssrRenderStyle((a.status ?? "pending") === "rejected" ? "background:rgba(242,63,66,0.10);border:1px solid rgba(242,63,66,0.20);color:rgba(242,63,66,0.80);" : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.35);")}"${ssrIncludeBooleanAttr(unref(saving) === a.id) ? " disabled" : ""}> Reject </button></div></div>`);
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
        _push(`<p class="mt-3 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}">${ssrInterpolate(unref(filtered).length)} ${ssrInterpolate(unref(filtered).length === 1 ? "application" : "applications")}</p>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/beta.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=beta-DMoiESiC.mjs.map
