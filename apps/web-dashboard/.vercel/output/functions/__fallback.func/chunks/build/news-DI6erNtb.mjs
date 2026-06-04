import { _ as __nuxt_component_0 } from './client-only-DoYs5VEQ.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrIncludeBooleanAttr, ssrRenderList, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { Rss, RefreshCw, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
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

const PAGE_SIZE = 12;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "news",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "News — Vindicter" });
    const articles = ref([]);
    const loading = ref(true);
    const refreshing = ref(false);
    const activeCategory = ref("all");
    const currentPage = ref(1);
    const feeds = ref([]);
    const categories = computed(() => {
      const cats = new Set(feeds.value.map((f) => f.category));
      return ["all", ...cats];
    });
    const filtered = computed(() => {
      if (activeCategory.value === "all") return articles.value;
      const names = feeds.value.filter((f) => f.category === activeCategory.value).map((f) => f.name);
      return articles.value.filter((a) => names.includes(a.feed_name));
    });
    const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
    const paginated = computed(() => {
      const start = (currentPage.value - 1) * PAGE_SIZE;
      return filtered.value.slice(start, start + PAGE_SIZE);
    });
    watch(activeCategory, () => {
      currentPage.value = 1;
    });
    watch(filtered, () => {
      currentPage.value = 1;
    });
    function fmt(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
      if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    function categoryColor(cat) {
      const map = {
        attacks: "rgba(248,113,113,0.70)",
        reports: "rgba(139,92,246,0.70)",
        articles: "rgba(99,102,241,0.70)"
      };
      return map[cat.toLowerCase()] ?? "rgba(139,92,246,0.70)";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "-m-5" }, _attrs))}><div class="relative h-40 overflow-hidden">`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`<div class="absolute inset-0" style="${ssrRenderStyle({ "background": "linear-gradient(to bottom, rgba(17,18,21,0.15) 0%, rgba(17,18,21,0.80) 100%)" })}"></div><div class="absolute inset-0 flex flex-col justify-end px-6 pb-5"><div class="flex items-end justify-between gap-4"><div class="flex items-center gap-3"><div class="h-8 w-8 flex items-center justify-center rounded-lg shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.25)", "border": "1px solid rgba(139,92,246,0.40)", "backdrop-filter": "blur(8px)" })}">`);
      _push(ssrRenderComponent(unref(Rss), {
        class: "h-4 w-4",
        style: { "color": "rgba(167,139,250,0.95)" }
      }, null, _parent));
      _push(`</div><div><h1 class="text-[22px] font-display font-black uppercase tracking-wide leading-none" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.95)" })}">Security News</h1><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)" })}">Latest from trusted security sources.</p></div></div><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition-colors cursor-pointer shrink-0" style="${ssrRenderStyle({ "background": "rgba(17,18,21,0.60)", "border": "1px solid rgba(255,255,255,0.12)", "color": "rgba(255,255,255,0.55)", "backdrop-filter": "blur(8px)" })}"${ssrIncludeBooleanAttr(unref(refreshing)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3 w-3", unref(refreshing) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button></div></div></div><div class="p-5">`);
      if (unref(categories).length > 1) {
        _push(`<div class="flex items-center gap-2 mb-6 flex-wrap"><!--[-->`);
        ssrRenderList(unref(categories), (cat) => {
          _push(`<button class="px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors cursor-pointer" style="${ssrRenderStyle(unref(activeCategory) === cat ? "background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);" : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);")}">${ssrInterpolate(cat)}</button>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
        ssrRenderList(9, (i) => {
          _push(`<div class="rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "height": "240px" })}"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (!unref(filtered).length) {
        _push(`<div class="rounded-xl px-5 py-16 text-center" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.06)" })}">`);
        _push(ssrRenderComponent(unref(Rss), {
          class: "h-8 w-8 mx-auto mb-3",
          style: { "color": "rgba(255,255,255,0.12)" }
        }, null, _parent));
        _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}">No articles yet. An admin can sync RSS feeds from News Management.</p></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
        ssrRenderList(unref(paginated), (article) => {
          _push(`<a${ssrRenderAttr("href", article.link)} target="_blank" rel="noopener noreferrer" class="group flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xl" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.025)", "border": "1px solid rgba(255,255,255,0.08)" })}">`);
          if (article.image_url) {
            _push(`<div class="aspect-video overflow-hidden shrink-0"><img${ssrRenderAttr("src", article.image_url)}${ssrRenderAttr("alt", article.title)} class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy"></div>`);
          } else {
            _push(`<div class="aspect-video shrink-0 flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.04)", "border-bottom": "1px solid rgba(255,255,255,0.05)" })}">`);
            _push(ssrRenderComponent(unref(Rss), {
              class: "h-6 w-6",
              style: { "color": "rgba(139,92,246,0.20)" }
            }, null, _parent));
            _push(`</div>`);
          }
          _push(`<div class="flex flex-col flex-1 p-4 gap-2"><div class="flex items-center justify-between gap-2"><span class="text-[10px] font-bold uppercase tracking-wide truncate" style="${ssrRenderStyle(`color:${categoryColor(article.feed_name)};`)}">${ssrInterpolate(article.feed_name)}</span><span class="text-[10px] shrink-0" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}">${ssrInterpolate(fmt(article.published_at))}</span></div><div class="flex items-start justify-between gap-1.5"><h3 class="text-[13px] font-semibold leading-snug flex-1 transition-colors group-hover:text-white" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.82)" })}">${ssrInterpolate(article.title)}</h3>`);
          _push(ssrRenderComponent(unref(ExternalLink), {
            class: "h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity",
            style: { "color": "rgba(255,255,255,0.60)" }
          }, null, _parent));
          _push(`</div>`);
          if (article.summary) {
            _push(`<p class="text-[11px] leading-relaxed line-clamp-3 flex-1" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">${ssrInterpolate(article.summary)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></a>`);
        });
        _push(`<!--]--></div>`);
      }
      if (unref(totalPages) > 1) {
        _push(`<div class="flex items-center justify-center gap-3 mt-8"><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.09)", "color": "rgba(255,255,255,0.50)" })}"${ssrIncludeBooleanAttr(unref(currentPage) === 1) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(unref(ChevronLeft), { class: "h-3.5 w-3.5" }, null, _parent));
        _push(` Previous </button><div class="flex items-center gap-1.5"><!--[-->`);
        ssrRenderList(unref(totalPages), (p) => {
          _push(`<button class="size-7 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-colors cursor-pointer" style="${ssrRenderStyle(p === unref(currentPage) ? "background:rgba(139,92,246,0.20);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);" : "border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.30);")}">${ssrInterpolate(p)}</button>`);
        });
        _push(`<!--]--></div><button class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.09)", "color": "rgba(255,255,255,0.50)" })}"${ssrIncludeBooleanAttr(unref(currentPage) === unref(totalPages)) ? " disabled" : ""}> Next `);
        _push(ssrRenderComponent(unref(ChevronRight), { class: "h-3.5 w-3.5" }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(filtered).length) {
        _push(`<p class="mt-4 text-center text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.18)" })}">${ssrInterpolate(unref(filtered).length)} article${ssrInterpolate(unref(filtered).length !== 1 ? "s" : "")} · page ${ssrInterpolate(unref(currentPage))} of ${ssrInterpolate(unref(totalPages))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/news.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=news-DI6erNtb.mjs.map
