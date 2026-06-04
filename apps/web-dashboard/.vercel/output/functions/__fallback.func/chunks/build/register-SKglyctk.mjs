import { _ as __nuxt_component_0 } from './client-only-DoYs5VEQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-DtqAJy6p.mjs';
import { defineComponent, ref, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrRenderDynamicModel, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
import { u as useRouter } from './server.mjs';
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
  __name: "register",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Register — Vindicter" });
    useRouter();
    const loading = ref(false);
    const errorMessage = ref("");
    const notice = ref("");
    const displayName = ref("");
    const email = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const showPassword = ref(false);
    const showConfirm = ref(false);
    ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-7"><p class="text-[10px] font-semibold uppercase tracking-[0.28em] mb-2" style="${ssrRenderStyle({ "color": "rgba(139,92,246,0.70)" })}">Member Portal</p><h1 class="font-display text-[32px] font-black uppercase leading-none" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}">Create account</h1><p class="mt-2.5 text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}"> New accounts start with the standard user role. </p></div><div class="rounded-2xl p-6 space-y-4" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.08)" })}"><form class="space-y-4"><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Full name</label><div class="relative">`);
      _push(ssrRenderComponent(unref(User), {
        class: "absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(displayName))} required autocomplete="name" placeholder="Jane Smith" class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"></div></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Email address</label><div class="relative">`);
      _push(ssrRenderComponent(unref(Mail), {
        class: "absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(email))} type="email" required autocomplete="email" placeholder="you@example.com" class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"></div></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Password</label><div class="relative">`);
      _push(ssrRenderComponent(unref(Lock), {
        class: "absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderDynamicModel(unref(showPassword) ? "text" : "password", unref(password), null)}${ssrRenderAttr("type", unref(showPassword) ? "text" : "password")} required minlength="6" autocomplete="new-password" placeholder="At least 6 characters" class="w-full rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white/50 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">`);
      if (!unref(showPassword)) {
        _push(ssrRenderComponent(unref(Eye), { class: "h-3.5 w-3.5" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(EyeOff), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(`</button></div></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Confirm password</label><div class="relative">`);
      _push(ssrRenderComponent(unref(Lock), {
        class: "absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderDynamicModel(unref(showConfirm) ? "text" : "password", unref(confirmPassword), null)}${ssrRenderAttr("type", unref(showConfirm) ? "text" : "password")} required autocomplete="new-password" placeholder="Repeat your password" class="w-full rounded-xl pl-9 pr-10 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45" style="${ssrRenderStyle(unref(confirmPassword) && unref(confirmPassword) !== unref(password) ? "border-color:rgba(242,63,66,0.40)" : "")}"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white/50 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">`);
      if (!unref(showConfirm)) {
        _push(ssrRenderComponent(unref(Eye), { class: "h-3.5 w-3.5" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(EyeOff), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(`</button></div>`);
      if (unref(confirmPassword) && unref(confirmPassword) !== unref(password)) {
        _push(`<p class="mt-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.75)" })}">Passwords do not match.</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex justify-center pt-1">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div>`);
      if (unref(errorMessage)) {
        _push(`<div class="rounded-xl px-3.5 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.85)" })}">${ssrInterpolate(unref(errorMessage))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(notice)) {
        _push(`<div class="rounded-xl px-3.5 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.08)", "border": "1px solid rgba(35,165,90,0.18)", "color": "rgba(35,165,90,0.85)" })}">${ssrInterpolate(unref(notice))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading) || !!unref(confirmPassword) && unref(confirmPassword) !== unref(password)) ? " disabled" : ""} class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white">`);
      if (unref(loading)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(loading) ? "Creating account…" : "Create account")}</button></form></div><p class="mt-5 text-center text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}"> Already registered? `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/auth/login",
        class: "font-semibold transition-colors text-accent hover:text-accent/80"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sign in`);
          } else {
            return [
              createTextVNode("Sign in")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/register.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=register-SKglyctk.mjs.map
