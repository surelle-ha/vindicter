import { _ as __nuxt_component_0 } from './client-only-DoYs5VEQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-DtqAJy6p.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, resolveDynamicComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrRenderAttr, ssrRenderList, ssrRenderVNode, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { ShieldCheck, HardDrive, Cpu } from 'lucide-vue-next';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "auth",
  __ssrInlineRender: true,
  setup(__props) {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const features = [
      {
        icon: ShieldCheck,
        label: "AI-Powered Scanning",
        desc: "Automated vulnerability detection with Claude, Codex, and local models."
      },
      {
        icon: HardDrive,
        label: "Local-First Privacy",
        desc: "All analysis runs on your machine — no code leaves your environment."
      },
      {
        icon: Cpu,
        label: "Multi-Model Support",
        desc: "Claude, OpenRouter, Ollama — pick the AI that fits your workflow."
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "flex min-h-screen overflow-hidden",
        style: { "background": "#111215" }
      }, _attrs))}><div class="hidden lg:flex lg:w-[440px] xl:w-[500px] relative flex-col shrink-0"><div class="absolute inset-0">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div><div class="absolute inset-0" style="${ssrRenderStyle({ "background": "linear-gradient(135deg,rgba(17,18,21,0.75) 0%,rgba(17,18,21,0.45) 55%,transparent 100%)" })}"></div><div class="absolute inset-0" style="${ssrRenderStyle({ "background": "radial-gradient(circle at 20% 25%,rgba(139,92,246,0.24),transparent 55%)" })}"></div><div class="relative z-10 flex flex-col h-full p-10">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center gap-3 transition-opacity hover:opacity-80",
        style: { "color": "rgba(255,255,255,0.88)" }
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Vindicter" class="h-9 w-9"${_scopeId}><span class="font-display text-[20px] font-black uppercase tracking-widest"${_scopeId}>Vindicter</span>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Vindicter",
                class: "h-9 w-9"
              }),
              createVNode("span", { class: "font-display text-[20px] font-black uppercase tracking-widest" }, "Vindicter")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex-1 flex flex-col justify-center gap-10"><div><p class="text-[10px] font-semibold uppercase tracking-[0.30em] mb-3" style="${ssrRenderStyle({ "color": "rgba(139,92,246,0.75)" })}">Security Platform</p><h2 class="font-display text-[34px] font-black uppercase leading-[1.1]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}"> Local-first<br>AI security<br>review. </h2><p class="mt-4 text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.38)" })}"> The professional toolkit for developers who take security seriously. </p></div><div class="space-y-5"><!--[-->`);
      ssrRenderList(features, (f) => {
        _push(`<div class="flex items-start gap-3.5"><div class="shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.22)" })}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(f.icon), {
          class: "h-3.5 w-3.5",
          style: { "color": "rgba(139,92,246,0.80)" }
        }, null), _parent);
        _push(`</div><div><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(f.label)}</p><p class="text-[11px] mt-0.5 leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">${ssrInterpolate(f.desc)}</p></div></div>`);
      });
      _push(`<!--]--></div></div><p class="text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}"> © ${ssrInterpolate(unref(currentYear))} Vindicter. Local-first security review. </p></div></div><div class="hidden lg:block w-px shrink-0" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}"></div><div class="relative flex flex-1 flex-col overflow-y-auto" style="${ssrRenderStyle({ "background": "#111215" })}"><div class="lg:hidden absolute inset-0 opacity-20 pointer-events-none">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div><div class="lg:hidden absolute inset-0 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(circle at 50% 0%,rgba(139,92,246,0.12),transparent 50%)" })}"></div><div class="relative z-10 flex flex-1 items-center justify-center px-6 py-12"><div class="w-full max-w-[400px]">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "lg:hidden mx-auto mb-8 flex w-max items-center gap-3 transition-opacity hover:opacity-80",
        style: { "color": "rgba(255,255,255,0.80)" }
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Vindicter" class="h-9 w-9"${_scopeId}><span class="font-display text-[20px] font-black uppercase tracking-widest"${_scopeId}>Vindicter</span>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Vindicter",
                class: "h-9 w-9"
              }),
              createVNode("span", { class: "font-display text-[20px] font-black uppercase tracking-widest" }, "Vindicter")
            ];
          }
        }),
        _: 1
      }, _parent));
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`<p class="lg:hidden mt-8 text-center text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}"> © ${ssrInterpolate(unref(currentYear))} Vindicter </p></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/auth.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=auth-oolNTADo.mjs.map
