import { _ as __nuxt_component_0 } from './client-only-DoYs5VEQ.mjs';
import { defineComponent, computed, ref, watch, unref, nextTick, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrRenderStyle, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { GraduationCap, ArrowLeft, CheckCircle2, Terminal, RotateCcw, Settings, X, Loader2, Send, Target, ChevronLeft } from 'lucide-vue-next';
import { _ as _export_sfc, a as useRoute, u as useRouter } from './server.mjs';
import { u as useAuth, a as useSupabase } from './useAuth-C_mOwM2c.mjs';
import { u as useHead } from './composables-CSmZ4bjm.mjs';
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

const DAEMON_PORT = 7476;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[lessonId]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const supabase = useSupabase();
    const { user } = useAuth();
    const lessonId = computed(() => route.params.lessonId);
    const ALL_LESSONS = [
      {
        id: "intro-1",
        title: "Course Orientation",
        moduleLabel: "Introduction",
        color: "text-teal-300",
        border: "rgba(20,184,166,0.30)",
        bg: "rgba(20,184,166,0.08)",
        objectives: ["Understand the course structure and progression", "Learn how the AI Professor gates your advancement", "Set up your learning environment"],
        content: `## Welcome to Vindicter Academy

This course is a structured, AI-guided security bootcamp. Unlike passive video courses, **your professor unlocks each lesson only when you demonstrate genuine understanding** — not just clicking next.

### How it works

- The Professor introduces each concept clearly
- Quiz questions check real comprehension
- Only when you answer correctly does the lesson unlock
- A WSL sandbox (if the desktop bridge is running) lets you try live commands

### What you'll build

By the end of this course you'll be able to perform basic recon, identify common web vulnerabilities, understand defensive strategies, and write a security assessment report.`
      },
      {
        id: "intro-2",
        title: "AI Professor Setup",
        moduleLabel: "Introduction",
        color: "text-teal-300",
        border: "rgba(20,184,166,0.30)",
        bg: "rgba(20,184,166,0.08)",
        objectives: ["Configure OpenRouter or Ollama as your AI model", "Understand what the Professor can and cannot do", "Verify your connection before starting the curriculum"],
        content: `## Configuring your AI Professor

The Professor is powered by any OpenAI-compatible model. Two options:

### OpenRouter
Connect any cloud model (GPT-4o, Claude 3.5, Mistral, etc.) using an [OpenRouter](https://openrouter.ai) API key. Best for quality and reliability.

### Ollama
Run a local model entirely on your machine — no API key needed. Requires Ollama installed and running at \`http://localhost:11434\`.

### Tips
- GPT-4o-mini via OpenRouter is fast and affordable for learning
- Ollama with \`llama3\` works well but is slower
- The Professor will tell you when your connection is failing`
      },
      {
        id: "intro-3",
        title: "Terminal & Lab Basics",
        moduleLabel: "Introduction",
        color: "text-teal-300",
        border: "rgba(20,184,166,0.30)",
        bg: "rgba(20,184,166,0.08)",
        objectives: ["Navigate the Linux filesystem confidently", "Understand file permissions and how to change them", "Use pipes, redirection, and grep effectively"],
        content: `## Linux Terminal Fundamentals

### Navigation
\`\`\`bash
pwd          # where am I?
ls -la       # list all files with permissions
cd /etc      # change directory
\`\`\`

### File permissions
\`\`\`bash
chmod 600 ~/.ssh/id_rsa     # owner read/write only
chown user:group file.txt   # change owner
\`\`\`

### Pipes and redirection
\`\`\`bash
cat /etc/passwd | grep root     # pipe output to grep
nmap -sV 10.0.0.1 > scan.txt   # redirect to file
\`\`\`

The WSL sandbox lets you run these commands safely.`
      },
      {
        id: "intro-4",
        title: "Setting Your Goals",
        moduleLabel: "Introduction",
        color: "text-teal-300",
        border: "rgba(20,184,166,0.30)",
        bg: "rgba(20,184,166,0.08)",
        objectives: ["Articulate your security learning goal", "Identify your current experience level", "Choose the study pace that works for you"],
        content: `## Defining your learning path

This lesson is a reflection and goal-setting session. The Professor will ask about:

- **Your background** — developer, sysadmin, student, or complete beginner
- **Your goal** — CTF competitor, career change, defensive monitoring, or general knowledge
- **Your pace** — intensive daily study vs. casual weekend learning

Being honest helps the Professor tailor explanations to your level and not waste time on concepts you already know.`
      },
      {
        id: "w1-1",
        title: "CIA Triad & Threat Modelling",
        moduleLabel: "Week 1 — Security Foundations",
        color: "text-indigo-300",
        border: "rgba(99,102,241,0.30)",
        bg: "rgba(99,102,241,0.08)",
        objectives: ["Define Confidentiality, Integrity, and Availability", "Apply the CIA triad to real-world scenarios", "Build a basic threat model for a simple application"],
        content: `## The CIA Triad

Every security decision maps back to three properties:

| Property | Definition | Example attack |
|---|---|---|
| **Confidentiality** | Data only seen by authorised parties | Data breach, eavesdropping |
| **Integrity** | Data only modified by authorised parties | SQL injection, man-in-the-middle |
| **Availability** | Systems accessible when needed | DDoS, ransomware |

### Threat Modelling

Threat modelling answers: *what could go wrong?*

1. **Identify assets** — what are you protecting?
2. **Identify threats** — who wants to attack it and how?
3. **Identify controls** — what defences do you have?
4. **Prioritise** — focus on highest-impact threats first`
      },
      {
        id: "w2-1",
        title: "SQL Injection",
        moduleLabel: "Week 2 — Web App Security",
        color: "text-violet-300",
        border: "rgba(139,92,246,0.30)",
        bg: "rgba(139,92,246,0.08)",
        objectives: ["Explain how SQL injection works at a query level", "Identify SQL injection vulnerabilities in code", "Apply parameterised queries and input validation"],
        content: `## SQL Injection

SQL injection occurs when user input is concatenated directly into a SQL query.

### Vulnerable code
\`\`\`python
query = "SELECT * FROM users WHERE email = '" + email + "'"
\`\`\`

An attacker inputs: \`' OR '1'='1\`

Resulting query: \`SELECT * FROM users WHERE email = '' OR '1'='1'\`

### Safe code (parameterised)
\`\`\`python
cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
\`\`\`

### Types
- **In-band** — error-based, union-based
- **Blind** — boolean-based, time-based
- **Out-of-band** — DNS/HTTP exfiltration`
      }
    ];
    const lesson = computed(() => {
      const found = ALL_LESSONS.find((l) => l.id === lessonId.value);
      return found ?? {
        id: lessonId.value,
        title: `Lesson: ${lessonId.value}`,
        moduleLabel: "Academy",
        color: "text-indigo-300",
        border: "rgba(99,102,241,0.30)",
        bg: "rgba(99,102,241,0.08)",
        objectives: ["Complete the lesson objectives as guided by the Professor"],
        content: "Work through this lesson interactively with the AI Professor."
      };
    });
    const currentIdx = computed(() => ALL_LESSONS.findIndex((l) => l.id === lessonId.value));
    const prevLesson = computed(() => currentIdx.value > 0 ? ALL_LESSONS[currentIdx.value - 1] : null);
    useHead({ title: computed(() => `${lesson.value.title} — Academy`) });
    const selectedModel = ref("openrouter");
    const openrouterKey = ref("");
    const openrouterModel = ref("openai/gpt-4o-mini");
    const ollamaUrl = ref("http://localhost:11434");
    const ollamaModel = ref("llama3");
    const showModelSettings = ref(false);
    const showModelModal = ref(false);
    const messages = ref([]);
    const input = ref("");
    const sending = ref(false);
    const chatEl = ref(null);
    let nextId = 1;
    const hasUnansweredQuiz = computed(
      () => messages.value.some((m) => m.role === "professor" && m.quiz && !m.quiz.answered && !m.streaming)
    );
    const whiteboardVisible = ref(false);
    const whiteboardItems = ref([]);
    function addDiagram(code) {
      const trimmed = code.trim();
      if (!trimmed || whiteboardItems.value.some((i) => i.content === trimmed)) {
        whiteboardVisible.value = true;
        return;
      }
      whiteboardItems.value.push({ id: `d-${Date.now()}`, title: `Diagram ${whiteboardItems.value.length + 1}`, content: trimmed, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      whiteboardVisible.value = true;
    }
    const chatWidth = ref(52);
    ref(null);
    const isDragging = ref(false);
    const terminalVisible = ref(false);
    const terminalHeight = ref(200);
    const terminalLines = ref([]);
    const terminalInput = ref("");
    const terminalRunning = ref(false);
    const daemonConnected = ref(false);
    let ws = null;
    let termLineId = 0;
    const terminalEl = ref(null);
    function addTermLine(text, type = "output") {
      terminalLines.value.push({ id: termLineId++, text, type });
      if (terminalLines.value.length > 500) terminalLines.value.shift();
      nextTick(() => {
        if (terminalEl.value) terminalEl.value.scrollTop = terminalEl.value.scrollHeight;
      });
    }
    async function connectTerminal() {
      try {
        const res = await fetch(`http://127.0.0.1:${DAEMON_PORT}/ping`, { signal: AbortSignal.timeout(800) });
        if (!res.ok) throw new Error();
      } catch {
        addTermLine("Academy WSL Bridge is not running. Start it in Vindicter desktop → Settings → WSL → Academy WSL Bridge.", "error");
        terminalVisible.value = true;
        return;
      }
      ws = new WebSocket(`ws://127.0.0.1:${DAEMON_PORT}/terminal`);
      ws.onopen = () => {
        daemonConnected.value = true;
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "ready") addTermLine(`sandbox: ${msg.distro ?? "wsl"} — ready`, "system");
          else if (msg.type === "data" && msg.text) addTermLine(msg.text.replace(/\n$/, ""));
          else if (msg.type === "done") {
            terminalRunning.value = false;
          }
        } catch {
        }
      };
      ws.onclose = () => {
        daemonConnected.value = false;
        addTermLine("disconnected", "system");
      };
      terminalVisible.value = true;
    }
    function sendTermCmd(cmd) {
      const command = (cmd ?? terminalInput.value).trim();
      if (!command || !ws || ws.readyState !== WebSocket.OPEN) return;
      terminalRunning.value = true;
      addTermLine(`$ ${command}`, "input");
      terminalInput.value = "";
      ws.send(JSON.stringify({ type: "cmd", cmd: command }));
    }
    function openTerminalWithCmd(cmd) {
      if (!daemonConnected.value) {
        void connectTerminal().then(() => {
          if (cmd) setTimeout(() => sendTermCmd(cmd), 500);
        });
      } else {
        terminalVisible.value = true;
        if (cmd) sendTermCmd(cmd);
      }
    }
    function stripSignals(text) {
      return text.replace(/^\s*ASSESSMENT\s*:?\s*READY\s*$/gim, "").replace(/^\s*LAB\s*:\s*(SPAWN|CMD[^\n]*)$/gim, "").replace(/^\s*ANSWER\s*:\s*[A-D]\s*$/gim, "").trim();
    }
    function parseMC(raw) {
      const strictMatch = raw.match(/QUIZ\s*:\s*MC\s*[\r\n]+([\s\S]+?)[\r\n]+([A-D]\)[\s\S]+?)(?:[\r\n]+ANSWER\s*:\s*([A-D]))?(?=[\r\n]+|$)/i);
      if (!strictMatch) {
        const lenient = raw.match(/QUIZ\s*:\s*MC\s*[\r\n]+([\s\S]*)/i);
        if (!lenient) return null;
        const block = lenient[1];
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const optLines2 = lines.filter((l) => /^[A-D][).:]\s+/.test(l));
        if (optLines2.length < 2) return null;
        const optIdx = lines.indexOf(optLines2[0]);
        const question2 = lines.slice(0, optIdx).join(" ").trim() || "Which of the following is correct?";
        const options2 = optLines2.map((l) => {
          const m = l.match(/^([A-D])[).:]\s*(.+)/);
          return m ? { letter: m[1], text: m[2].trim() } : null;
        }).filter((x) => x !== null);
        return { type: "mc", question: question2, options: options2, answered: false };
      }
      const question = strictMatch[1].trim();
      const optBlock = strictMatch[2].trim();
      const optLines = optBlock.split(/\r?\n/).filter((l) => /^[A-D][).:]\s+/.test(l.trim()));
      const options = optLines.map((l) => {
        const m = l.trim().match(/^([A-D])[).:]\s*(.+)/);
        return m ? { letter: m[1], text: m[2].trim() } : null;
      }).filter((x) => x !== null);
      if (options.length < 2) return null;
      return { type: "mc", question, options, answered: false };
    }
    function parseTextQuiz(raw) {
      const m1 = raw.match(/QUIZ\s*:\s*TEXT\s*[\r\n]+([\s\S]+?)\/QUIZ/i);
      if (m1) return { type: "text", question: m1[1].trim(), answered: false, studentInput: "" };
      const m2 = raw.match(/QUIZ\s*:\s*TEXT\s*[\r\n]+([\s\S]+?)(?=[\r\n]{2,}|$)/i);
      if (m2) return { type: "text", question: m2[1].trim(), answered: false, studentInput: "" };
      return null;
    }
    function parseQuiz(raw) {
      const normalized = raw.replace(/\r\n/g, "\n");
      const readyForNext = /ASSESSMENT\s*:?\s*READY/i.test(normalized);
      const labCmdMatch = normalized.match(/LAB\s*:\s*CMD\s+(.+)/i);
      const labSpawn = /LAB\s*:\s*SPAWN/i.test(normalized);
      const labCmd = labCmdMatch ? labCmdMatch[1].trim() : labSpawn ? "" : null;
      const mc = parseMC(normalized);
      if (mc) {
        const clean = stripSignals(normalized.replace(/QUIZ\s*:\s*MC[\s\S]*?(?=\n\n|$)/i, ""));
        return { cleanText: clean, quiz: mc, readyForNext, labCmd };
      }
      const txt = parseTextQuiz(normalized);
      if (txt) {
        const clean = stripSignals(normalized.replace(/QUIZ\s*:\s*TEXT[\s\S]*?(?:\/QUIZ|$)/i, ""));
        return { cleanText: clean, quiz: txt, readyForNext, labCmd };
      }
      return { cleanText: stripSignals(normalized), quiz: null, readyForNext, labCmd };
    }
    function splitByDividers(raw) {
      return raw.split(/\n[ \t]*---[ \t]*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
    }
    function finalize(placeholder, rawText) {
      const segments = splitByDividers(rawText);
      const finalized = segments.map((seg, i) => {
        const { cleanText, quiz, readyForNext, labCmd } = parseQuiz(seg);
        const mermaidMatch = cleanText.match(/```mermaid\n?([\s\S]*?)```/);
        return {
          id: i === 0 ? placeholder.id : nextId++,
          role: "professor",
          text: cleanText,
          quiz: quiz ?? null,
          streaming: false,
          mermaidCode: mermaidMatch?.[1]?.trim(),
          isContinuation: i > 0,
          _ready: readyForNext,
          _labCmd: labCmd
        };
      });
      const idx = messages.value.indexOf(placeholder);
      if (idx !== -1) messages.value.splice(idx, 1, ...finalized);
      sending.value = false;
      for (const msg of finalized) {
        if (msg.mermaidCode) addDiagram(msg.mermaidCode);
        if (msg._labCmd !== null && msg._labCmd !== void 0) openTerminalWithCmd(msg._labCmd);
        if (msg._ready) void markComplete();
      }
      void saveSession();
      nextTick(scrollToBottom);
    }
    function buildSystemPrompt() {
      const objectives = lesson.value.objectives.map((o) => `- ${o}`).join("\n");
      return `You are Professor Vindicter, an expert cybersecurity instructor.
Lesson: "${lesson.value.title}"
Objectives:
${objectives}

Teaching rules:
- Be encouraging, concise (3-6 sentences + quiz per turn).
- Teach one concept at a time. Always check understanding before moving on.
- When a student answers correctly: give brief praise, put --- on its own line, then continue.
- NEVER reveal the correct quiz answer before the student responds.
- When the student has mastered ALL objectives, end your response with: ASSESSMENT:READY
- Do NOT tell the student to "mark complete" — the app does this automatically.

QUIZ FORMAT — use exactly this syntax:
Multiple choice:
QUIZ:MC
[your question here]
A) [option]
B) [option]
C) [option]
D) [option]
ANSWER:A

Open text:
QUIZ:TEXT
[your question here]
/QUIZ

DIAGRAMS — when a visual helps, use:
\`\`\`mermaid
graph TD
  A --> B
\`\`\`
Keep diagrams compact (4–8 nodes). They open automatically in the Whiteboard panel.

TERMINAL — when hands-on practice helps (use sparingly):
LAB:SPAWN — opens the WSL sandbox terminal.
LAB:CMD nmap --help — opens terminal and pre-fills a command.

Today: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`;
    }
    function buildConversation(limit = 20) {
      const merged = [];
      for (const m of messages.value.filter((m2) => !m2.streaming)) {
        const parts = [];
        if (m.text.trim()) parts.push(m.text);
        if (m.quiz) {
          parts.push(`[${m.quiz.type.toUpperCase()} quiz: ${m.quiz.question}]`);
          if (m.quiz.answered) {
            const ans = m.quiz.type === "mc" ? m.quiz.selectedAnswer : m.quiz.studentInput;
            if (ans) parts.push(`Student answered: ${ans}`);
          }
        }
        if (!parts.length) continue;
        const role = m.role === "professor" ? "assistant" : "user";
        const last = merged[merged.length - 1];
        if (last && last.role === role && role === "assistant") last.content += "\n\n" + parts.join("\n");
        else merged.push({ role, content: parts.join("\n") });
      }
      return merged.slice(-limit);
    }
    async function callAI() {
      const conv = buildConversation();
      if (selectedModel.value === "openrouter") {
        if (!openrouterKey.value) throw new Error("OpenRouter API key not set. Click ⚙ above to configure.");
        const res2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openrouterKey.value}`, "Content-Type": "application/json", "HTTP-Referer": "https://dashboard.vindicter.xyz", "X-Title": "Vindicter Academy" },
          body: JSON.stringify({ model: openrouterModel.value, messages: [{ role: "system", content: buildSystemPrompt() }, ...conv] })
        });
        if (!res2.ok) {
          const t = await res2.text();
          throw new Error(`OpenRouter ${res2.status}: ${t.slice(0, 120)}`);
        }
        return (await res2.json()).choices?.[0]?.message?.content ?? "";
      }
      const res = await fetch(`${ollamaUrl.value.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: ollamaModel.value, stream: false, messages: [{ role: "system", content: buildSystemPrompt() }, ...conv] })
      });
      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      return (await res.json()).message?.content ?? "";
    }
    async function send(text) {
      const msg = (text ?? input.value).trim();
      if (!msg || sending.value) return;
      input.value = "";
      messages.value.push({ id: nextId++, role: "student", text: msg });
      void saveSession();
      nextTick(scrollToBottom);
      const placeholder = { id: nextId++, role: "professor", text: "", streaming: true, quiz: null };
      messages.value.push(placeholder);
      sending.value = true;
      try {
        const raw = await callAI();
        if (!raw.trim()) throw new Error("Professor returned an empty response. Check your API key and model selection.");
        finalize(placeholder, raw);
      } catch (e) {
        const idx = messages.value.indexOf(placeholder);
        if (idx !== -1) messages.value[idx] = { ...placeholder, text: `Error: ${e?.message ?? "Unknown error"}. Check your AI model settings (⚙).`, streaming: false, quiz: null };
        sending.value = false;
        void saveSession();
      }
    }
    function renderText(raw) {
      const chips = [];
      let i = 0;
      let t = raw.replace(/```mermaid\n?([\s\S]*?)```/g, (_m, code) => {
        chips.push(`<button class="mermaid-chip" data-code="${encodeURIComponent(code.trim())}">📊 View diagram</button>`);
        return `CHIP${i++}`;
      });
      t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>').replace(/\n/g, "<br>");
      chips.forEach((chip, j) => {
        t = t.replace(`CHIP${j}`, chip);
      });
      return t;
    }
    function renderMarkdown(raw) {
      let h = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => `<pre class="md-code"><code>${code.trimEnd()}</code></pre>`).replace(/`([^`\n]+)`/g, '<code class="md-inline">$1</code>').replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_m, header, rows) => {
        const ths = header.split("|").filter(Boolean).map((c) => `<th>${c.trim()}</th>`).join("");
        const trs = rows.trim().split("\n").map((row) => `<tr>${row.split("|").filter(Boolean).map((c) => `<td>${c.trim()}</td>`).join("")}</tr>`).join("");
        return `<table class="md-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      }).replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/((?:^- .+\n?)+)/gm, (b) => `<ul>${b.trim().split("\n").map((l) => `<li>${l.replace(/^- /, "")}</li>`).join("")}</ul>`).replace(/((?:^\d+\. .+\n?)+)/gm, (b) => `<ol>${b.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`).join("")}</ol>`).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
      return `<p>${h}</p>`.replace(/<p>(<(?:h[1-6]|ul|ol|pre|table)[^>]*>)/g, "$1").replace(/(<\/(?:h[1-6]|ul|ol|pre|table)>)<\/p>/g, "$1");
    }
    function scrollToBottom() {
      if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight;
    }
    const lessonComplete = ref(false);
    async function markComplete() {
      if (lessonComplete.value) return;
      lessonComplete.value = true;
      const uid = user.value?.id;
      if (!uid) return;
      await supabase.from("academy_progress").upsert({ user_id: uid, lesson_id: lessonId.value, completed_at: (/* @__PURE__ */ new Date()).toISOString(), started_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "user_id,lesson_id" });
    }
    async function loadProgress() {
      const uid = user.value?.id;
      if (!uid) return;
      const { data } = await supabase.from("academy_progress").select("completed_at").eq("user_id", uid).eq("lesson_id", lessonId.value).single();
      lessonComplete.value = !!data?.completed_at;
    }
    async function saveSession() {
      const uid = user.value?.id;
      if (!uid) return;
      await supabase.from("academy_chat_sessions").upsert({ user_id: uid, lesson_id: lessonId.value, messages: messages.value.filter((m) => !m.streaming), updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "user_id,lesson_id" });
    }
    async function loadSession() {
      const uid = user.value?.id;
      if (!uid) {
        await initLesson();
        return;
      }
      const { data } = await supabase.from("academy_chat_sessions").select("messages").eq("user_id", uid).eq("lesson_id", lessonId.value).single();
      if (data?.messages?.length) {
        messages.value = data.messages.map((m) => ({ ...m, streaming: false }));
        nextId = Math.max(0, ...messages.value.map((m) => m.id)) + 1;
        for (const m of messages.value) {
          if (m.mermaidCode) addDiagram(m.mermaidCode);
        }
        nextTick(scrollToBottom);
      } else {
        await initLesson();
      }
    }
    async function initLesson() {
      await send(`Hello Professor! I'm ready to start "${lesson.value.title}". Please introduce the lesson and what I should focus on.`);
    }
    watch(lessonId, async () => {
      messages.value = [];
      whiteboardItems.value = [];
      whiteboardVisible.value = false;
      lessonComplete.value = false;
      await Promise.all([loadProgress(), loadSession()]);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      _push(`<!--[-->`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showModelModal)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center" data-v-63f03dba><div class="absolute inset-0 backdrop-blur-sm" style="${ssrRenderStyle({ "background": "rgba(0,0,0,0.80)" })}" data-v-63f03dba></div><div class="relative rounded-2xl p-6 w-full max-w-md mx-4" style="${ssrRenderStyle({ "background": "rgba(14,15,20,0.99)", "border": "1px solid rgba(139,92,246,0.28)", "box-shadow": "0 40px 80px rgba(0,0,0,0.70)" })}" data-v-63f03dba><div class="flex items-center gap-3 mb-6" data-v-63f03dba><div class="size-10 rounded-xl flex items-center justify-center" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.12)", "border": "1px solid rgba(139,92,246,0.25)" })}" data-v-63f03dba>`);
          _push2(ssrRenderComponent(unref(GraduationCap), {
            class: "size-5",
            style: { "color": "rgba(167,139,250,0.90)" }
          }, null, _parent));
          _push2(`</div><div data-v-63f03dba><h2 class="text-[17px] font-bold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.92)" })}" data-v-63f03dba>Select AI Professor</h2><p class="text-[11px] mt-0.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-63f03dba>Configure your model before starting this lesson.</p></div></div><div class="grid grid-cols-2 gap-2.5 mb-5" data-v-63f03dba><!--[-->`);
          ssrRenderList(["openrouter", "ollama"], (m) => {
            _push2(`<button class="flex flex-col items-start gap-1.5 rounded-xl p-4 text-left transition-all cursor-pointer" style="${ssrRenderStyle(unref(selectedModel) === m ? "background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.32);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);")}" data-v-63f03dba><span class="text-[13px] font-semibold" style="${ssrRenderStyle(unref(selectedModel) === m ? "color:rgba(167,139,250,0.95);" : "color:rgba(255,255,255,0.55);")}" data-v-63f03dba>${ssrInterpolate(m === "openrouter" ? "OpenRouter" : "Ollama")}</span><span class="text-[10px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.28)" })}" data-v-63f03dba>${ssrInterpolate(m === "openrouter" ? "Cloud models (GPT-4o, Claude…)" : "Local models on-device")}</span></button>`);
          });
          _push2(`<!--]--></div><div class="space-y-3 mb-5" data-v-63f03dba>`);
          if (unref(selectedModel) === "openrouter") {
            _push2(`<!--[--><div data-v-63f03dba><p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>API Key</p><input${ssrRenderAttr("value", unref(openrouterKey))} type="password" placeholder="sk-or-v1-…" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba></div><div data-v-63f03dba><p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>Model</p><input${ssrRenderAttr("value", unref(openrouterModel))} placeholder="openai/gpt-4o-mini" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba></div><!--]-->`);
          } else {
            _push2(`<!--[--><div data-v-63f03dba><p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>Ollama URL</p><input${ssrRenderAttr("value", unref(ollamaUrl))} placeholder="http://localhost:11434" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba></div><div data-v-63f03dba><p class="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>Model</p><input${ssrRenderAttr("value", unref(ollamaModel))} placeholder="llama3" class="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba></div><!--]-->`);
          }
          _push2(`</div><button class="w-full rounded-xl py-3 text-[13px] font-semibold cursor-pointer transition-all hover:opacity-90 active:scale-[0.99]" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.20)", "border": "1px solid rgba(139,92,246,0.35)", "color": "rgba(167,139,250,0.95)" })}" data-v-63f03dba> Start Lesson </button></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`<div class="academy-lesson flex flex-col overflow-hidden" style="${ssrRenderStyle({ "height": "calc(100vh - 7.5rem)" })}" data-v-63f03dba><div class="flex items-center gap-3 px-1 pb-3 shrink-0" data-v-63f03dba><button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)" })}" data-v-63f03dba>`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "size-4" }, null, _parent));
      _push(`</button><div class="flex-1 min-w-0" data-v-63f03dba><p class="text-[10px] font-semibold uppercase tracking-[0.2em]" style="${ssrRenderStyle(`color:${unref(lesson).border.replace("0.30", "0.65")};`)}" data-v-63f03dba>${ssrInterpolate(unref(lesson).moduleLabel)}</p><h1 class="text-[16px] font-bold leading-tight truncate" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.90)" })}" data-v-63f03dba>${ssrInterpolate(unref(lesson).title)}</h1></div><div class="flex items-center gap-1.5 shrink-0" data-v-63f03dba>`);
      if (unref(lessonComplete)) {
        _push(`<span class="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style="${ssrRenderStyle({ "background": "rgba(35,165,90,0.12)", "border": "1px solid rgba(35,165,90,0.25)", "color": "rgba(74,222,128,0.90)" })}" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(CheckCircle2), { class: "size-3" }, null, _parent));
        _push(` Complete </span>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(whiteboardItems).length) {
        _push(`<button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer" style="${ssrRenderStyle(unref(whiteboardVisible) ? "background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.30);color:rgba(20,184,166,0.92);" : "background:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.18);color:rgba(20,184,166,0.60);")}" data-v-63f03dba> 📊 <span data-v-63f03dba>Board</span> <span class="tabular-nums" data-v-63f03dba>${ssrInterpolate(unref(whiteboardItems).length)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer" style="${ssrRenderStyle(unref(daemonConnected) ? "background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.25);color:rgba(165,180,252,0.85);" : "border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.28);")}" data-v-63f03dba>`);
      _push(ssrRenderComponent(unref(Terminal), { class: "size-3" }, null, _parent));
      _push(` Terminal </button><button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" title="Reset session" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>`);
      _push(ssrRenderComponent(unref(RotateCcw), { class: "size-3.5" }, null, _parent));
      _push(`</button><button class="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-63f03dba>`);
      _push(ssrRenderComponent(unref(Settings), { class: "size-4" }, null, _parent));
      _push(`</button></div></div>`);
      if (unref(showModelSettings)) {
        _push(`<div class="rounded-xl p-4 mb-3 shrink-0" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.04)", "border": "1px solid rgba(139,92,246,0.18)" })}" data-v-63f03dba><div class="flex items-center justify-between mb-4" data-v-63f03dba><div class="flex items-center gap-2" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(Settings), {
          class: "size-3.5",
          style: { "color": "rgba(167,139,250,0.60)" }
        }, null, _parent));
        _push(`<p class="text-[11px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(167,139,250,0.80)" })}" data-v-63f03dba>AI Professor — Model Settings</p></div><button class="size-6 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-white/[0.06]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(X), { class: "size-3.5" }, null, _parent));
        _push(`</button></div><div class="grid grid-cols-2 gap-2 mb-4" data-v-63f03dba><!--[-->`);
        ssrRenderList(["openrouter", "ollama"], (m) => {
          _push(`<button class="flex flex-col items-start gap-1 rounded-xl p-3 text-left cursor-pointer transition-all" style="${ssrRenderStyle(unref(selectedModel) === m ? "background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.30);" : "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);")}" data-v-63f03dba><span class="text-[11px] font-semibold" style="${ssrRenderStyle(unref(selectedModel) === m ? "color:rgba(167,139,250,0.95);" : "color:rgba(255,255,255,0.45);")}" data-v-63f03dba>${ssrInterpolate(m === "openrouter" ? "OpenRouter" : "Ollama")}</span><span class="text-[9px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}" data-v-63f03dba>${ssrInterpolate(m === "openrouter" ? "Cloud models" : "Local models")}</span></button>`);
        });
        _push(`<!--]--></div><div class="space-y-2" data-v-63f03dba>`);
        if (unref(selectedModel) === "openrouter") {
          _push(`<!--[--><input${ssrRenderAttr("value", unref(openrouterKey))} type="password" placeholder="OpenRouter API key (sk-or-v1-…)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba><input${ssrRenderAttr("value", unref(openrouterModel))} placeholder="Model (e.g. openai/gpt-4o-mini)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba><!--]-->`);
        } else {
          _push(`<!--[--><input${ssrRenderAttr("value", unref(ollamaUrl))} placeholder="Ollama URL (http://localhost:11434)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba><input${ssrRenderAttr("value", unref(ollamaModel))} placeholder="Model name (e.g. llama3)" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.09)" })}" data-v-63f03dba><!--]-->`);
        }
        _push(`</div><button class="mt-3 rounded-xl px-4 py-2 text-[12px] font-semibold cursor-pointer transition-all hover:opacity-90" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)", "color": "rgba(167,139,250,0.90)" })}" data-v-63f03dba>Save</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([unref(isDragging) ? "select-none cursor-col-resize" : "", "relative flex-1 flex gap-0 overflow-hidden min-h-0"])}" data-v-63f03dba>`);
      if (unref(whiteboardVisible)) {
        _push(`<div class="absolute inset-0 z-10 overflow-hidden rounded-xl" data-v-63f03dba>`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col overflow-hidden rounded-xl shrink-0" style="${ssrRenderStyle(`width:${unref(chatWidth)}%;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.015);`)}" data-v-63f03dba><div class="flex-1 overflow-y-auto p-4 space-y-3" style="${ssrRenderStyle({ "scrollbar-width": "thin", "scrollbar-color": "rgba(255,255,255,0.06) transparent" })}" data-v-63f03dba><!--[-->`);
      ssrRenderList(unref(messages), (msg) => {
        _push(`<div class="${ssrRenderClass([msg.role === "student" ? "justify-end" : "justify-start", "flex"])}" data-v-63f03dba>`);
        if (msg.role === "professor") {
          _push(`<div class="flex items-start gap-2.5 max-w-[92%]" data-v-63f03dba><div class="size-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5 professor-avatar" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.15)", "border": "1px solid rgba(139,92,246,0.28)" })}" data-v-63f03dba>`);
          _push(ssrRenderComponent(unref(GraduationCap), {
            class: "size-3.5",
            style: { "color": "rgba(167,139,250,0.90)" }
          }, null, _parent));
          _push(`</div><div class="min-w-0 space-y-2 flex-1" data-v-63f03dba>`);
          if (msg.isContinuation) {
            _push(`<div class="h-px w-8 rounded-full my-1" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.20)" })}" data-v-63f03dba></div>`);
          } else {
            _push(`<!---->`);
          }
          if (msg.streaming) {
            _push(`<div class="professor-bubble flex items-center gap-2" data-v-63f03dba><span class="text-[12px] italic" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-63f03dba>Professor is thinking</span><span class="flex gap-1" data-v-63f03dba><!--[-->`);
            ssrRenderList([0, 1, 2], (d) => {
              _push(`<span class="dot-bounce size-1 rounded-full" style="${ssrRenderStyle(`background:rgba(139,92,246,0.60);animation-delay:${d * 150}ms;`)}" data-v-63f03dba></span>`);
            });
            _push(`<!--]--></span></div>`);
          } else if (msg.text.trim()) {
            _push(`<div class="professor-bubble" data-v-63f03dba><span class="text-[13px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.82)" })}" data-v-63f03dba>${renderText(msg.text) ?? ""}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (msg.quiz?.type === "mc") {
            _push(`<div class="quiz-card quiz-mc rounded-xl p-4 space-y-3" data-v-63f03dba><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}" data-v-63f03dba>${ssrInterpolate(msg.quiz.question)}</p><div class="space-y-2" data-v-63f03dba><!--[-->`);
            ssrRenderList(msg.quiz.options, (opt) => {
              _push(`<button class="${ssrRenderClass([[msg.quiz.answered ? "cursor-default" : "cursor-pointer mc-option-hover", msg.quiz.selectedAnswer === opt.letter ? "mc-option-selected" : ""], "mc-option w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition-all"])}"${ssrIncludeBooleanAttr(msg.quiz.answered) ? " disabled" : ""} data-v-63f03dba><span class="${ssrRenderClass([msg.quiz.selectedAnswer === opt.letter ? "mc-letter-selected" : "mc-letter-default", "mc-letter size-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-all"])}" data-v-63f03dba>${ssrInterpolate(opt.letter)}</span><span data-v-63f03dba>${ssrInterpolate(opt.text)}</span></button>`);
            });
            _push(`<!--]--></div>`);
            if (msg.quiz.answered) {
              _push(`<p class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.25)" })}" data-v-63f03dba>Answer submitted — waiting for professor.</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          if (msg.quiz?.type === "text") {
            _push(`<div class="quiz-card quiz-text rounded-xl p-4 space-y-3" data-v-63f03dba><p class="text-[12px] font-semibold" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.85)" })}" data-v-63f03dba>${ssrInterpolate(msg.quiz.question)}</p>`);
            if (!msg.quiz.answered) {
              _push(`<!--[--><textarea rows="3" class="w-full rounded-xl px-3 py-2 text-[12px] text-white outline-none resize-none" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.05)", "border": "1px solid rgba(99,102,241,0.25)" })}" placeholder="Type your answer…" data-v-63f03dba>${ssrInterpolate(msg.quiz.studentInput)}</textarea><button class="rounded-xl px-4 py-2 text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-90" style="${ssrRenderStyle({ "background": "rgba(99,102,241,0.18)", "border": "1px solid rgba(99,102,241,0.30)", "color": "rgba(165,180,252,0.92)" })}" data-v-63f03dba>Submit answer</button><!--]-->`);
            } else {
              _push(`<p class="text-[11px] italic" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.35)" })}" data-v-63f03dba>&quot;${ssrInterpolate(msg.quiz.studentInput)}&quot;</p>`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<div class="max-w-[78%] student-bubble rounded-2xl rounded-tr-md px-4 py-2.5" data-v-63f03dba><p class="text-[13px] leading-relaxed whitespace-pre-wrap" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.88)" })}" data-v-63f03dba>${ssrInterpolate(msg.text)}</p></div>`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div>`);
      if (unref(hasUnansweredQuiz) && !unref(sending)) {
        _push(`<div class="px-4 py-2.5 border-t text-center shrink-0" style="${ssrRenderStyle({ "border-color": "rgba(255,255,255,0.06)" })}" data-v-63f03dba><p class="text-[11px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.22)" })}" data-v-63f03dba>Answer the question above to continue the conversation.</p></div>`);
      } else {
        _push(`<div class="flex items-center gap-2 p-3 border-t shrink-0" style="${ssrRenderStyle({ "border-color": "rgba(255,255,255,0.06)" })}" data-v-63f03dba><input${ssrRenderAttr("value", unref(input))}${ssrIncludeBooleanAttr(unref(sending) || unref(hasUnansweredQuiz)) ? " disabled" : ""} placeholder="Reply to the professor…" class="flex-1 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none transition-colors disabled:opacity-50" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.04)", "border": "1px solid rgba(255,255,255,0.08)" })}" data-v-63f03dba><button${ssrIncludeBooleanAttr(unref(sending) || !unref(input).trim() || unref(hasUnansweredQuiz)) ? " disabled" : ""} class="size-10 flex items-center justify-center rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100" style="${ssrRenderStyle({ "background": "rgba(139,92,246,0.20)", "border": "1px solid rgba(139,92,246,0.32)", "color": "rgba(167,139,250,0.92)" })}" data-v-63f03dba>`);
        if (unref(sending)) {
          _push(ssrRenderComponent(unref(Loader2), { class: "size-4 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(Send), { class: "size-4" }, null, _parent));
        }
        _push(`</button></div>`);
      }
      _push(`</div><div class="flex items-center justify-center w-4 cursor-col-resize shrink-0 group" data-v-63f03dba><div class="w-0.5 h-10 rounded-full transition-all duration-150 group-hover:h-16 group-hover:bg-violet-500/40" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.07)" })}" data-v-63f03dba></div></div><div class="flex flex-col flex-1 overflow-hidden" style="${ssrRenderStyle({ "min-width": "25%" })}" data-v-63f03dba><div class="rounded-xl p-4 mb-3 shrink-0" style="${ssrRenderStyle(`background:${unref(lesson).bg};border:1px solid ${unref(lesson).border};`)}" data-v-63f03dba><div class="flex items-center gap-2 mb-3" data-v-63f03dba>`);
      _push(ssrRenderComponent(unref(Target), {
        class: ["size-4 shrink-0", unref(lesson).color]
      }, null, _parent));
      _push(`<p class="${ssrRenderClass([unref(lesson).color, "text-[11px] font-bold uppercase tracking-wider"])}" data-v-63f03dba>Learning Objectives</p></div><ul class="space-y-1.5" data-v-63f03dba><!--[-->`);
      ssrRenderList(unref(lesson).objectives, (obj, i) => {
        _push(`<li class="flex items-start gap-2 text-[12px] leading-relaxed" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.70)" })}" data-v-63f03dba><span class="shrink-0 mt-0.5 size-4 rounded-full flex items-center justify-center text-[9px] font-bold" style="${ssrRenderStyle(`background:${unref(lesson).border};color:rgba(255,255,255,0.70);`)}" data-v-63f03dba>${ssrInterpolate(i + 1)}</span> ${ssrInterpolate(obj)}</li>`);
      });
      _push(`<!--]--></ul></div><div class="flex-1 overflow-y-auto rounded-xl content-panel" style="${ssrRenderStyle({ "border": "1px solid rgba(255,255,255,0.07)", "background": "rgba(255,255,255,0.015)", "scrollbar-width": "thin", "scrollbar-color": "rgba(255,255,255,0.06) transparent" })}" data-v-63f03dba><div class="p-5" data-v-63f03dba><div class="lesson-content" data-v-63f03dba>${renderMarkdown(unref(lesson).content) ?? ""}</div></div></div><div class="flex items-center justify-between gap-3 mt-3 shrink-0" data-v-63f03dba>`);
      if (unref(prevLesson)) {
        _push(`<button class="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/[0.05]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.40)", "border": "1px solid rgba(255,255,255,0.07)" })}" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(ChevronLeft), { class: "size-3.5" }, null, _parent));
        _push(` ${ssrInterpolate(unref(prevLesson).title)}</button>`);
      } else {
        _push(`<div data-v-63f03dba></div>`);
      }
      if (unref(lessonComplete)) {
        _push(`<button class="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]" style="${ssrRenderStyle({ "background": "rgba(34,197,94,0.10)", "border": "1px solid rgba(34,197,94,0.22)", "color": "rgba(74,222,128,0.85)" })}" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(CheckCircle2), { class: "size-3.5" }, null, _parent));
        _push(` Back to Academy </button>`);
      } else {
        _push(`<div class="text-[10px]" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.20)" })}" data-v-63f03dba>Complete this lesson to continue</div>`);
      }
      _push(`</div></div></div>`);
      if (unref(terminalVisible)) {
        _push(`<div class="shrink-0 mt-2 rounded-xl overflow-hidden" style="${ssrRenderStyle(`height:${unref(terminalHeight)}px;background:rgba(0,0,0,0.80);border:1px solid rgba(99,102,241,0.25);`)}" data-v-63f03dba><div class="h-4 flex items-center justify-center cursor-n-resize transition-colors hover:bg-white/[0.02] group shrink-0" data-v-63f03dba><div class="w-10 h-1 rounded-full transition-colors group-hover:bg-indigo-400/40" style="${ssrRenderStyle({ "background": "rgba(255,255,255,0.10)" })}" data-v-63f03dba></div></div><div class="flex items-center gap-2 px-3 py-1.5 border-b shrink-0" style="${ssrRenderStyle({ "border-color": "rgba(99,102,241,0.18)" })}" data-v-63f03dba>`);
        _push(ssrRenderComponent(unref(Terminal), {
          class: "size-3.5",
          style: { "color": "rgba(165,180,252,0.65)" }
        }, null, _parent));
        _push(`<span class="flex-1 text-[10px] font-semibold uppercase tracking-wider" style="${ssrRenderStyle({ "color": "rgba(165,180,252,0.55)" })}" data-v-63f03dba>WSL Sandbox</span><span class="${ssrRenderClass([unref(daemonConnected) ? "bg-emerald-400" : "bg-red-400/60", "size-1.5 rounded-full"])}" data-v-63f03dba></span><button class="text-[10px] transition-colors cursor-pointer hover:text-white/50" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.30)" })}" data-v-63f03dba>✕</button></div><div class="overflow-y-auto p-2 font-mono text-[11px] leading-relaxed" style="${ssrRenderStyle({ "height": "calc(100% - 72px)", "scrollbar-width": "thin" })}" data-v-63f03dba><!--[-->`);
        ssrRenderList(unref(terminalLines), (line) => {
          _push(`<div style="${ssrRenderStyle(line.type === "system" ? "color:rgba(20,184,166,0.70);" : line.type === "input" ? "color:rgba(165,180,252,0.80);" : line.type === "error" ? "color:rgba(248,113,113,0.75);" : "color:rgba(255,255,255,0.65);")}" class="whitespace-pre-wrap" data-v-63f03dba>${ssrInterpolate(line.text)}</div>`);
        });
        _push(`<!--]--></div><div class="flex items-center gap-2 border-t px-2 py-1 shrink-0" style="${ssrRenderStyle({ "border-color": "rgba(99,102,241,0.14)" })}" data-v-63f03dba><span class="font-mono text-[11px]" style="${ssrRenderStyle({ "color": "rgba(99,102,241,0.55)" })}" data-v-63f03dba>$</span><input${ssrRenderAttr("value", unref(terminalInput))}${ssrIncludeBooleanAttr(!unref(daemonConnected) || unref(terminalRunning)) ? " disabled" : ""} class="flex-1 bg-transparent font-mono text-[11px] outline-none disabled:opacity-40" style="${ssrRenderStyle({ "color": "rgba(255,255,255,0.75)" })}" placeholder="enter command…" data-v-63f03dba>`);
        if (unref(terminalRunning)) {
          _push(`<button class="text-[10px] cursor-pointer" style="${ssrRenderStyle({ "color": "rgba(248,113,113,0.65)" })}" data-v-63f03dba>^C</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/academy/[lessonId].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _lessonId_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-63f03dba"]]);

export { _lessonId_ as default };
//# sourceMappingURL=_lessonId_-ByeIKxnQ.mjs.map
