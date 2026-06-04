import { _ as __nuxt_component_0 } from './nuxt-link-DtqAJy6p.mjs';
import { defineComponent, ref, computed, mergeProps, unref, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, toDisplayString, createCommentVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderVNode, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { _ as _imports_0 } from './virtual_public-WrmrQ6Qb.mjs';
import { PanelLeftClose, Newspaper, GraduationCap, LifeBuoy, Key, Users, Rss, CreditCard, MessageCircle, Star, ChevronRight, ChevronDown, User, LogOut } from 'lucide-vue-next';
import { a as useRoute, u as useRouter } from './server.mjs';
import { u as useAuth, b as useState } from './useAuth-C_mOwM2c.mjs';
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
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const { user, isAdmin } = useAuth();
    const collapsed = useState("sb-collapsed", () => false);
    const dashState = useState("dash-state", () => "checking");
    useState("dash-auth-done", () => false);
    const userMenuOpen = ref(false);
    ref(null);
    const nav = [
      { label: "News", to: "/news", icon: Newspaper },
      { label: "Academy", to: "/academy", icon: GraduationCap },
      { label: "Support", to: "/support", icon: LifeBuoy }
    ];
    const developerNav = [
      { label: "API", to: "/api", icon: Key }
    ];
    const adminNav = [
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "News Management", to: "/admin/news", icon: Rss },
      { label: "Pricing", to: "/admin/pricing", icon: CreditCard },
      { label: "Tickets", to: "/admin/tickets", icon: MessageCircle },
      { label: "Beta Requests", to: "/admin/beta", icon: Star }
    ];
    function active(to) {
      return route.path === to || to !== "/news" && route.path.startsWith(to);
    }
    const displayName = computed(() => {
      if (!user.value) return "User";
      const u = user.value;
      const meta = u.user_metadata;
      return meta?.display_name ?? u.email ?? "User";
    });
    const userEmail = computed(() => {
      if (!user.value) return "";
      return user.value.email ?? "";
    });
    const initials = computed(
      () => displayName.value.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase()
    );
    const pageTitle = computed(() => {
      const p = route.path;
      if (p === "/news") return "News";
      if (p === "/academy" || p.startsWith("/academy/")) return "Academy";
      if (p === "/api") return "API & Keys";
      if (p === "/support") return "Support";
      if (p === "/profile") return "Profile";
      if (p.startsWith("/admin/users")) return "User Management";
      if (p.startsWith("/admin/news")) return "News Management";
      if (p.startsWith("/admin/pricing")) return "Pricing";
      if (p.startsWith("/admin/tickets")) return "Support Tickets";
      if (p.startsWith("/admin/beta")) return "Beta Requests";
      return "Dashboard";
    });
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const landingUrl = computed(() => {
      return "https://vindicter.xyz";
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "h-screen flex flex-col overflow-hidden",
        style: { "background": "#111215", "color": "white", "font-family": "Inter,system-ui,sans-serif" }
      }, _attrs))}><div class="pointer-events-none fixed inset-0 -z-10" aria-hidden="true"><div class="absolute inset-0" style="${ssrRenderStyle({ "background": "#111215" })}"></div><div style="${ssrRenderStyle({ "position": "absolute", "width": "600px", "height": "600px", "border-radius": "50%", "filter": "blur(130px)", "background": "radial-gradient(circle,#3730a3 0%,transparent 70%)", "top": "-220px", "left": "-120px", "opacity": "0.08" })}"></div><div style="${ssrRenderStyle({ "position": "absolute", "width": "400px", "height": "400px", "border-radius": "50%", "filter": "blur(130px)", "background": "radial-gradient(circle,#4c1d95 0%,transparent 70%)", "bottom": "-120px", "right": "-80px", "opacity": "0.06" })}"></div></div>`);
      if (unref(dashState) === "checking") {
        _push(`<div class="flex flex-1 flex-col items-center justify-center gap-8"><div class="fixed inset-x-0 top-0 h-0.5 overflow-hidden" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.06)" })}"><div class="h-full animate-loading-bar" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.75)", "width": "60%" })}"></div></div><div class="flex flex-col items-center gap-4"><img${ssrRenderAttr("src", _imports_0)} alt="" class="h-12 w-12 opacity-50" style="${ssrRenderStyle({ "animation": "pulse 2s ease-in-out infinite" })}"><div class="flex flex-col items-center gap-2"><p class="text-[13px] font-medium" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.60)" })}">Vindicter</p><p class="text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">Verifying your session…</p></div><div class="flex items-center gap-1.5 mt-2"><div class="h-1 w-1 rounded-full animate-bounce" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.60)", "animation-delay": "0ms" })}"></div><div class="h-1 w-1 rounded-full animate-bounce" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.60)", "animation-delay": "150ms" })}"></div><div class="h-1 w-1 rounded-full animate-bounce" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.60)", "animation-delay": "300ms" })}"></div></div></div></div>`);
      } else if (unref(dashState) === "ready") {
        _push(`<div class="relative z-10 flex flex-1 overflow-hidden"><aside class="${ssrRenderClass([unref(collapsed) ? "w-12" : "w-52", "shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"])}" style="${ssrRenderStyle({ "background": "rgba(17,18,21,0.98)", "border-right": "1px solid rgba(255,255,255,0.07)" })}"><div class="${ssrRenderClass([unref(collapsed) ? "justify-center" : "gap-2", "h-11 px-3 flex items-center"])}" style="${ssrRenderStyle({ "border-bottom": "1px solid rgba(255,255,255,0.07)" })}">`);
        if (!unref(collapsed)) {
          _push(`<!--[--><img${ssrRenderAttr("src", _imports_0)} alt="" class="size-6 shrink-0 rounded-md"><span class="font-display flex-1 text-sm font-semibold truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Vindicter</span><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="size-6 flex items-center justify-center rounded transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}"${ssrRenderAttr("title", unref(collapsed) ? "Expand" : "Collapse")}>`);
        if (!unref(collapsed)) {
          _push(ssrRenderComponent(unref(PanelLeftClose), { class: "size-3.5" }, null, _parent));
        } else {
          _push(`<img${ssrRenderAttr("src", _imports_0)} alt="" class="size-6 rounded-md">`);
        }
        _push(`</button></div><nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">`);
        if (!unref(collapsed)) {
          _push(`<p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.18)" })}">Menu</p>`);
        } else {
          _push(`<div class="h-px mx-1 mb-2" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}"></div>`);
        }
        _push(`<!--[-->`);
        ssrRenderList(nav, (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.to,
            to: item.to,
            class: ["flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer", [
              unref(collapsed) ? "justify-center" : "",
              active(item.to) ? "bg-indigo-600/15 text-indigo-400" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
            ]],
            title: unref(collapsed) ? item.label : void 0
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" }, null), _parent2, _scopeId);
                if (!unref(collapsed)) {
                  _push2(`<span${_scopeId}>${ssrInterpolate(item.label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" })),
                  !unref(collapsed) ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(item.label), 1)) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--><div class="h-px mx-1 my-2" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}"></div>`);
        if (!unref(collapsed)) {
          _push(`<p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="${ssrRenderStyle({ "color": "rgba(99,102,241,0.50)" })}">Developer</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(developerNav, (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.to,
            to: item.to,
            class: ["flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer", [
              unref(collapsed) ? "justify-center" : "",
              active(item.to) ? "bg-indigo-600/15 text-indigo-400" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"
            ]],
            title: unref(collapsed) ? item.label : void 0
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" }, null), _parent2, _scopeId);
                if (!unref(collapsed)) {
                  _push2(`<span${_scopeId}>${ssrInterpolate(item.label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" })),
                  !unref(collapsed) ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(item.label), 1)) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]-->`);
        if (unref(isAdmin)) {
          _push(`<!--[--><div class="h-px mx-1 my-2" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}"></div>`);
          if (!unref(collapsed)) {
            _push(`<p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.35)" })}">Admin</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--[-->`);
          ssrRenderList(adminNav, (item) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: item.to,
              to: item.to,
              class: ["flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer", [
                unref(collapsed) ? "justify-center" : "",
                active(item.to) ? "bg-red-500/10 text-red-400" : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
              ]],
              title: unref(collapsed) ? item.label : void 0
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" }, null), _parent2, _scopeId);
                  if (!unref(collapsed)) {
                    _push2(`<span${_scopeId}>${ssrInterpolate(item.label)}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    (openBlock(), createBlock(resolveDynamicComponent(item.icon), { class: "size-3.5 shrink-0" })),
                    !unref(collapsed) ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(item.label), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</nav></aside><div class="flex flex-1 flex-col overflow-hidden"><header class="h-11 shrink-0 flex items-center justify-between px-5" style="${ssrRenderStyle({ "border-bottom": "1px solid rgba(255,255,255,0.07)", "background": "rgba(17,18,21,0.95)" })}"><div class="flex items-center gap-1.5 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.28)" })}"><span style="${ssrRenderStyle({ "color": "rgba(139,92,246,0.50)" })}">dashboard</span>`);
        _push(ssrRenderComponent(unref(ChevronRight), { class: "size-3 shrink-0" }, null, _parent));
        _push(`<span class="font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">${ssrInterpolate(unref(pageTitle))}</span></div><div class="relative"><button class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-white/[0.05] cursor-pointer"><div class="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style="${ssrRenderStyle(unref(isAdmin) ? "background:rgba(139,92,246,0.20);border:1.5px solid rgba(139,92,246,0.40);color:rgba(167,139,250,0.95);" : "background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.60);")}">${ssrInterpolate(unref(initials))}</div><div class="hidden sm:block text-left"><p class="text-[11px] leading-none truncate max-w-[140px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(unref(displayName))}</p><p class="text-[9px] mt-0.5 tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">You&#39;re logged in</p></div>`);
        _push(ssrRenderComponent(unref(ChevronDown), {
          class: ["size-3 shrink-0 transition-transform", unref(userMenuOpen) ? "rotate-180" : ""],
          style: { "color": "rgba(255,255,255,0.22)" }
        }, null, _parent));
        _push(`</button>`);
        if (unref(userMenuOpen)) {
          _push(`<div class="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50" style="${ssrRenderStyle({ "background": "rgba(22,23,28,0.99)", "border": "1px solid rgba(255,255,255,0.10)", "box-shadow": "0 20px 60px rgba(0,0,0,0.6)" })}"><div class="px-3.5 py-3" style="${ssrRenderStyle({ "border-bottom": "1px solid rgba(255,255,255,0.07)" })}"><p class="text-[12px] font-semibold truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(unref(displayName))}</p><p class="text-[10px] mt-0.5 truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(unref(userEmail))}</p><span class="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style="${ssrRenderStyle(unref(isAdmin) ? "background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.25);color:rgba(167,139,250,0.90);" : "background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.40);")}">${ssrInterpolate(unref(isAdmin) ? "Admin" : "Member")}</span></div><div class="p-1">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/profile",
            class: "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-white/[0.05] cursor-pointer",
            style: { "color": "rgba(255,255,255,0.60)" },
            onClick: ($event) => userMenuOpen.value = false
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(unref(User), {
                  class: "h-3.5 w-3.5 shrink-0",
                  style: { "color": "rgba(255,255,255,0.30)" }
                }, null, _parent2, _scopeId));
                _push2(` Profile settings `);
              } else {
                return [
                  createVNode(unref(User), {
                    class: "h-3.5 w-3.5 shrink-0",
                    style: { "color": "rgba(255,255,255,0.30)" }
                  }),
                  createTextVNode(" Profile settings ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<div class="my-1 mx-1 h-px" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}"></div><button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-red-500/[0.08] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.65)" })}">`);
          _push(ssrRenderComponent(unref(LogOut), { class: "h-3.5 w-3.5 shrink-0" }, null, _parent));
          _push(` Sign out </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></header><main class="flex-1 overflow-y-auto p-5" style="${ssrRenderStyle({ "scrollbar-width": "thin", "scrollbar-color": "rgba(255,255,255,0.08) transparent" })}">`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
        _push(`</main><footer class="shrink-0 flex items-center justify-between px-5 py-2" style="${ssrRenderStyle({ "border-top": "1px solid rgba(255,255,255,0.05)" })}"><p class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.15)" })}">© ${ssrInterpolate(unref(currentYear))} Vindicter — local-first security platform.</p><div class="flex items-center gap-4"><a${ssrRenderAttr("href", `${unref(landingUrl)}/docs`)} target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.18)" })}">Docs</a><a${ssrRenderAttr("href", `${unref(landingUrl)}/support`)} target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.18)" })}">Support</a><a${ssrRenderAttr("href", `${unref(landingUrl)}/privacy`)} target="_blank" class="text-[10px] transition-colors hover:text-white/40 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.18)" })}">Privacy</a></div></footer></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-DZasVQal.mjs.map
