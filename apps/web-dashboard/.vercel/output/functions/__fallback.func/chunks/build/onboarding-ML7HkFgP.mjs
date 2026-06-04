import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrRenderList, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { User, ArrowRight, Shield, Briefcase, Loader2 } from 'lucide-vue-next';
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
  __name: "onboarding",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Welcome — Vindicter" });
    const { user } = useAuth();
    useRouter();
    const step = ref(1);
    const saving = ref(false);
    const err = ref("");
    const displayName = ref(user.value?.user_metadata?.display_name ?? "");
    const jobRole = ref("");
    const experience = ref("");
    const jobRoles = [
      "Software Engineer",
      "Security Engineer",
      "DevOps / SRE",
      "Penetration Tester",
      "Security Researcher",
      "Student / Learning",
      "Other"
    ];
    const experienceLevels = [
      { value: "beginner", label: "Beginner", desc: "New to security, learning the basics" },
      { value: "intermediate", label: "Intermediate", desc: "Familiar with security concepts and tools" },
      { value: "advanced", label: "Advanced", desc: "Professional experience in security" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "min-h-screen flex flex-col items-center justify-center px-5 py-12",
        style: { "background": "#111215" }
      }, _attrs))}><div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true"><div style="${ssrRenderStyle({ "position": "absolute", "width": "700px", "height": "700px", "border-radius": "50%", "filter": "blur(160px)", "background": "radial-gradient(circle,#4c1d95 0%,transparent 70%)", "top": "-200px", "left": "50%", "transform": "translateX(-50%)", "opacity": "0.10" })}"></div></div><div class="w-full max-w-md"><div class="flex items-center justify-center gap-3 mb-10"><img${ssrRenderAttr("src", _imports_0)} alt="Vindicter" class="h-10 w-10 rounded-xl"><span class="font-display text-[20px] font-black uppercase tracking-widest" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Vindicter</span></div><div class="flex items-center justify-center gap-2 mb-8"><!--[-->`);
      ssrRenderList(2, (s) => {
        _push(`<div class="h-1.5 rounded-full transition-all duration-300" style="${ssrRenderStyle(s <= unref(step) ? "background:rgba(139,92,246,0.80);width:28px;" : "background:rgba(255,255,255,0.12);width:16px;")}"></div>`);
      });
      _push(`<!--]--></div>`);
      if (unref(step) === 1) {
        _push(`<div class="space-y-6"><div class="text-center mb-8"><div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.22)" })}">`);
        _push(ssrRenderComponent(unref(User), {
          class: "h-7 w-7",
          style: { "color": "rgba(167,139,250,0.85)" }
        }, null, _parent));
        _push(`</div><h1 class="font-display text-[28px] font-black uppercase" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}">Welcome aboard</h1><p class="mt-2 text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Let&#39;s personalise your experience. This takes under a minute.</p></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Your name</label><input${ssrRenderAttr("value", unref(displayName))} placeholder="Jane Smith" class="w-full rounded-xl px-4 py-3 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.04] focus:border-accent/45"></div><button class="w-full rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 text-white cursor-pointer"> Next `);
        _push(ssrRenderComponent(unref(ArrowRight), { class: "h-4 w-4" }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<div class="space-y-6"><div class="text-center mb-8"><div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.22)" })}">`);
        _push(ssrRenderComponent(unref(Shield), {
          class: "h-7 w-7",
          style: { "color": "rgba(167,139,250,0.85)" }
        }, null, _parent));
        _push(`</div><h1 class="font-display text-[28px] font-black uppercase" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}">Your background</h1><p class="mt-2 text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Helps us tailor your security learning path.</p></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">`);
        _push(ssrRenderComponent(unref(Briefcase), { class: "inline h-3 w-3 mr-1" }, null, _parent));
        _push(`Your role </label><div class="grid grid-cols-2 gap-2"><!--[-->`);
        ssrRenderList(jobRoles, (role) => {
          _push(`<button class="rounded-xl px-3 py-2.5 text-[12px] font-medium text-left transition-colors cursor-pointer" style="${ssrRenderStyle(unref(jobRole) === role ? "background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.45);")}">${ssrInterpolate(role)}</button>`);
        });
        _push(`<!--]--></div></div><div><label class="block mb-2 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Security experience</label><div class="space-y-2"><!--[-->`);
        ssrRenderList(experienceLevels, (lvl) => {
          _push(`<button class="w-full rounded-xl px-4 py-3 text-left transition-colors cursor-pointer" style="${ssrRenderStyle(unref(experience) === lvl.value ? "background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.30);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);")}"><p class="text-[13px] font-semibold" style="${ssrRenderStyle(unref(experience) === lvl.value ? "color:rgba(167,139,250,0.95);" : "color:rgba(255,255,255,0.70);")}">${ssrInterpolate(lvl.label)}</p><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">${ssrInterpolate(lvl.desc)}</p></button>`);
        });
        _push(`<!--]--></div></div>`);
        if (unref(err)) {
          _push(`<p class="text-[11px] text-center" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(err))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-3"><button class="flex-1 rounded-xl py-3 text-[13px] font-semibold transition-colors cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.10)", "color": "rgba(255,255,255,0.40)" })}">Back</button><button${ssrIncludeBooleanAttr(unref(saving) || !unref(jobRole) || !unref(experience)) ? " disabled" : ""} class="flex-1 rounded-xl py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer">`);
        if (unref(saving)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(` ${ssrInterpolate(unref(saving) ? "Saving…" : "Get started")}</button></div></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/onboarding.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=onboarding-ML7HkFgP.mjs.map
