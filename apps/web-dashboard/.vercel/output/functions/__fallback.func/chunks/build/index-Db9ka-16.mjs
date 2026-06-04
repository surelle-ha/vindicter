import { defineComponent, ref, computed, unref, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { GraduationCap, X, Award, Sparkles, CheckCircle2, Lock, BookOpen, ChevronRight } from 'lucide-vue-next';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
import { u as useAuth } from './useAuth-C_mOwM2c.mjs';
import { _ as _export_sfc, u as useRouter } from './server.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({ title: "Academy — Vindicter" });
    useAuth();
    useRouter();
    const curriculum = [
      {
        id: "intro",
        label: "Introduction",
        theme: "Getting Started",
        color: "text-teal-300",
        bg: "rgba(20,184,166,0.08)",
        border: "rgba(20,184,166,0.22)",
        lessons: [
          { id: "intro-1", title: "Course Orientation", description: "How Vindicter Academy works and what to expect." },
          { id: "intro-2", title: "AI Professor Setup", description: "Configure your AI model for interactive learning." },
          { id: "intro-3", title: "Terminal & Lab Basics", description: "Essential command-line foundations for security work." },
          { id: "intro-4", title: "Setting Your Goals", description: "Define what you want to achieve in this course." }
        ]
      },
      {
        id: "week1",
        label: "Week 1",
        theme: "Security Foundations",
        color: "text-indigo-300",
        bg: "rgba(99,102,241,0.08)",
        border: "rgba(99,102,241,0.22)",
        lessons: [
          { id: "w1-1", title: "CIA Triad & Threat Modelling", description: "Confidentiality, integrity, availability — the bedrock of security thinking." },
          { id: "w1-2", title: "Authentication & Access Control", description: "How identity verification and authorisation work under the hood." },
          { id: "w1-3", title: "Cryptography Basics", description: "Symmetric vs asymmetric encryption, hashing, TLS fundamentals." },
          { id: "w1-4", title: "Secure Software Development", description: "Integrating security into every phase of the SDLC." },
          { id: "w1-5", title: "OWASP Top 10 Overview", description: "The most critical web application security risks." },
          { id: "w1-6", title: "Network Security Fundamentals", description: "Firewalls, VPNs, DMZs, and network segmentation." },
          { id: "w1-7", title: "Security Policies & Compliance", description: "NIST, ISO 27001, SOC 2 — what they mean and why they matter." }
        ]
      },
      {
        id: "week2",
        label: "Week 2",
        theme: "Web App Security",
        color: "text-violet-300",
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.22)",
        lessons: [
          { id: "w2-1", title: "SQL Injection", description: "Exploiting and preventing the most prevalent web vulnerability." },
          { id: "w2-2", title: "Cross-Site Scripting (XSS)", description: "Reflected, stored, and DOM-based XSS attacks and defences." },
          { id: "w2-3", title: "CSRF & Clickjacking", description: "Cross-site request forgery and UI redressing attacks." },
          { id: "w2-4", title: "SSRF & Path Traversal", description: "Server-side request forgery and directory traversal exploitation." },
          { id: "w2-5", title: "Insecure Deserialization", description: "How malicious payloads exploit object deserialisation." },
          { id: "w2-6", title: "API Security", description: "REST, GraphQL, and gRPC attack surfaces and hardening." },
          { id: "w2-7", title: "Burp Suite Essentials", description: "Hands-on web application testing with Burp Suite Community." }
        ]
      },
      {
        id: "week3",
        label: "Week 3",
        theme: "Penetration Testing",
        color: "text-rose-300",
        bg: "rgba(244,63,94,0.08)",
        border: "rgba(244,63,94,0.22)",
        lessons: [
          { id: "w3-1", title: "Recon & OSINT", description: "Passive and active reconnaissance techniques." },
          { id: "w3-2", title: "Network Scanning with Nmap", description: "Host discovery, port scanning, and service fingerprinting." },
          { id: "w3-3", title: "Vulnerability Assessment", description: "Identifying, classifying, and prioritising vulnerabilities." },
          { id: "w3-4", title: "Exploitation Basics", description: "Understanding exploit development and Metasploit fundamentals." },
          { id: "w3-5", title: "Post-Exploitation", description: "Privilege escalation, lateral movement, and persistence." },
          { id: "w3-6", title: "Web App Pentesting Workflow", description: "End-to-end methodology for web application assessments." },
          { id: "w3-7", title: "Writing Pentest Reports", description: "Communicating findings professionally to technical and non-technical audiences." }
        ]
      },
      {
        id: "week4",
        label: "Week 4",
        theme: "Defensive Security",
        color: "text-emerald-300",
        bg: "rgba(52,211,153,0.08)",
        border: "rgba(52,211,153,0.22)",
        lessons: [
          { id: "w4-1", title: "Blue Team Fundamentals", description: "Detection, response, and the blue team mindset." },
          { id: "w4-2", title: "SIEM & Log Analysis", description: "Collecting, correlating, and alerting on security events." },
          { id: "w4-3", title: "Incident Response", description: "Preparation, identification, containment, eradication, and recovery." },
          { id: "w4-4", title: "Threat Intelligence", description: "Using threat feeds, IOCs, and TTPs to improve defences." },
          { id: "w4-5", title: "Hardening & Configuration", description: "System, network, and application hardening baselines." },
          { id: "w4-6", title: "Cloud Security Essentials", description: "AWS, GCP, Azure — shared responsibility and key controls." },
          { id: "w4-7", title: "Security in CI/CD", description: "Integrating security scanning and gates into DevSecOps pipelines." }
        ]
      }
    ];
    const progress = ref({});
    const loadingProgress = ref(true);
    const allLessons = computed(() => curriculum.flatMap((m) => m.lessons));
    const totalLessons = computed(() => allLessons.value.length);
    const completedCount = computed(() => Object.values(progress.value).filter((p) => p.completed_at).length);
    const progressPercent = computed(() => totalLessons.value ? Math.round(completedCount.value / totalLessons.value * 100) : 0);
    const allComplete = computed(() => !loadingProgress.value && completedCount.value >= totalLessons.value && totalLessons.value > 0);
    function isCompleted(id) {
      return !!progress.value[id]?.completed_at;
    }
    function isStarted(id) {
      return !!progress.value[id];
    }
    function isLocked(lesson, mod) {
      if (lesson.id === "intro-1") return false;
      if (lesson.prereqId) return !isCompleted(lesson.prereqId);
      const modIdx = curriculum.findIndex((m) => m.id === mod.id);
      const lessonIdx = mod.lessons.findIndex((l) => l.id === lesson.id);
      if (lessonIdx === 0 && modIdx > 0) {
        const prevMod = curriculum[modIdx - 1];
        const prevLastLesson = prevMod.lessons[prevMod.lessons.length - 1];
        return !isCompleted(prevLastLesson.id);
      }
      if (lessonIdx > 0) return !isCompleted(mod.lessons[lessonIdx - 1].id);
      return false;
    }
    const showOnboarding = ref(false);
    const learnerName = ref("");
    const learnerGoal = ref("");
    const learnerLevel = ref("");
    const GOALS = ["Become a penetration tester", "Defend systems & respond to incidents", "Learn security for development work", "Compete in CTF challenges", "General security knowledge"];
    const LEVELS = ["Complete beginner", "Some IT background", "Developer with no security background", "Security professional"];
    const showCertificate = ref(false);
    const completionDate = computed(() => {
      const dates = Object.values(progress.value).filter((p) => p.completed_at).map((p) => new Date(p.completed_at));
      if (!dates.length) return (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
      return latest.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    });
    const certName = computed(() => {
      if (typeof localStorage !== "undefined") return localStorage.getItem("academy:name") || "Security Graduate";
      return "Security Graduate";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showOnboarding)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center" data-v-d0debbf8><div class="absolute inset-0 backdrop-blur-sm" style="${ssrRenderStyle({ "background": "rgba(0,0,0,0.80)" })}" data-v-d0debbf8></div><div class="relative rounded-2xl p-7 w-full max-w-lg mx-4" style="${ssrRenderStyle({ "background": "rgba(14,15,20,0.99)", "border": "1px solid rgba(139,92,246,0.28)", "box-shadow": "0 40px 80px rgba(0,0,0,0.70)" })}" data-v-d0debbf8><div class="flex items-center gap-3 mb-2" data-v-d0debbf8><div class="size-10 rounded-xl flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.25)" })}" data-v-d0debbf8>`);
          _push2(ssrRenderComponent(unref(GraduationCap), {
            class: "size-5",
            style: { "color": "rgba(167,139,250,0.90)" }
          }, null, _parent));
          _push2(`</div><div data-v-d0debbf8><h2 class="text-[18px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}" data-v-d0debbf8>Welcome to Academy</h2><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-d0debbf8>Let&#39;s personalise your learning experience.</p></div></div><div class="h-px my-5" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}" data-v-d0debbf8></div><div class="space-y-5" data-v-d0debbf8><div data-v-d0debbf8><p class="text-[11px] font-semibold mb-2" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)" })}" data-v-d0debbf8>Your name <span style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}" data-v-d0debbf8>(for your certificate)</span></p><input${ssrRenderAttr("value", unref(learnerName))} placeholder="e.g. Alex Rivera" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-d0debbf8></div><div data-v-d0debbf8><p class="text-[11px] font-semibold mb-2" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)" })}" data-v-d0debbf8>Your primary goal</p><div class="grid grid-cols-1 gap-1.5" data-v-d0debbf8><!--[-->`);
          ssrRenderList(GOALS, (g) => {
            _push2(`<button class="rounded-lg px-3 py-2 text-left text-[12px] transition-all cursor-pointer" style="${ssrRenderStyle(unref(learnerGoal) === g ? "background:rgba(139,92,246,0.14);border:1px solid rgba(139,92,246,0.30);color:rgba(167,139,250,0.95);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.50);")}" data-v-d0debbf8>${ssrInterpolate(g)}</button>`);
          });
          _push2(`<!--]--></div></div><div data-v-d0debbf8><p class="text-[11px] font-semibold mb-2" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)" })}" data-v-d0debbf8>Your experience level</p><div class="grid grid-cols-2 gap-1.5" data-v-d0debbf8><!--[-->`);
          ssrRenderList(LEVELS, (l) => {
            _push2(`<button class="rounded-lg px-3 py-2 text-left text-[12px] transition-all cursor-pointer" style="${ssrRenderStyle(unref(learnerLevel) === l ? "background:rgba(99,102,241,0.14);border:1px solid rgba(99,102,241,0.30);color:rgba(165,180,252,0.95);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.50);")}" data-v-d0debbf8>${ssrInterpolate(l)}</button>`);
          });
          _push2(`<!--]--></div></div></div><button class="mt-6 w-full rounded-xl py-3 text-[13px] font-semibold cursor-pointer transition-all hover:opacity-90" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.20)", "border": "1px solid rgba(139,92,246,0.35)", "color": "rgba(167,139,250,0.95)" })}" data-v-d0debbf8> Start Learning </button><button class="mt-2 w-full rounded-xl py-2 text-[11px] cursor-pointer transition-colors hover:bg-white/[0.04]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}" data-v-d0debbf8>Skip for now</button></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showCertificate)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-d0debbf8><div class="absolute inset-0 backdrop-blur-sm" style="${ssrRenderStyle({ "background": "rgba(0,0,0,0.85)" })}" data-v-d0debbf8></div><div class="relative rounded-2xl overflow-hidden w-full max-w-lg" style="${ssrRenderStyle({ "background": "#0e0f14", "border": "1.5px solid rgba(139,92,246,0.35)", "box-shadow": "0 0 80px rgba(139,92,246,0.20)" })}" data-v-d0debbf8><button class="absolute top-4 right-4 z-10 size-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-white/[0.08]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-d0debbf8>`);
          _push2(ssrRenderComponent(unref(X), { class: "size-4" }, null, _parent));
          _push2(`</button><div class="p-10 text-center relative overflow-hidden" data-v-d0debbf8><div class="absolute inset-0 pointer-events-none" style="${ssrRenderStyle({ "background": "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)" })}" data-v-d0debbf8></div><div class="relative" data-v-d0debbf8><div class="size-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1.5px solid rgba(139,92,246,0.35)" })}" data-v-d0debbf8>`);
          _push2(ssrRenderComponent(unref(Award), {
            class: "size-8",
            style: { "color": "rgba(167,139,250,0.90)" }
          }, null, _parent));
          _push2(`</div><p class="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style="${ssrRenderStyle({ "color": "rgba(139,92,246,0.60)" })}" data-v-d0debbf8>Certificate of Completion</p><p class="text-[13px] mb-3" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.45)" })}" data-v-d0debbf8>This certifies that</p><h2 class="text-[28px] font-display font-black mb-3" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.95)" })}" data-v-d0debbf8>${ssrInterpolate(unref(certName))}</h2><p class="text-[13px] leading-relaxed mb-4" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.50)" })}" data-v-d0debbf8>has successfully completed the<br data-v-d0debbf8><strong style="${ssrRenderStyle({ "color": "rgba(167,139,250,0.85)" })}" data-v-d0debbf8>Vindicter Academy Security Bootcamp</strong><br data-v-d0debbf8>covering all ${ssrInterpolate(unref(totalLessons))} lessons across 5 modules.</p><div class="h-px my-5" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}" data-v-d0debbf8></div><div class="flex items-center justify-center gap-6 text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-d0debbf8><div class="text-center" data-v-d0debbf8><p class="font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.55)" })}" data-v-d0debbf8>Completed</p><p data-v-d0debbf8>${ssrInterpolate(unref(completionDate))}</p></div><div class="w-px h-8" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.08)" })}" data-v-d0debbf8></div><div class="text-center" data-v-d0debbf8><p class="font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.55)" })}" data-v-d0debbf8>Lessons</p><p data-v-d0debbf8>${ssrInterpolate(unref(totalLessons))} / ${ssrInterpolate(unref(totalLessons))}</p></div><div class="w-px h-8" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.08)" })}" data-v-d0debbf8></div><div class="text-center" data-v-d0debbf8><p class="font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.55)" })}" data-v-d0debbf8>Issued by</p><p data-v-d0debbf8>Vindicter</p></div></div></div></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`<div class="max-w-5xl mx-auto" data-v-d0debbf8>`);
      if (unref(allComplete)) {
        _push(`<div class="mb-6 rounded-xl p-5 flex items-center justify-between gap-4" style="${ssrRenderStyle({ "background": "linear-gradient(135deg,rgba(139,92,246,0.10) 0%,rgba(99,102,241,0.06) 100%)", "border": "1px solid rgba(139,92,246,0.25)" })}" data-v-d0debbf8><div class="flex items-center gap-3" data-v-d0debbf8><div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)" })}" data-v-d0debbf8>`);
        _push(ssrRenderComponent(unref(Award), {
          class: "size-5",
          style: { "color": "rgba(167,139,250,0.90)" }
        }, null, _parent));
        _push(`</div><div data-v-d0debbf8><p class="text-[13px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}" data-v-d0debbf8>Bootcamp Complete!</p><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}" data-v-d0debbf8>You&#39;ve completed all ${ssrInterpolate(unref(totalLessons))} lessons. Your certificate is ready.</p></div></div><button class="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold cursor-pointer transition-all hover:scale-[1.02] shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.20)", "border": "1px solid rgba(139,92,246,0.32)", "color": "rgba(167,139,250,0.95)" })}" data-v-d0debbf8>`);
        _push(ssrRenderComponent(unref(Sparkles), { class: "size-3.5" }, null, _parent));
        _push(` View Certificate </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-v-d0debbf8><div class="flex items-center gap-3" data-v-d0debbf8><div class="h-9 w-9 flex items-center justify-center rounded-xl shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.10)", "border": "1px solid rgba(139,92,246,0.20)" })}" data-v-d0debbf8>`);
      _push(ssrRenderComponent(unref(GraduationCap), {
        class: "h-4 w-4",
        style: { "color": "rgba(139,92,246,0.80)" }
      }, null, _parent));
      _push(`</div><div data-v-d0debbf8><h1 class="text-[22px] font-display font-black uppercase tracking-wide" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}" data-v-d0debbf8>Academy</h1><p class="text-[12px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-d0debbf8>AI-guided security bootcamp · ${ssrInterpolate(unref(completedCount))} / ${ssrInterpolate(unref(totalLessons))} lessons complete.</p></div></div><div class="flex items-center gap-3 shrink-0" data-v-d0debbf8><div class="w-40 h-1.5 rounded-full overflow-hidden" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.08)" })}" data-v-d0debbf8><div class="h-full rounded-full transition-all duration-700" style="${ssrRenderStyle([{ "background": "rgba(139,92,246,0.75)" }, { width: unref(progressPercent) + "%" }])}" data-v-d0debbf8></div></div><span class="text-[12px] font-semibold tabular-nums" style="${ssrRenderStyle({ "color": "rgba(167,139,250,0.80)" })}" data-v-d0debbf8>${ssrInterpolate(unref(progressPercent))}%</span></div></div>`);
      if (unref(loadingProgress)) {
        _push(`<div class="space-y-4" data-v-d0debbf8><!--[-->`);
        ssrRenderList(3, (i) => {
          _push(`<div class="h-32 rounded-xl animate-pulse" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.03)" })}" data-v-d0debbf8></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="space-y-6" data-v-d0debbf8><!--[-->`);
        ssrRenderList(curriculum, (mod) => {
          _push(`<div data-v-d0debbf8><div class="flex items-center gap-3 mb-3" data-v-d0debbf8><span class="${ssrRenderClass([mod.color, "text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border"])}" style="${ssrRenderStyle({ borderColor: mod.border, background: mod.bg })}" data-v-d0debbf8>${ssrInterpolate(mod.label)}</span><h2 class="text-[14px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}" data-v-d0debbf8>${ssrInterpolate(mod.theme)}</h2><div class="flex-1 h-px" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.06)" })}" data-v-d0debbf8></div><span class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}" data-v-d0debbf8>${ssrInterpolate(mod.lessons.filter((l) => isCompleted(l.id)).length)} / ${ssrInterpolate(mod.lessons.length)}</span></div><div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-v-d0debbf8><!--[-->`);
          ssrRenderList(mod.lessons, (lesson) => {
            _push(`<button class="${ssrRenderClass([isLocked(lesson, mod) ? "opacity-45 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5", "text-left rounded-xl p-4 transition-all group"])}" style="${ssrRenderStyle(isCompleted(lesson.id) ? `background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.20);` : isStarted(lesson.id) ? "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);" : "background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);")}" data-v-d0debbf8><div class="flex items-start justify-between gap-2 mb-2" data-v-d0debbf8>`);
            if (isCompleted(lesson.id)) {
              _push(ssrRenderComponent(unref(CheckCircle2), {
                class: "size-4 shrink-0 mt-0.5",
                style: { "color": "rgba(167,139,250,0.80)" }
              }, null, _parent));
            } else if (isStarted(lesson.id)) {
              _push(`<div class="size-4 shrink-0 mt-0.5 rounded-full border-2" style="${ssrRenderStyle({ "border-color": "rgba(255,255,255,0.25)" })}" data-v-d0debbf8></div>`);
            } else if (isLocked(lesson, mod)) {
              _push(ssrRenderComponent(unref(Lock), {
                class: "size-4 shrink-0 mt-0.5",
                style: { "color": "rgba(255,255,255,0.20)" }
              }, null, _parent));
            } else {
              _push(ssrRenderComponent(unref(BookOpen), {
                class: "size-4 shrink-0 mt-0.5",
                style: { "color": "rgba(255,255,255,0.30)" }
              }, null, _parent));
            }
            if (!isLocked(lesson, mod)) {
              _push(ssrRenderComponent(unref(ChevronRight), {
                class: "size-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity",
                style: { "color": "rgba(255,255,255,0.50)" }
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`</div><p class="text-[12px] font-semibold leading-snug" style="${ssrRenderStyle(isCompleted(lesson.id) ? "color:rgba(167,139,250,0.90);" : "color:rgba(255,255,255,0.75);")}" data-v-d0debbf8>${ssrInterpolate(lesson.title)}</p>`);
            if (lesson.description) {
              _push(`<p class="mt-1 text-[10px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-d0debbf8>${ssrInterpolate(lesson.description)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</button>`);
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/academy/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d0debbf8"]]);

export { index as default };
//# sourceMappingURL=index-Db9ka-16.mjs.map
