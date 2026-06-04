import { defineComponent, ref, reactive, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { storeToRefs } from 'pinia';
import { Search, RefreshCw, UsersRound, Plus, Loader2, UserPlus, Check, X, Pencil, Trash2 } from 'lucide-vue-next';
import { u as useMarketingStore } from './marketing-DM5syF7f.mjs';
import { u as useHead } from './composables-BaTf4Ku9.mjs';
import './useApi-wCkPPjv2.mjs';
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
import '@vue/shared';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "audiences",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Distribution Lists" });
    const store = useMarketingStore();
    const { segments, contacts, activeRecipients, draftCampaigns, loading, error } = storeToRefs(store);
    const search = ref("");
    const contactSearch = ref("");
    const saveMessage = ref("");
    const savingSegment = ref(false);
    const savingContact = ref(false);
    const editingContactId = ref("");
    const savingContactEdit = ref(false);
    const newSegment = reactive({
      name: "",
      source: "",
      ownerTeam: "Marketing",
      status: "active"
    });
    const newContact = reactive({
      email: "",
      name: "",
      company: "",
      segmentId: "",
      status: "subscribed"
    });
    const editContact = reactive({
      email: "",
      name: "",
      company: "",
      segmentId: "",
      status: "subscribed"
    });
    const filteredSegments = computed(() => {
      const query = search.value.trim().toLowerCase();
      if (!query) return segments.value;
      return segments.value.filter(
        (segment) => segment.name.toLowerCase().includes(query) || segment.source.toLowerCase().includes(query) || segment.ownerTeam.toLowerCase().includes(query) || segment.status.toLowerCase().includes(query)
      );
    });
    const filteredContacts = computed(() => {
      const query = contactSearch.value.trim().toLowerCase();
      if (!query) return contacts.value;
      return contacts.value.filter((contact) => {
        const segmentName = contact.segment?.name ?? segments.value.find((segment) => segment.id === contact.segmentId)?.name ?? "";
        return [contact.email, contact.name, contact.company, contact.status, segmentName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      });
    });
    function contactCount(segmentId) {
      return contacts.value.filter((contact) => contact.segmentId === segmentId).length;
    }
    function contactListName(contact) {
      return contact.segment?.name ?? segments.value.find((segment) => segment.id === contact.segmentId)?.name ?? "No list";
    }
    function fmt(iso) {
      if (!iso) return "Not synced";
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "mx-auto max-w-7xl space-y-5" }, _attrs))}><div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-teal/65">Internal Recipients</p><h1 class="text-[26px] font-display font-black uppercase tracking-wide text-white/90">Distribution Lists</h1><p class="mt-1 text-[13px] text-white/42">Controlled contact groups for internal team comms.</p></div><div class="grid grid-cols-3 gap-2 md:min-w-[430px]"><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Contacts</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(activeRecipients).toLocaleString())}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Lists</p><p class="mt-1 text-lg font-semibold text-teal">${ssrInterpolate(unref(segments).length)}</p></div><div class="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"><p class="text-[10px] uppercase tracking-[0.12em] text-white/28">Drafts</p><p class="mt-1 text-lg font-semibold text-white/88">${ssrInterpolate(unref(draftCampaigns))}</p></div></div></div>`);
      if (unref(saveMessage)) {
        _push(`<div class="rounded-md border border-teal/20 bg-teal/10 px-4 py-2.5 text-[12px] text-teal/90">${ssrInterpolate(unref(saveMessage))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<div class="rounded-md border border-err/20 bg-err/10 px-4 py-2.5 text-[12px] text-err/85">${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid gap-5 lg:grid-cols-[1fr_340px]"><section class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]"><div class="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 md:flex-row md:items-center md:justify-between"><div class="relative w-full md:max-w-sm">`);
      _push(ssrRenderComponent(unref(Search), { class: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} placeholder="Search distribution lists" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"></div><button class="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-2 text-[11px] text-white/50 hover:bg-white/[0.05]">`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["h-3.5 w-3.5", unref(loading) ? "animate-spin" : ""]
      }, null, _parent));
      _push(` Refresh </button></div>`);
      if (unref(loading)) {
        _push(`<div class="space-y-2 p-4"><!--[-->`);
        ssrRenderList(4, (i) => {
          _push(`<div class="h-14 animate-pulse rounded-md bg-white/[0.04]"></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="overflow-x-auto"><div class="grid min-w-[760px] grid-cols-[1.5fr_1fr_100px_120px_120px] border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/28"><span>List</span><span>Owner</span><span>Contacts</span><span>Status</span><span>Updated</span></div><!--[-->`);
        ssrRenderList(unref(filteredSegments), (segment) => {
          _push(`<div class="grid min-w-[760px] grid-cols-[1.5fr_1fr_100px_120px_120px] items-center border-b border-white/[0.04] px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.025]"><div class="min-w-0"><p class="truncate font-medium text-white/82">${ssrInterpolate(segment.name)}</p><p class="mt-0.5 text-[11px] text-white/30">${ssrInterpolate(segment.source)}</p></div><span class="text-white/45">${ssrInterpolate(segment.ownerTeam)}</span><span class="font-medium text-white/76">${ssrInterpolate(contactCount(segment.id))}</span><span class="${ssrRenderClass([segment.status === "active" ? "border-teal/22 bg-teal/10 text-teal/85" : segment.status === "paused" ? "border-warn/22 bg-warn/10 text-warn/85" : "border-white/[0.10] bg-white/[0.05] text-white/45", "w-max rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"])}">${ssrInterpolate(segment.status)}</span><span class="text-white/30">${ssrInterpolate(fmt(segment.updatedAt))}</span></div>`);
        });
        _push(`<!--]--></div>`);
      }
      if (!unref(loading) && !unref(filteredSegments).length) {
        _push(`<div class="px-5 py-14 text-center">`);
        _push(ssrRenderComponent(unref(UsersRound), { class: "mx-auto mb-3 h-8 w-8 text-white/14" }, null, _parent));
        _push(`<p class="text-[12px] text-white/35">No distribution lists yet.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><aside class="space-y-5"><section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-4 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(Plus), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Add List</h2></div><form class="space-y-3"><input${ssrRenderAttr("value", unref(newSegment).name)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Ops release recipients"><input${ssrRenderAttr("value", unref(newSegment).source)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Manual import"><input${ssrRenderAttr("value", unref(newSegment).ownerTeam)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Owner team"><button class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60"${ssrIncludeBooleanAttr(unref(savingSegment)) ? " disabled" : ""}>`);
      if (unref(savingSegment)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Plus), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(` Create list </button></form></section><section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><div class="mb-4 flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(UserPlus), { class: "h-4 w-4 text-teal/80" }, null, _parent));
      _push(`<h2 class="text-[13px] font-semibold text-white/82">Add Contact</h2></div><form class="space-y-3"><input${ssrRenderAttr("value", unref(newContact).email)} type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="name@company.com"><input${ssrRenderAttr("value", unref(newContact).name)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Name"><input${ssrRenderAttr("value", unref(newContact).company)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Company or team"><select class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(newContact).segmentId) ? ssrLooseContain(unref(newContact).segmentId, "") : ssrLooseEqual(unref(newContact).segmentId, "")) ? " selected" : ""}>No list</option><!--[-->`);
      ssrRenderList(unref(segments), (segment) => {
        _push(`<option${ssrRenderAttr("value", segment.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(newContact).segmentId) ? ssrLooseContain(unref(newContact).segmentId, segment.id) : ssrLooseEqual(unref(newContact).segmentId, segment.id)) ? " selected" : ""}>${ssrInterpolate(segment.name)}</option>`);
      });
      _push(`<!--]--></select><button class="flex w-full items-center justify-center gap-2 rounded-md bg-teal px-3 py-2 text-[12px] font-bold text-base transition-colors hover:bg-teal/90 disabled:opacity-60"${ssrIncludeBooleanAttr(unref(savingContact)) ? " disabled" : ""}>`);
      if (unref(savingContact)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(UserPlus), { class: "h-3.5 w-3.5" }, null, _parent));
      }
      _push(` Add contact </button></form></section><section class="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><h2 class="mb-3 text-[13px] font-semibold text-white/82">Recent Contacts</h2><div class="space-y-2"><!--[-->`);
      ssrRenderList(unref(contacts).slice(0, 6), (contact) => {
        _push(`<div class="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-3 py-2"><div class="min-w-0"><p class="truncate text-[12px] font-medium text-white/78">${ssrInterpolate(contact.name || contact.email)}</p><p class="truncate text-[11px] text-white/32">${ssrInterpolate(contact.email)}</p></div><span class="shrink-0 rounded-md border border-teal/22 bg-teal/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal/85">${ssrInterpolate(contact.status)}</span></div>`);
      });
      _push(`<!--]--></div></section></aside></div><section class="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.025]"><div class="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 md:flex-row md:items-center md:justify-between"><div><h2 class="text-[13px] font-semibold text-white/82">Contacts</h2><p class="mt-0.5 text-[11px] text-white/34">Edit profile details, subscription state, and distribution list assignment.</p></div><div class="relative w-full md:max-w-sm">`);
      _push(ssrRenderComponent(unref(Search), { class: "pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(contactSearch))} placeholder="Search contacts" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-4 text-[13px] text-white outline-none transition-colors focus:border-teal/45"></div></div><div class="overflow-x-auto"><div class="grid min-w-[980px] grid-cols-[1.35fr_1fr_1.15fr_150px_120px] border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/28"><span>Contact</span><span>Company</span><span>Distribution List</span><span>Status</span><span class="text-right">Actions</span></div><!--[-->`);
      ssrRenderList(unref(filteredContacts), (contact) => {
        _push(`<div class="grid min-w-[980px] grid-cols-[1.35fr_1fr_1.15fr_150px_120px] items-center gap-3 border-b border-white/[0.04] px-4 py-3 text-[12px] transition-colors hover:bg-white/[0.025]">`);
        if (unref(editingContactId) === contact.id) {
          _push(`<!--[--><div class="space-y-2"><input${ssrRenderAttr("value", unref(editContact).email)} type="email" class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><input${ssrRenderAttr("value", unref(editContact).name)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Name"></div><input${ssrRenderAttr("value", unref(editContact).company)} class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45" placeholder="Company or team"><select class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(editContact).segmentId) ? ssrLooseContain(unref(editContact).segmentId, "") : ssrLooseEqual(unref(editContact).segmentId, "")) ? " selected" : ""}>No list</option><!--[-->`);
          ssrRenderList(unref(segments), (segment) => {
            _push(`<option${ssrRenderAttr("value", segment.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(editContact).segmentId) ? ssrLooseContain(unref(editContact).segmentId, segment.id) : ssrLooseEqual(unref(editContact).segmentId, segment.id)) ? " selected" : ""}>${ssrInterpolate(segment.name)}</option>`);
          });
          _push(`<!--]--></select><select class="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-teal/45"><option value="subscribed"${ssrIncludeBooleanAttr(Array.isArray(unref(editContact).status) ? ssrLooseContain(unref(editContact).status, "subscribed") : ssrLooseEqual(unref(editContact).status, "subscribed")) ? " selected" : ""}>Subscribed</option><option value="bounced"${ssrIncludeBooleanAttr(Array.isArray(unref(editContact).status) ? ssrLooseContain(unref(editContact).status, "bounced") : ssrLooseEqual(unref(editContact).status, "bounced")) ? " selected" : ""}>Bounced</option><option value="unsubscribed"${ssrIncludeBooleanAttr(Array.isArray(unref(editContact).status) ? ssrLooseContain(unref(editContact).status, "unsubscribed") : ssrLooseEqual(unref(editContact).status, "unsubscribed")) ? " selected" : ""}>Unsubscribed</option></select><div class="flex justify-end gap-2"><button class="flex h-8 w-8 items-center justify-center rounded-md border border-teal/25 bg-teal/10 text-teal hover:bg-teal/15 disabled:opacity-60"${ssrIncludeBooleanAttr(unref(savingContactEdit)) ? " disabled" : ""} title="Save contact">`);
          if (unref(savingContactEdit)) {
            _push(ssrRenderComponent(unref(Loader2), { class: "h-3.5 w-3.5 animate-spin" }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Check), { class: "h-3.5 w-3.5" }, null, _parent));
          }
          _push(`</button><button class="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-white/50 hover:bg-white/[0.05]" title="Cancel edit">`);
          _push(ssrRenderComponent(unref(X), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(`</button></div><!--]-->`);
        } else {
          _push(`<!--[--><div class="min-w-0"><p class="truncate font-medium text-white/82">${ssrInterpolate(contact.name || contact.email)}</p><p class="mt-0.5 truncate text-[11px] text-white/30">${ssrInterpolate(contact.email)}</p></div><span class="truncate text-white/45">${ssrInterpolate(contact.company || "No company")}</span><span class="truncate text-white/60">${ssrInterpolate(contactListName(contact))}</span><span class="${ssrRenderClass([contact.status === "subscribed" ? "border-teal/22 bg-teal/10 text-teal/85" : contact.status === "bounced" ? "border-warn/22 bg-warn/10 text-warn/85" : "border-white/[0.10] bg-white/[0.05] text-white/45", "w-max rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"])}">${ssrInterpolate(contact.status)}</span><div class="flex justify-end gap-2"><button class="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] text-white/55 hover:bg-white/[0.05]" title="Edit contact">`);
          _push(ssrRenderComponent(unref(Pencil), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(`</button><button class="flex h-8 w-8 items-center justify-center rounded-md border border-err/20 text-err/75 hover:bg-err/10" title="Remove contact">`);
          _push(ssrRenderComponent(unref(Trash2), { class: "h-3.5 w-3.5" }, null, _parent));
          _push(`</button></div><!--]-->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div>`);
      if (!unref(loading) && !unref(filteredContacts).length) {
        _push(`<div class="px-5 py-14 text-center">`);
        _push(ssrRenderComponent(unref(UserPlus), { class: "mx-auto mb-3 h-8 w-8 text-white/14" }, null, _parent));
        _push(`<p class="text-[12px] text-white/35">No contacts match this view.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/audiences.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=audiences-Cr-RTUoT.mjs.map
