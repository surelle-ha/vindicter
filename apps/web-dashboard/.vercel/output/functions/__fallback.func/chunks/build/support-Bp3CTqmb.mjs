import { _ as __nuxt_component_0 } from './nuxt-link-DtqAJy6p.mjs';
import { defineComponent, computed, ref, reactive, mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { LifeBuoy, HelpCircle, BookOpen, CheckCircle2, Mail, Loader2, Send } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
import { u as useAuth } from './useAuth-C_mOwM2c.mjs';
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
  __name: "support",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Support — Vindicter" });
    useAuth();
    const landingUrl = computed(() => {
      return "https://vindicter.xyz";
    });
    const step = ref("check");
    const loading = ref(false);
    const apiErr = ref("");
    const doneEmail = ref("");
    const form = reactive({
      name: "",
      email: "",
      category: "setup",
      subject: "",
      message: "",
      docsChecked: false,
      faqChecked: false
    });
    const errors = reactive({ name: "", email: "", subject: "", message: "", checks: "" });
    const categories = [
      { value: "setup", label: "Setup or install" },
      { value: "scan", label: "Scanning or findings" },
      { value: "billing", label: "Beta or account" },
      { value: "bug", label: "Bug report" },
      { value: "other", label: "Something else" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-2xl mx-auto" }, _attrs))}><div class="mb-8 flex items-center gap-3"><div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.20)" })}">`);
      _push(ssrRenderComponent(unref(LifeBuoy), {
        class: "h-4 w-4",
        style: { "color": "rgba(139,92,246,0.80)" }
      }, null, _parent));
      _push(`</div><div><h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Support</h1><p class="text-[12px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}">Get help with Vindicter.</p></div></div>`);
      if (unref(step) === "check") {
        _push(`<div class="rounded-xl p-6 space-y-5" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.07)" })}"><div class="flex items-start gap-3"><div class="h-8 w-8 flex items-center justify-center rounded-lg shrink-0" style="${ssrRenderStyle({ "background": "rgba(245,158,11,0.08)", "border": "1px solid rgba(245,158,11,0.18)" })}">`);
        _push(ssrRenderComponent(unref(HelpCircle), {
          class: "h-4 w-4",
          style: { "color": "rgba(245,158,11,0.75)" }
        }, null, _parent));
        _push(`</div><div><p class="text-[14px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}">Have you checked the docs and FAQ?</p><p class="mt-1 text-[12px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}"> Many common questions about setup, scanning, and beta access are already answered. </p></div></div><div class="grid gap-3 sm:grid-cols-2"><a${ssrRenderAttr("href", `${unref(landingUrl)}/docs`)} target="_blank" class="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.04] cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}">`);
        _push(ssrRenderComponent(unref(BookOpen), {
          class: "h-4 w-4 shrink-0",
          style: { "color": "rgba(139,92,246,0.70)" }
        }, null, _parent));
        _push(`<div><p class="text-[12px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">Documentation</p><p class="text-[10px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Install, configure, scan and triage</p></div></a><a${ssrRenderAttr("href", `${unref(landingUrl)}/faq`)} target="_blank" class="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.04] cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)" })}">`);
        _push(ssrRenderComponent(unref(HelpCircle), {
          class: "h-4 w-4 shrink-0",
          style: { "color": "rgba(139,92,246,0.70)" }
        }, null, _parent));
        _push(`<div><p class="text-[12px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">FAQ</p><p class="text-[10px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Common beta and product questions</p></div></a></div><div class="flex flex-col gap-2 sm:flex-row pt-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold transition-colors",
          style: { "background": "rgba(35,165,90,0.06)", "border": "1px solid rgba(35,165,90,0.18)", "color": "rgba(35,165,90,0.85)" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(CheckCircle2), { class: "h-4 w-4" }, null, _parent2, _scopeId));
              _push2(` Found my answer `);
            } else {
              return [
                createVNode(unref(CheckCircle2), { class: "h-4 w-4" }),
                createTextVNode(" Found my answer ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<button class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold transition-colors cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.14)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.92)" })}">`);
        _push(ssrRenderComponent(unref(Mail), { class: "h-4 w-4" }, null, _parent));
        _push(` Still need help </button></div></div>`);
      } else if (unref(step) === "form") {
        _push(`<div class="rounded-xl p-6 space-y-5" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.07)" })}"><div><p class="text-[13px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.80)" })}">Support request</p><p class="mt-0.5 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">The admin team will review your request.</p></div><div class="grid gap-4 sm:grid-cols-2"><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Name</label><input${ssrRenderAttr("value", unref(form).name)}${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} placeholder="Jane Smith" class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}">`);
        if (unref(errors).name) {
          _push(`<p class="mt-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(errors).name)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Email</label><input${ssrRenderAttr("value", unref(form).email)} type="email"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} placeholder="you@example.com" class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}">`);
        if (unref(errors).email) {
          _push(`<p class="mt-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(errors).email)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid gap-4 sm:grid-cols-[180px_1fr]"><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Category</label><select${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none disabled:opacity-50 cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(30,31,34,0.95)", "border": "1px solid rgba(255,255,255,0.09)" })}"><!--[-->`);
        ssrRenderList(categories, (cat) => {
          _push(`<option${ssrRenderAttr("value", cat.value)}${ssrIncludeBooleanAttr(Array.isArray(unref(form).category) ? ssrLooseContain(unref(form).category, cat.value) : ssrLooseEqual(unref(form).category, cat.value)) ? " selected" : ""}>${ssrInterpolate(cat.label)}</option>`);
        });
        _push(`<!--]--></select></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Subject</label><input${ssrRenderAttr("value", unref(form).subject)}${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} placeholder="Short summary" class="w-full rounded-xl px-3.5 py-2.5 text-[12px] text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}">`);
        if (unref(errors).subject) {
          _push(`<p class="mt-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(errors).subject)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div><label class="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}">Message</label><textarea rows="6"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} placeholder="What happened? What did you expect? Which version or platform?" class="w-full resize-y rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed text-white outline-none transition-colors focus:border-indigo-500/40 disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}">${ssrInterpolate(unref(form).message)}</textarea>`);
        if (unref(errors).message) {
          _push(`<p class="mt-1 text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(errors).message)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="rounded-xl p-4 space-y-3" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.02)", "border": "1px solid rgba(255,255,255,0.07)" })}"><label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).docsChecked) ? ssrLooseContain(unref(form).docsChecked, null) : unref(form).docsChecked) ? " checked" : ""} type="checkbox" class="mt-0.5 accent-[#8b5cf6]"> I checked the documentation and it did not answer this question. </label><label class="flex items-start gap-3 text-[12px] leading-relaxed text-white/50 cursor-pointer"><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).faqChecked) ? ssrLooseContain(unref(form).faqChecked, null) : unref(form).faqChecked) ? " checked" : ""} type="checkbox" class="mt-0.5 accent-[#8b5cf6]"> I checked the FAQ and still need support. </label>`);
        if (unref(errors).checks) {
          _push(`<p class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(errors).checks)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(apiErr)) {
          _push(`<p class="text-[12px]" style="${ssrRenderStyle({ "color": "rgba(242,63,66,0.80)" })}">${ssrInterpolate(unref(apiErr))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-3 flex-col sm:flex-row"><button${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.14)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.92)" })}">`);
        if (unref(loading)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "h-4 w-4 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Send), { class: "h-4 w-4" }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(loading) ? "Sending…" : "Send request")}</button><button${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="flex items-center justify-center rounded-xl px-5 py-3 text-[12px] font-semibold transition-colors disabled:opacity-50 cursor-pointer" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.08)", "color": "rgba(255,255,255,0.40)" })}">Back</button></div></div>`);
      } else {
        _push(`<div class="rounded-xl p-8 text-center" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.04)", "border": "1px solid rgba(35,165,90,0.18)" })}"><div class="mx-auto mb-4 h-14 w-14 flex items-center justify-center rounded-2xl" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.08)", "border": "1px solid rgba(35,165,90,0.20)" })}">`);
        _push(ssrRenderComponent(unref(CheckCircle2), {
          class: "h-7 w-7",
          style: { "color": "rgba(35,165,90,0.85)" }
        }, null, _parent));
        _push(`</div><h2 class="font-display text-[24px] font-black uppercase" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}">Request received</h2><p class="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.45)" })}"> Your support request was saved. The admin team will review it and any reply will go to ${ssrInterpolate(unref(doneEmail))}. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "mt-6 inline-block text-[11px] transition-colors hover:text-white/60",
          style: { "color": "rgba(255,255,255,0.30)" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Back to home`);
            } else {
              return [
                createTextVNode("Back to home")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/support.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=support-Bp3CTqmb.mjs.map
