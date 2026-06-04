import { u as useRoute, a as useRouter, d as __nuxt_component_0$1 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-Ctkw-rT2.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, toDisplayString, createCommentVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderComponent, ssrRenderClass, ssrRenderList, ssrRenderVNode, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { Loader2, PanelLeftClose, LayoutDashboard, Megaphone, SquarePen, History, UsersRound, ChevronRight, ChevronDown, Send, LogOut } from 'lucide-vue-next';
import { u as useAuth } from './useAuth-C_pnMUGF.mjs';
import { a as useState } from './useApi-wCkPPjv2.mjs';
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
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const { user } = useAuth();
    const collapsed = useState("marketing-sidebar-collapsed", () => false);
    const shellState = useState("marketing-shell-state", () => "checking");
    useState("marketing-auth-checked", () => false);
    const userMenuOpen = ref(false);
    ref(null);
    const nav = [
      { label: "Comms", to: "/campaigns", icon: Megaphone },
      { label: "Templates", to: "/templates", icon: SquarePen },
      { label: "Send History", to: "/history", icon: History },
      { label: "Distribution Lists", to: "/audiences", icon: UsersRound }
    ];
    function active(to) {
      return route.path === to || route.path.startsWith(`${to}/`);
    }
    const pageTitle = computed(() => {
      if (route.path.startsWith("/audiences")) return "Distribution Lists";
      if (route.path.startsWith("/templates")) return "Templates";
      if (route.path.startsWith("/history")) return "Send History";
      if (route.path.startsWith("/campaigns")) return "Comms";
      return "Internal Ops";
    });
    const displayName = computed(() => {
      const current = user.value;
      return current?.displayName ?? current?.email ?? "Internal user";
    });
    const userEmail = computed(() => user.value?.email ?? "");
    const initials = computed(
      () => displayName.value.split(" ").map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase()
    );
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex h-screen flex-col overflow-hidden bg-base text-white" }, _attrs))}>`);
      if (unref(shellState) === "checking") {
        _push(`<div class="flex flex-1 items-center justify-center"><div class="flex flex-col items-center gap-3"><img${ssrRenderAttr("src", _imports_0)} alt="" class="h-10 w-10 rounded-md opacity-45"><div class="flex items-center gap-2 text-[12px] text-white/35">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
        _push(` Loading... </div></div></div>`);
      } else {
        _push(`<div class="flex flex-1 overflow-hidden"><aside class="${ssrRenderClass([unref(collapsed) ? "w-12" : "w-56", "relative shrink-0 overflow-hidden transition-[width] duration-200"])}"><div class="absolute inset-0 opacity-45">`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</div><div class="absolute inset-0 bg-base/80"></div><div class="relative z-10 flex h-full flex-col border-r border-white/[0.08]"><div class="${ssrRenderClass([unref(collapsed) ? "justify-center" : "gap-2", "flex h-12 items-center border-b border-white/[0.08] px-3"])}">`);
        if (!unref(collapsed)) {
          _push(`<!--[--><img${ssrRenderAttr("src", _imports_0)} alt="" class="h-6 w-6 shrink-0 rounded-md"><span class="font-display flex-1 truncate text-sm font-semibold">Vindicter</span><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/75"${ssrRenderAttr("title", unref(collapsed) ? "Expand" : "Collapse")}>`);
        if (!unref(collapsed)) {
          _push(ssrRenderComponent(unref(PanelLeftClose), { class: "h-3.5 w-3.5" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(LayoutDashboard), { class: "h-3.5 w-3.5" }, null, _parent));
        }
        _push(`</button></div><nav class="flex-1 space-y-1 overflow-y-auto p-2">`);
        if (!unref(collapsed)) {
          _push(`<p class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Marketing</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(nav, (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.to,
            to: item.to,
            class: ["flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors", [
              unref(collapsed) ? "justify-center" : "",
              active(item.to) ? "bg-teal/12 text-teal" : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
            ]],
            title: unref(collapsed) ? item.label : void 0
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "h-3.5 w-3.5 shrink-0" }, null), _parent2, _scopeId);
                if (!unref(collapsed)) {
                  _push2(`<span${_scopeId}>${ssrInterpolate(item.label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "h-3.5 w-3.5 shrink-0" })),
                  !unref(collapsed) ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(item.label), 1)) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav></div></aside><div class="flex min-w-0 flex-1 flex-col"><header class="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-base/95 px-5"><div class="flex items-center gap-1.5 text-[11px] text-white/30"><span class="text-teal/65">internal</span>`);
        _push(ssrRenderComponent(unref(ChevronRight), { class: "h-3 w-3" }, null, _parent));
        _push(`<span class="font-semibold text-white/75">${ssrInterpolate(unref(pageTitle))}</span></div><div class="relative"><button class="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.06]"><div class="flex h-7 w-7 items-center justify-center rounded-full border border-teal/35 bg-teal/15 text-[10px] font-bold text-teal">${ssrInterpolate(unref(initials))}</div><div class="hidden text-left sm:block"><p class="max-w-[140px] truncate text-[12px] font-semibold leading-none text-white/80">${ssrInterpolate(unref(displayName))}</p><p class="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal/60">Internal</p></div>`);
        _push(ssrRenderComponent(unref(ChevronDown), {
          class: ["h-3 w-3 text-white/25", unref(userMenuOpen) ? "rotate-180" : ""]
        }, null, _parent));
        _push(`</button>`);
        if (unref(userMenuOpen)) {
          _push(`<div class="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-white/[0.10] bg-panel shadow-2xl"><div class="border-b border-white/[0.07] px-3.5 py-3"><p class="truncate text-[12px] font-semibold text-white/80">${ssrInterpolate(unref(displayName))}</p><p class="mt-0.5 truncate text-[10px] text-white/35">${ssrInterpolate(unref(userEmail))}</p></div><div class="p-1">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/campaigns",
            class: "flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-white/60 transition-colors hover:bg-white/[0.05]",
            onClick: ($event) => userMenuOpen.value = false
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(unref(Send), { class: "h-3.5 w-3.5 text-white/35" }, null, _parent2, _scopeId));
                _push2(` Comms `);
              } else {
                return [
                  createVNode(unref(Send), { class: "h-3.5 w-3.5 text-white/35" }),
                  createTextVNode(" Comms ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/templates",
            class: "flex items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-white/60 transition-colors hover:bg-white/[0.05]",
            onClick: ($event) => userMenuOpen.value = false
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(unref(SquarePen), { class: "h-3.5 w-3.5 text-white/35" }, null, _parent2, _scopeId));
                _push2(` Templates `);
              } else {
                return [
                  createVNode(unref(SquarePen), { class: "h-3.5 w-3.5 text-white/35" }),
                  createTextVNode(" Templates ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<div class="mx-1 my-1 h-px bg-white/[0.07]"></div><button class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] text-err/70 transition-colors hover:bg-err/[0.08]">`);
          _push(ssrRenderComponent(unref(LogOut), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(` Sign out </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><main class="flex-1 overflow-y-auto p-5">`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</main><footer class="flex shrink-0 items-center justify-between border-t border-white/[0.05] px-5 py-2"><p class="text-[10px] text-white/18">© ${ssrInterpolate(unref(currentYear))} Vindicter Internal Comms</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/audiences",
          class: "text-[10px] text-white/22 transition-colors hover:text-white/45"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Distribution Lists`);
            } else {
              return [
                createTextVNode("Distribution Lists")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</footer></div></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-C7tSto8Y.mjs.map
