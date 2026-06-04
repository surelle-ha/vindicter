import { defineComponent, ref, reactive, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { Rss, RefreshCw, Loader2, Plus, Globe, ToggleRight, ToggleLeft, ExternalLink, Trash2 } from 'lucide-vue-next';
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
  __name: "news",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "News Management — Vindicter" });
    useAuth();
    useRouter();
    const feeds = ref([]);
    const loading = ref(true);
    const fetchErr = ref("");
    const saving = ref(false);
    const msg = ref("");
    const msgType = ref("ok");
    const showAdd = ref(false);
    const newFeed = reactive({ name: "", url: "", category: "general" });
    const addErr = ref("");
    const syncing = ref(false);
    const syncMsg = ref("");
    function fmt(iso) {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-4xl mx-auto" }, _attrs))}><div class="mb-6 flex items-start justify-between gap-4"><div><div class="flex items-center gap-2 mb-1">`);
      _push(ssrRenderComponent(unref(Rss), {
        class: "h-3.5 w-3.5",
        style: { "color": "rgba(248,113,113,0.55)" }
      }, null, _parent));
      _push(`<p class="text-[10px] font-semibold uppercase tracking-[0.22em]" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.50)" })}">Admin</p></div><h1 class="text-[26px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">News Management</h1><p class="mt-1 text-[13px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}">Manage RSS feeds and sync articles shown to users.</p></div><div class="flex items-center gap-2 shrink-0"><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)", "border": "1px solid rgba(255,255,255,0.08)" })}"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3 w-3", unref(loading) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.25)", "color": "rgba(167,139,250,0.90)" })}"${ssrIncludeBooleanAttr(unref(syncing)) ? " disabled" : ""}>`);
      if (unref(syncing)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(RefreshCw), { class: "h-3 w-3" }, null, _parent));
      }
      _push(` ${ssrInterpolate(unref(syncing) ? "Syncing…" : "Sync Now")}</button><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.18)", "border": "1px solid rgba(139,92,246,0.30)", "color": "rgba(167,139,250,0.95)" })}">`);
      _push(ssrRenderComponent(unref(Plus), { class: "h-3 w-3" }, null, _parent));
      _push(` Add Feed </button></div></div>`);
      if (unref(msg)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="${ssrRenderStyle(unref(msgType) === "ok" ? "background:rgba(35,165,90,0.08);border:1px solid rgba(35,165,90,0.18);color:rgba(35,165,90,0.85);" : "background:rgba(242,63,66,0.08);border:1px solid rgba(242,63,66,0.18);color:rgba(242,63,66,0.80);")}">${ssrInterpolate(unref(msg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(syncMsg)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-2.5 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.08)", "border": "1px solid rgba(139,92,246,0.18)", "color": "rgba(167,139,250,0.85)" })}">${ssrInterpolate(unref(syncMsg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(fetchErr)) {
        _push(`<div class="mb-4 rounded-xl px-4 py-3 text-[12px]" style="${ssrRenderStyle({ "background": "rgba(242,63,66,0.08)", "border": "1px solid rgba(242,63,66,0.18)", "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(fetchErr))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(showAdd)) {
        _push(`<div class="mb-5 rounded-xl p-5 space-y-4" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)", "border": "1px solid rgba(255,255,255,0.09)" })}"><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}">Add RSS Feed</p><div class="grid gap-4 sm:grid-cols-3"><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Feed name</label><input${ssrRenderAttr("value", unref(newFeed).name)} placeholder="e.g. CS Hub Attacks" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div><div class="sm:col-span-2"><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">RSS URL</label><input${ssrRenderAttr("value", unref(newFeed).url)} placeholder="https://…/rss" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"></div></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Category</label><select class="rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}"><option value="general"${ssrIncludeBooleanAttr(Array.isArray(unref(newFeed).category) ? ssrLooseContain(unref(newFeed).category, "general") : ssrLooseEqual(unref(newFeed).category, "general")) ? " selected" : ""}>General</option><option value="attacks"${ssrIncludeBooleanAttr(Array.isArray(unref(newFeed).category) ? ssrLooseContain(unref(newFeed).category, "attacks") : ssrLooseEqual(unref(newFeed).category, "attacks")) ? " selected" : ""}>Attacks</option><option value="articles"${ssrIncludeBooleanAttr(Array.isArray(unref(newFeed).category) ? ssrLooseContain(unref(newFeed).category, "articles") : ssrLooseEqual(unref(newFeed).category, "articles")) ? " selected" : ""}>Articles</option><option value="reports"${ssrIncludeBooleanAttr(Array.isArray(unref(newFeed).category) ? ssrLooseContain(unref(newFeed).category, "reports") : ssrLooseEqual(unref(newFeed).category, "reports")) ? " selected" : ""}>Reports</option><option value="vulnerabilities"${ssrIncludeBooleanAttr(Array.isArray(unref(newFeed).category) ? ssrLooseContain(unref(newFeed).category, "vulnerabilities") : ssrLooseEqual(unref(newFeed).category, "vulnerabilities")) ? " selected" : ""}>Vulnerabilities</option></select></div>`);
        if (unref(addErr)) {
          _push(`<p class="text-[11px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(addErr))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-2"><button${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.90)" })}">`);
        if (unref(saving)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-3 w-3 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Plus), { class: "h-3 w-3" }, null, _parent));
        }
        _push(` Add </button><button class="rounded-xl px-4 py-2 text-[12px] transition-colors cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.08)", "color": "rgba(255,255,255,0.35)" })}">Cancel</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-14 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(feeds).length) {
        _push(`<div class="rounded-xl px-5 py-14 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(Rss), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">No RSS feeds configured. Add one above.</p></div>`);
      } else {
        _push(`<div class="rounded-xl overflow-hidden" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}"><div class="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border-bottom": "1px solid rgba(255,255,255,0.06)", "color": "rgba(255,255,255,0.25)", "grid-template-columns": "1fr 160px 90px 60px 80px" })}"><span>Feed</span><span>Category</span><span>Added</span><span>Status</span><span></span></div><!--[-->`);
        ssrRenderList(unref(feeds), (feed) => {
          _push(`<div class="grid items-center px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.02]" style="${ssrRenderStyle({ "border-bottom": "1px solid rgba(255,255,255,0.04)", "grid-template-columns": "1fr 160px 90px 60px 80px" })}"><div class="min-w-0 pr-4"><p class="font-medium truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">${ssrInterpolate(feed.name)}</p><div class="flex items-center gap-1 mt-0.5">`);
          _push(ssrRenderComponent(unref(Globe), {
            class: "h-2.5 w-2.5 shrink-0",
            style: { "color": "rgba(255,255,255,0.20)" }
          }, null, _parent));
          _push(`<p class="text-[10px] truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.28)" })}">${ssrInterpolate(feed.url)}</p></div></div><span class="inline-flex w-max items-center rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.18)", "color": "rgba(167,139,250,0.75)" })}">${ssrInterpolate(feed.category)}</span><span style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">${ssrInterpolate(fmt(feed.created_at))}</span><button class="flex items-center gap-1 text-[11px] cursor-pointer">`);
          if (feed.enabled) {
            _push(ssrRenderComponent(unref(ToggleRight), {
              class: "h-4 w-4",
              style: { "color": "rgba(35,165,90,0.80)" }
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(ToggleLeft), {
              class: "h-4 w-4",
              style: { "color": "rgba(255,255,255,0.25)" }
            }, null, _parent));
          }
          _push(`</button><div class="flex items-center gap-2"><a${ssrRenderAttr("href", feed.url)} target="_blank" class="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}" title="Open feed">`);
          _push(ssrRenderComponent(unref(ExternalLink), { class: "h-3 w-3" }, null, _parent));
          _push(`</a><button class="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.45)" })}" title="Delete feed">`);
          _push(ssrRenderComponent(unref(Trash2), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(`</button></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(feeds).length) {
        _push(`<p class="mt-3 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}">${ssrInterpolate(unref(feeds).filter((f) => f.enabled).length)} of ${ssrInterpolate(unref(feeds).length)} feed(s) enabled. Use &quot;Sync Now&quot; to refresh cached articles. </p>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/news.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=news-JE_cJLtt.mjs.map
