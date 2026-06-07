<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next'

useLandingSeo({
  title: 'FAQ - Vindicter',
  description: 'Common questions about Vindicter, AI-powered security review, beta access, AI providers, and support.',
  path: '/faq',
})

const faqs = [
  {
    question: 'What is Vindicter?',
    answer: 'Vindicter is an AI-powered security platform for teams — automating vulnerability scanning, finding tracking, dependency inventory, secret detection, and security learning.',
  },
  {
    question: 'Is Vindicter free during beta?',
    answer: 'Yes. The open beta is free to download and use. The Special Beta Program is for organizations that want closer feedback and support during early access.',
  },
  {
    question: 'Does my code leave my machine?',
    answer: 'Vindicter sends only the project context you explicitly select to your configured AI provider. Your source files are never uploaded — only the prompts you construct are forwarded.',
  },
  {
    question: 'Which operating systems are supported?',
    answer: 'The beta download is currently focused on Windows x64. Additional platforms can be considered as the desktop app matures.',
  },
  {
    question: 'Which AI providers can I use?',
    answer: 'Vindicter is being built around flexible provider support, including Claude, OpenRouter, Ollama, and local workflows where possible.',
  },
  {
    question: 'What is the Special Beta Program?',
    answer: 'It is an organization-only program for teams that want early access, dedicated developer support, and a closer feedback loop on the roadmap.',
  },
  {
    question: 'Can I use Vindicter for third-party security testing?',
    answer: 'Only use Vindicter on systems, repositories, and networks you own or have explicit authorization to test.',
  },
  {
    question: 'How do I get support?',
    answer: 'Check the documentation and FAQ first. If your question is not answered, use the support page to submit a request.',
  },
]
</script>

<template>
  <div class="flex flex-1 flex-col">
    <main class="flex-1 px-6 py-28">
      <div class="mx-auto max-w-4xl">
        <div class="mb-10 text-center">
          <div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10">
            <HelpCircle class="h-8 w-8 text-accent" />
          </div>
          <h1 class="font-display text-[44px] font-black uppercase leading-none tracking-wide sm:text-[60px]">
            FAQ
          </h1>
          <p class="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-white/48">
            Quick answers for the questions most people ask before downloading or joining the beta.
          </p>
        </div>

        <section class="grid gap-3">
          <article
            v-for="item in faqs"
            :key="item.question"
            class="rounded-2xl border border-white/8 bg-surface/55 p-5"
          >
            <h2 class="text-[15px] font-bold text-white">{{ item.question }}</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-white/48">{{ item.answer }}</p>
          </article>
        </section>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink to="/docs" class="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-[13px] font-semibold text-white/55 transition hover:bg-white/5 hover:text-white">
            Read documentation
          </NuxtLink>
          <NuxtLink to="/support" class="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-[13px] font-bold text-white transition hover:bg-accent/90">
            Contact support
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>
