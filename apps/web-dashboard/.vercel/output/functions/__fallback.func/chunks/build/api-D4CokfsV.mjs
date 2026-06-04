import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { Key, Plus, AlertTriangle, CheckCircle2, Copy, Loader2, Trash2 } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
import { u as useAuth } from './useAuth-C_mOwM2c.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "api",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "API — Vindicter" });
    useAuth();
    const tokens = ref([]);
    const loading = ref(true);
    const fetchErr = ref("");
    const creating = ref(false);
    const newName = ref("");
    const newExpiry = ref("never");
    const showCreate = ref(false);
    const justCopied = ref(null);
    const justCreatedFull = ref(null);
    function fmtDate(iso) {
      if (!iso) return "Never";
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    function isExpired(iso) {
      if (!iso) return false;
      return new Date(iso) < /* @__PURE__ */ new Date();
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-3xl mx-auto" }, _attrs))}><div class="mb-8 flex items-start justify-between gap-4"><div class="flex items-center gap-3"><div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.20)" })}">`);
      _push(ssrRenderComponent(unref(Key), {
        class: "h-4 w-4",
        style: { "color": "rgba(139,92,246,0.80)" }
      }, null, _parent));
      _push(`</div><div><h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">API &amp; Keys</h1><p class="text-[12px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Manage your DefendCore API access tokens.</p></div></div><button class="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.25)", "color": "rgba(167,139,250,0.90)" })}">`);
      _push(ssrRenderComponent(unref(Plus), { class: "h-3.5 w-3.5" }, null, _parent));
      _push(` New token </button></div><div class="mb-6 rounded-xl px-4 py-3.5 flex items-start gap-3" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.06)", "border": "1px solid rgba(139,92,246,0.14)" })}">`);
      _push(ssrRenderComponent(unref(AlertTriangle), {
        class: "h-4 w-4 shrink-0 mt-0.5",
        style: { "color": "rgba(245,158,11,0.75)" }
      }, null, _parent));
      _push(`<div><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">DefendCore API is not yet available</p><p class="text-[11px] mt-0.5 leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}"> You can generate tokens now to prepare your integrations. Active usage will be enabled when DefendCore launches. </p></div></div>`);
      if (unref(justCreatedFull)) {
        _push(`<div class="mb-5 rounded-xl px-4 py-4" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.06)", "border": "1px solid rgba(35,165,90,0.18)" })}"><div class="flex items-center gap-2 mb-2">`);
        _push(ssrRenderComponent(unref(CheckCircle2), {
          class: "h-3.5 w-3.5 shrink-0",
          style: { "color": "rgba(35,165,90,0.80)" }
        }, null, _parent));
        _push(`<p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(35,165,90,0.90)" })}">Token created — copy it now, it won&#39;t be shown again.</p></div><div class="flex items-center gap-2 rounded-lg px-3 py-2" style="${ssrRenderStyle({ "background": "rgba(0,0,0,0.25)", "border": "1px solid rgba(255,255,255,0.07)" })}"><code class="flex-1 font-mono text-[11px] break-all" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.75)" })}">${ssrInterpolate(unref(justCreatedFull))}</code><button class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.25)", "color": "rgba(167,139,250,0.90)" })}">`);
        if (unref(justCopied) === "new") {
          _push(ssrRenderComponent(unref(CheckCircle2), {
            class: "h-3 w-3",
            style: { "color": "rgba(35,165,90,0.90)" }
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Copy), { class: "h-3 w-3" }, null, _parent));
        }
        _push(`</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showCreate)) {
        _push(`<div class="mb-5 rounded-xl p-5 space-y-4" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.09)" })}"><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">New API token</p><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Token name</label><input${ssrRenderAttr("value", unref(newName))} type="text" placeholder="e.g. CI pipeline, local dev" maxlength="60" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Expiry</label><select class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"><option value="never"${ssrIncludeBooleanAttr(Array.isArray(unref(newExpiry)) ? ssrLooseContain(unref(newExpiry), "never") : ssrLooseEqual(unref(newExpiry), "never")) ? " selected" : ""}>Never expires</option><option value="30d"${ssrIncludeBooleanAttr(Array.isArray(unref(newExpiry)) ? ssrLooseContain(unref(newExpiry), "30d") : ssrLooseEqual(unref(newExpiry), "30d")) ? " selected" : ""}>30 days</option><option value="90d"${ssrIncludeBooleanAttr(Array.isArray(unref(newExpiry)) ? ssrLooseContain(unref(newExpiry), "90d") : ssrLooseEqual(unref(newExpiry), "90d")) ? " selected" : ""}>90 days</option><option value="180d"${ssrIncludeBooleanAttr(Array.isArray(unref(newExpiry)) ? ssrLooseContain(unref(newExpiry), "180d") : ssrLooseEqual(unref(newExpiry), "180d")) ? " selected" : ""}>180 days</option><option value="365d"${ssrIncludeBooleanAttr(Array.isArray(unref(newExpiry)) ? ssrLooseContain(unref(newExpiry), "365d") : ssrLooseEqual(unref(newExpiry), "365d")) ? " selected" : ""}>1 year</option></select></div><div class="flex gap-2"><button${ssrIncludeBooleanAttr(unref(creating) || !unref(newName).trim()) ? " disabled" : ""} class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.90)" })}">`);
        if (unref(creating)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Key), { class: "h-3 w-3" }, null, _parent));
        }
        _push(` Generate </button><button class="rounded-xl px-4 py-2 text-[12px] transition-colors" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.08)", "color": "rgba(255,255,255,0.35)" })}"> Cancel </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(fetchErr)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(fetchErr))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(3, (i) => {
          _push(`<div class="h-14 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(tokens).length) {
        _push(`<div class="rounded-xl px-5 py-12 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(Key), {
          class: "h-7 w-7 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">No API tokens yet. Create one above.</p></div>`);
      } else {
        _push(`<div class="rounded-xl overflow-hidden" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}"><!--[-->`);
        ssrRenderList(unref(tokens), (t, i) => {
          _push(`<div class="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]" style="${ssrRenderStyle(i < unref(tokens).length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.05);" : "")}">`);
          _push(ssrRenderComponent(unref(Key), {
            class: "h-3.5 w-3.5 shrink-0",
            style: isExpired(t.expires_at) ? "color:rgba(242,63,66,0.50);" : "color:rgba(139,92,246,0.55);"
          }, null, _parent));
          _push(`<div class="flex-1 min-w-0"><p class="text-[12px] font-semibold truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.75)" })}">${ssrInterpolate(t.name)}</p><div class="flex items-center gap-3 mt-0.5 flex-wrap"><code class="font-mono text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(t.token_prefix)}</code><span class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">Created ${ssrInterpolate(fmtDate(t.created_at))}</span><span class="text-[10px]" style="${ssrRenderStyle(isExpired(t.expires_at) ? "color:rgba(242,63,66,0.55);" : "color:rgba(255,255,255,0.22);")}">${ssrInterpolate(t.expires_at ? isExpired(t.expires_at) ? "Expired" : `Expires ${fmtDate(t.expires_at)}` : "No expiry")}</span></div></div><button class="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.45)" })}" title="Revoke token">`);
          _push(ssrRenderComponent(unref(Trash2), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(`</button></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`<p class="mt-4 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}"> Tokens grant access to the DefendCore API. Revoke any token you no longer need. </p></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/api.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=api-D4CokfsV.mjs.map
