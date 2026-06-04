import { defineComponent, ref, reactive, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderAttr, ssrRenderList } from 'vue/server-renderer';
import { CreditCard, RefreshCw, Plus, Zap, Loader2, Edit3, ToggleRight, ToggleLeft, Trash2, Check, X } from 'lucide-vue-next';
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
  __name: "pricing",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Pricing Management — Vindicter" });
    useAuth();
    useRouter();
    const plans = ref([]);
    const loading = ref(true);
    const err = ref("");
    const msg = ref("");
    const msgType = ref("ok");
    const saving = ref(false);
    const showAdd = ref(false);
    const editingId = ref(null);
    const blankForm = () => ({ name: "", description: "", token_limit: 0, price_usd: 0, sort_order: 0 });
    const addForm = reactive(blankForm());
    const editForm = reactive({ name: "", description: "", token_limit: 0, price_usd: 0, sort_order: 0 });
    const addErr = ref("");
    function fmt(n) {
      return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-4xl mx-auto" }, _attrs))}><div class="mb-6 flex items-start justify-between gap-4"><div><div class="flex items-center gap-2 mb-1">`);
      _push(ssrRenderComponent(unref(CreditCard), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(248,113,113,0.55)" }
      }, null, _parent));
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.50)" })}">Admin</p></div><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Pricing Management</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Manage DefendCore token-based subscription plans.</p></div><div class="flex gap-2 shrink-0"><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)", "border": "1px solid rgba(255,255,255,0.08)" })}"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3 w-3", unref(loading) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.18)", "border": "1px solid rgba(139,92,246,0.30)", "color": "rgba(167,139,250,0.95)" })}">`);
      _push(ssrRenderComponent(unref(Plus), { class: "h-3 w-3" }, null, _parent));
      _push(` Add Plan </button></div></div>`);
      if (unref(msg)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="${ssrRenderStyle(unref(msgType) === "ok" ? "background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);" : "background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);")}">${ssrInterpolate(unref(msg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(err)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(err))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-5 rounded-xl px-4 py-3 flex items-start gap-3" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.06)", "border": "1px solid rgba(139,92,246,0.14)" })}">`);
      _push(ssrRenderComponent(unref(Zap), {
        class: "h-4 w-4 shrink-0 mt-0.5",
        style: { "color": "rgba(167,139,250,0.65)" }
      }, null, _parent));
      _push(`<p class="text-[12px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.45)" })}"> Plans define the token allowances for DefendCore usage. Token limits represent monthly AI token consumption. Pricing is informational until DefendCore billing is live. </p></div>`);
      if (unref(showAdd)) {
        _push(`<div class="mb-5 rounded-xl p-5 space-y-4" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.09)" })}"><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">New Plan</p><div class="grid gap-4 sm:grid-cols-2"><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Name</label><input${ssrRenderAttr("value", unref(addForm).name)} placeholder="e.g. Pro" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Description</label><input${ssrRenderAttr("value", unref(addForm).description)} placeholder="Short description" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Token Limit</label><input${ssrRenderAttr("value", unref(addForm).token_limit)} type="number" min="0" placeholder="e.g. 1000000" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Price (USD/mo)</label><input${ssrRenderAttr("value", unref(addForm).price_usd)} type="number" min="0" step="0.01" placeholder="0.00" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Sort Order</label><input${ssrRenderAttr("value", unref(addForm).sort_order)} type="number" min="0" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div></div>`);
        if (unref(addErr)) {
          _push(`<p class="text-[11px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(addErr))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-2"><button${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold disabled:opacity-50 cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.90)" })}">`);
        if (unref(saving)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Plus), { class: "h-3 w-3" }, null, _parent));
        }
        _push(` Create </button><button class="rounded-xl px-4 py-2 text-[12px] cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.08)", "color": "rgba(255,255,255,0.35)" })}">Cancel</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-16 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(plans).length) {
        _push(`<div class="grid gap-3 sm:grid-cols-2"><!--[-->`);
        ssrRenderList(unref(plans), (plan) => {
          _push(`<div class="rounded-xl p-5 transition-colors" style="${ssrRenderStyle(plan.is_active ? "background:rgba(255,255,255,0.03);border:1px solid rgba(139,92,246,0.18);" : "background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.07);opacity:0.55;")}">`);
          if (unref(editingId) !== plan.id) {
            _push(`<!--[--><div class="flex items-start justify-between gap-2 mb-3"><div><p class="text-[15px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.88)" })}">${ssrInterpolate(plan.name)}</p>`);
            if (plan.description) {
              _push(`<p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">${ssrInterpolate(plan.description)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="flex items-center gap-1.5 shrink-0"><button class="h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.28)" })}">`);
            _push(ssrRenderComponent(unref(Edit3), { class: "h-3 w-3" }, null, _parent));
            _push(`</button><button class="h-6 w-6 flex items-center justify-center rounded transition-colors cursor-pointer"${ssrRenderAttr("title", plan.is_active ? "Disable" : "Enable")}>`);
            if (plan.is_active) {
              _push(ssrRenderComponent(unref(ToggleRight), {
                class: "h-4 w-4",
                style: { "color": "rgba(35,165,90,0.75)" }
              }, null, _parent));
            } else {
              _push(ssrRenderComponent(unref(ToggleLeft), {
                class: "h-4 w-4",
                style: { "color": "rgba(255,255,255,0.25)" }
              }, null, _parent));
            }
            _push(`</button><button class="h-6 w-6 flex items-center justify-center rounded transition-colors hover:bg-red-500/10 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.40)" })}">`);
            _push(ssrRenderComponent(unref(Trash2), { class: "h-3 w-3" }, null, _parent));
            _push(`</button></div></div><div class="flex items-end justify-between mt-4"><div><p class="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Tokens / month</p><p class="text-[18px] font-black" style="${ssrRenderStyle({ "color": "rgba(167,139,250,0.90)" })}">${ssrInterpolate(fmt(plan.token_limit))}</p></div><div class="text-right"><p class="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Price</p><p class="text-[18px] font-black" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(plan.price_usd === 0 ? "Free" : `$${Number(plan.price_usd).toFixed(2)}/mo`)}</p></div></div><!--]-->`);
          } else {
            _push(`<div class="space-y-3"><div class="grid gap-2 grid-cols-2"><div><label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Name</label><input${ssrRenderAttr("value", unref(editForm).name)} class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.10)" })}"></div><div><label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Sort</label><input${ssrRenderAttr("value", unref(editForm).sort_order)} type="number" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.10)" })}"></div></div><div><label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Description</label><input${ssrRenderAttr("value", unref(editForm).description)} class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.10)" })}"></div><div class="grid gap-2 grid-cols-2"><div><label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Token Limit</label><input${ssrRenderAttr("value", unref(editForm).token_limit)} type="number" min="0" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.10)" })}"></div><div><label class="block text-[9px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Price USD</label><input${ssrRenderAttr("value", unref(editForm).price_usd)} type="number" min="0" step="0.01" class="w-full rounded-lg px-2.5 py-1.5 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.10)" })}"></div></div><div class="flex gap-2 pt-1"><button class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.12)", "border": "1px solid rgba(35,165,90,0.22)", "color": "rgba(35,165,90,0.85)" })}">`);
            _push(ssrRenderComponent(unref(Check), { class: "h-3 w-3" }, null, _parent));
            _push(` Save </button><button class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.08)", "color": "rgba(255,255,255,0.30)" })}">`);
            _push(ssrRenderComponent(unref(X), { class: "h-3 w-3" }, null, _parent));
            _push(` Cancel </button></div></div>`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="rounded-xl px-5 py-14 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(CreditCard), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">No plans yet. Add one above.</p></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/pricing.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=pricing-Ds2BnOFK.mjs.map
