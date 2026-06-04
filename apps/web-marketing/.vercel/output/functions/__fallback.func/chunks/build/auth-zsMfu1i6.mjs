import { d as __nuxt_component_0$1 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-Ctkw-rT2.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, resolveDynamicComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrRenderVNode, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { UsersRound, Megaphone, ShieldCheck } from 'lucide-vue-next';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "auth",
  __ssrInlineRender: true,
  setup(__props) {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const notes = [
      { icon: UsersRound, label: "Distribution lists", value: "Internal contacts, operators, partners, and controlled groups" },
      { icon: Megaphone, label: "Comms workflow", value: "Draft, preview, test, and send through the API SMTP layer" },
      { icon: ShieldCheck, label: "Internal workspace", value: "Built for admins and internal teams behind restricted access" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen overflow-hidden bg-base" }, _attrs))}><div class="hidden lg:flex lg:w-[460px] xl:w-[520px] relative flex-col shrink-0"><div class="absolute inset-0">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div><div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,18,21,0.82),rgba(17,18,21,0.58),rgba(17,18,21,0.30))]"></div><div class="relative z-10 flex h-full flex-col p-10">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center gap-3 text-white/85 transition-opacity hover:opacity-80"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Vindicter" class="h-9 w-9 rounded-md"${_scopeId}><span class="font-display text-[20px] font-black uppercase tracking-widest"${_scopeId}>Vindicter</span>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Vindicter",
                class: "h-9 w-9 rounded-md"
              }),
              createVNode("span", { class: "font-display text-[20px] font-black uppercase tracking-widest" }, "Vindicter")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex flex-1 flex-col justify-center gap-8"><div><p class="mb-3 text-[10px] font-semibold uppercase tracking-[0.30em] text-teal/70">Internal Ops</p><h2 class="font-display text-[34px] font-black uppercase leading-[1.1] text-white/90"> Internal<br>comms<br>control. </h2></div><div class="space-y-4"><!--[-->`);
      ssrRenderList(notes, (item) => {
        _push(`<div class="flex items-start gap-3.5"><div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-teal/20 bg-teal/10">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.icon), { class: "h-3.5 w-3.5 text-teal/80" }, null), _parent);
        _push(`</div><div><p class="text-[12px] font-semibold text-white/80">${ssrInterpolate(item.label)}</p><p class="mt-0.5 text-[11px] leading-relaxed text-white/35">${ssrInterpolate(item.value)}</p></div></div>`);
      });
      _push(`<!--]--></div></div><p class="text-[11px] text-white/25">© ${ssrInterpolate(unref(currentYear))} Vindicter</p></div></div><div class="hidden w-px shrink-0 bg-white/[0.07] lg:block"></div><div class="relative flex flex-1 flex-col overflow-y-auto bg-base"><div class="absolute inset-0 opacity-20 pointer-events-none lg:hidden">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div><div class="relative z-10 flex flex-1 items-center justify-center px-6 py-12"><div class="w-full max-w-[410px]">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "mx-auto mb-8 flex w-max items-center gap-3 text-white/80 transition-opacity hover:opacity-80 lg:hidden"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="Vindicter" class="h-9 w-9 rounded-md"${_scopeId}><span class="font-display text-[20px] font-black uppercase tracking-widest"${_scopeId}>Vindicter</span>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "Vindicter",
                class: "h-9 w-9 rounded-md"
              }),
              createVNode("span", { class: "font-display text-[20px] font-black uppercase tracking-widest" }, "Vindicter")
            ];
          }
        }),
        _: 1
      }, _parent));
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`<p class="mt-8 text-center text-[11px] text-white/25 lg:hidden">© ${ssrInterpolate(unref(currentYear))} Vindicter</p></div></div></div></div>`);
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
//# sourceMappingURL=auth-zsMfu1i6.mjs.map
