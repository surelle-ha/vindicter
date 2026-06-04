import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { User, Pencil, X, Loader2, Save, Mail, Shield, Calendar, KeyRound } from 'lucide-vue-next';
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
  __name: "profile",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Profile — Vindicter" });
    const { user, isAdmin } = useAuth();
    const editing = ref(false);
    const saving = ref(false);
    const resetting = ref(false);
    const saveMsg = ref("");
    const saveErr = ref("");
    const newName = ref("");
    const profile = computed(() => {
      if (!user.value) return null;
      const u = user.value;
      const meta = u.user_metadata;
      return {
        id: u.id,
        email: u.email,
        displayName: meta?.display_name ?? u.email ?? "User",
        createdAt: u.created_at
      };
    });
    function fmt(iso) {
      return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-2xl mx-auto" }, _attrs))}><div class="mb-8"><p class="text-[11px] font-semibold uppercase tracking-[0.25em] mb-1" style="${ssrRenderStyle({ "color": "rgba(139,92,246,0.70)" })}">Account</p><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">My Profile</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Manage your account information and security settings.</p></div>`);
      if (unref(saveMsg)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.08)", "border": "1px solid rgba(35,165,90,0.18)", "color": "rgba(35,165,90,0.85)" })}">${ssrInterpolate(unref(saveMsg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(saveErr)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.85)" })}">${ssrInterpolate(unref(saveErr))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="rounded-2xl p-6 mb-4" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.08)" })}"><p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">Identity</p><div class="space-y-4"><div class="flex items-start justify-between gap-4"><div class="flex items-start gap-3 flex-1 min-w-0"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.18)" })}">`);
      _push(ssrRenderComponent(unref(User), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(167,139,250,0.70)" }
      }, null, _parent));
      _push(`</div><div class="flex-1 min-w-0"><p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Display name</p>`);
      if (!unref(editing)) {
        _push(`<div><p class="text-[14px] font-medium" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}">${ssrInterpolate(unref(profile)?.displayName)}</p></div>`);
      } else {
        _push(`<div class="flex items-center gap-2"><input${ssrRenderAttr("value", unref(newName))} class="flex-1 rounded-lg px-3 py-1.5 text-[13px] text-white outline-none transition-colors border border-white/10 bg-white/[0.05] focus:border-accent/45" placeholder="Your name"></div>`);
      }
      _push(`</div></div><div class="flex items-center gap-1.5 shrink-0 mt-0.5">`);
      if (!unref(editing)) {
        _push(`<button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.07] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">`);
        _push(ssrRenderComponent(unref(Pencil), { class: "h-3 w-3" }, null, _parent));
        _push(` Edit </button>`);
      } else {
        _push(`<!--[--><button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.07] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(unref(X), { class: "h-3 w-3" }, null, _parent));
        _push(` Cancel </button><button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors bg-accent/15 hover:bg-accent/25 cursor-pointer disabled:opacity-50" style="${ssrRenderStyle({ "color": "rgba(167,139,250,0.90)" })}"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""}>`);
        if (unref(saving)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Save), { class: "h-3 w-3" }, null, _parent));
        }
        _push(` Save </button><!--]-->`);
      }
      _push(`</div></div><div class="h-px" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)" })}"></div><div class="flex items-start gap-3"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.09)" })}">`);
      _push(ssrRenderComponent(unref(Mail), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(255,255,255,0.35)" }
      }, null, _parent));
      _push(`</div><div><p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Email address</p><p class="text-[14px] font-medium" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}">${ssrInterpolate(unref(profile)?.email)}</p><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Email cannot be changed here.</p></div></div><div class="h-px" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)" })}"></div><div class="flex items-start gap-3"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle(unref(isAdmin) ? "background:rgba(139,92,246,0.10);border:1px solid rgba(139,92,246,0.18);" : "background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);")}">`);
      _push(ssrRenderComponent(unref(Shield), {
        class: "h-3.5 w-3.5",
        style: unref(isAdmin) ? "color:rgba(167,139,250,0.70);" : "color:rgba(255,255,255,0.35);"
      }, null, _parent));
      _push(`</div><div><p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Role</p><span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle(unref(isAdmin) ? "background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);" : "background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.45);")}">${ssrInterpolate(unref(isAdmin) ? "Administrator" : "Member")}</span></div></div>`);
      if (unref(profile)?.createdAt) {
        _push(`<!--[--><div class="h-px" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)" })}"></div><div class="flex items-start gap-3"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(255,255,255,0.09)" })}">`);
        _push(ssrRenderComponent(unref(Calendar), {
          class: "h-3.5 w-3.5",
          style: { "color": "rgba(255,255,255,0.35)" }
        }, null, _parent));
        _push(`</div><div><p class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Member since</p><p class="text-[14px] font-medium" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}">${ssrInterpolate(fmt(unref(profile).createdAt))}</p></div></div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="rounded-2xl p-6" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.08)" })}"><p class="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">Security</p><div class="flex items-start justify-between gap-4"><div class="flex items-start gap-3"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(251,191,36,0.10)", "border": "1px solid rgba(251,191,36,0.18)" })}">`);
      _push(ssrRenderComponent(unref(KeyRound), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(251,191,36,0.70)" }
      }, null, _parent));
      _push(`</div><div><p class="text-[13px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">Password</p><p class="text-[11px] mt-0.5 leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">A password reset link will be sent to your email address.</p></div></div><button class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/[0.07] cursor-pointer disabled:opacity-50" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)", "border": "1px solid rgba(255,255,255,0.09)" })}"${ssrIncludeBooleanAttr(unref(resetting)) ? " disabled" : ""}>`);
      if (unref(resetting)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(` Reset password </button></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profile.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=profile-f5YfY35p.mjs.map
