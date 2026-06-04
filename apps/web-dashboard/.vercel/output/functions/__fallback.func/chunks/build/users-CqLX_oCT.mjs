import { defineComponent, computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderAttr, ssrRenderList } from 'vue/server-renderer';
import { ShieldAlert, RefreshCw, Search, Users, Loader2 } from 'lucide-vue-next';
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
  __name: "users",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "User Management — Vindicter" });
    const { user } = useAuth();
    useRouter();
    const currentUserId = computed(() => user.value?.id ?? "");
    const users = ref([]);
    const loading = ref(true);
    const fetchErr = ref("");
    const search = ref("");
    const saving = ref(null);
    const saveMsg = ref("");
    const filtered = computed(() => {
      const q = search.value.toLowerCase().trim();
      if (!q) return users.value;
      return users.value.filter(
        (u) => u.id.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q) || (u.role ?? "").toLowerCase().includes(q)
      );
    });
    function truncId(id) {
      return id.slice(0, 8) + "…";
    }
    function fmt(iso) {
      if (!iso) return "—";
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-5xl mx-auto" }, _attrs))}><div class="mb-6 flex items-start justify-between gap-4"><div><div class="flex items-center gap-2 mb-1">`);
      _push(ssrRenderComponent(unref(ShieldAlert), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(248,113,113,0.55)" }
      }, null, _parent));
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.50)" })}">Admin</p></div><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">User Management</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">View and manage registered accounts and roles.</p></div><button class="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)", "border": "1px solid rgba(255,255,255,0.08)" })}"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3 w-3", unref(loading) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button></div>`);
      if (unref(saveMsg)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.08)", "border": "1px solid rgba(35,165,90,0.18)", "color": "rgba(35,165,90,0.85)" })}">${ssrInterpolate(unref(saveMsg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(fetchErr)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(fetchErr))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="relative mb-4">`);
      _push(ssrRenderComponent(unref(Search), {
        class: "absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none",
        style: { "color": "rgba(255,255,255,0.22)" }
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} placeholder="Search by name, email, or role…" class="w-full rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white outline-none transition-colors border border-white/8 bg-white/[0.03] focus:border-accent/40" style="${ssrRenderStyle({ "max-width": "380px" })}"></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(5, (i) => {
          _push(`<div class="h-12 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(fetchErr) && !unref(filtered).length) {
        _push(`<div class="rounded-xl px-5 py-14 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(Users), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(unref(search) ? "No users match your search." : "No user profiles found.")}</p></div>`);
      } else if (!unref(loading) && !unref(fetchErr)) {
        _push(`<div class="rounded-xl overflow-hidden" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}"><div class="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border-bottom": "1px solid rgba(255,255,255,0.06)", "color": "rgba(255,255,255,0.25)", "grid-template-columns": "120px 1fr 120px 120px 140px" })}"><span>ID</span><span>Account</span><span>Role</span><span>Joined</span><span>Change role</span></div><!--[-->`);
        ssrRenderList(unref(filtered), (u) => {
          _push(`<div class="grid items-center px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.02]" style="${ssrRenderStyle({ "border-bottom": "1px solid rgba(255,255,255,0.04)", "grid-template-columns": "120px 1fr 120px 120px 140px" })}"><span class="font-mono text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}"${ssrRenderAttr("title", u.id)}>${ssrInterpolate(truncId(u.id))}</span><div class="min-w-0 pr-4"><p class="font-medium truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(u.display_name ?? u.email ?? "—")}</p>`);
          if (u.display_name && u.email) {
            _push(`<p class="text-[11px] truncate mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">${ssrInterpolate(u.email)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><span class="inline-flex w-max items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle(u.role === "admin" ? "background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.22);color:rgba(167,139,250,0.85);" : "background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:rgba(255,255,255,0.40);")}">${ssrInterpolate(u.role ?? "user")}</span><span style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(fmt(u.created_at))}</span><div class="flex items-center gap-2">`);
          if (u.id === unref(currentUserId)) {
            _push(`<span class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}">—</span>`);
          } else {
            _push(`<!--[--><select${ssrRenderAttr("value", u.role)}${ssrIncludeBooleanAttr(unref(saving) === u.id) ? " disabled" : ""} class="rounded-lg px-2.5 py-1 text-[11px] outline-none transition-colors cursor-pointer disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)", "color": "rgba(255,255,255,0.60)" })}"><option value="user">User</option><option value="admin">Admin</option></select>`);
            if (unref(saving) === u.id) {
              _push(ssrRenderComponent(unref(Loader2), {
                class: "h-3 w-3 animate-spin",
                style: { "color": "rgba(255,255,255,0.30)" }
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading) && unref(filtered).length) {
        _push(`<p class="mt-3 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}">${ssrInterpolate(unref(filtered).length)} ${ssrInterpolate(unref(filtered).length === 1 ? "user" : "users")}${ssrInterpolate(unref(search) ? " matching" : "")}</p>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/users.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=users-CqLX_oCT.mjs.map
