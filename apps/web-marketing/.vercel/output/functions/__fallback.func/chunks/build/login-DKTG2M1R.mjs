import { defineComponent, ref, computed, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderDynamicModel, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { u as useRoute, a as useRouter, b as useRuntimeConfig } from './server.mjs';
import { u as useHead } from './composables-BaTf4Ku9.mjs';
import { u as useAuth } from './useAuth-C_pnMUGF.mjs';
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
import 'pinia';
import 'vue-router';
import '@vue/shared';
import './useApi-wCkPPjv2.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Login" });
    const route = useRoute();
    useRouter();
    const { public: { turnstileSiteKey } } = useRuntimeConfig();
    useAuth();
    const loading = ref(false);
    const errorMessage = ref(route.query.reason === "internal" ? "Internal comms access is limited to approved team accounts." : "");
    const email = ref("");
    const password = ref("");
    const showPassword = ref(false);
    const turnstileToken = ref("");
    ref(null);
    ref(null);
    const turnstileReady = computed(() => !turnstileSiteKey || Boolean(turnstileToken.value));
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-7"><div class="mb-2 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(ShieldCheck), { class: "h-3.5 w-3.5 text-teal/75" }, null, _parent));
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal/75">Internal Tool</p></div><h1 class="font-display text-[32px] font-black uppercase leading-none text-white/92">Internal login</h1><p class="mt-2.5 text-[13px] leading-relaxed text-white/42"> Sign in with your Vindicter API account. </p></div><div class="space-y-4 rounded-md border border-white/[0.08] bg-white/[0.035] p-6"><form class="space-y-4"><div><label class="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/38">Email address</label><div class="relative">`);
      _push(ssrRenderComponent(unref(Mail), { class: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(email))} type="email" required autocomplete="email" placeholder="admin@example.com" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"></div></div><div><label class="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-white/38">Password</label><div class="relative">`);
      _push(ssrRenderComponent(unref(Lock), { class: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
      _push(`<input${ssrRenderDynamicModel(unref(showPassword) ? "text" : "password", unref(password), null)}${ssrRenderAttr("type", unref(showPassword) ? "text" : "password")} required autocomplete="current-password" placeholder="Your password" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-10 text-[13px] text-white outline-none transition-colors focus:border-teal/45"><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"${ssrRenderAttr("title", unref(showPassword) ? "Hide password" : "Show password")}>`);
      if (!unref(showPassword)) {
        _push(ssrRenderComponent(unref(Eye), { class: "h-3.5 w-3.5" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(EyeOff), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(`</button></div></div>`);
      if (unref(errorMessage)) {
        _push(`<div class="rounded-md border border-err/20 bg-err/10 px-3.5 py-3 text-[12px] text-err/85">${ssrInterpolate(unref(errorMessage))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(turnstileSiteKey)) {
        _push(`<div class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-3"><div class="min-h-[65px]"></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading) || !unref(turnstileReady)) ? " disabled" : ""} class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-[13px] font-bold text-base transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60">`);
      if (unref(loading)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(loading) ? "Signing in..." : "Sign in")}</button></form></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-DKTG2M1R.mjs.map
