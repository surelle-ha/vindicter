<script setup lang="ts">
useLandingSeo({
  title: 'Vindicter Privacy Policy',
  description: 'Learn how Vindicter handles privacy — account data, AI provider calls, minimal telemetry, and transparent data practices.',
  path: '/privacy',
})

const lastUpdated = 'May 28, 2026'
</script>

<template>
  <div class="flex flex-1 flex-col">
    <!-- Content -->
    <main class="flex-1 pt-28 pb-24 px-6">
      <div class="max-w-3xl mx-auto">

        <!-- Header -->
        <div class="mb-12">
          <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent/70 mb-3">Legal</p>
          <h1 class="font-display text-[44px] sm:text-[56px] font-black uppercase leading-none tracking-wide mb-4">
            Privacy Policy
          </h1>
          <p class="text-[13px] text-white/35">Last updated: {{ lastUpdated }}</p>
        </div>

        <!-- Summary callout -->
        <div class="mb-10 rounded-2xl border border-ok/20 bg-ok/5 p-6">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok/15 border border-ok/20">
              <svg class="h-5 w-5 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p class="text-[14px] font-bold text-white mb-1">The short version</p>
              <p class="text-[13px] leading-relaxed text-white/55">
                Vindicter requires an account to use. We collect only what is necessary to run the service: your email, workspace membership, and scan activity metadata. Your source code and project files are never uploaded or stored by Vindicter.
              </p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="prose-policy space-y-10">

          <section>
            <h2>1. What We Collect</h2>
            <p>
              We collect the minimum necessary to operate the platform: your email address, display name, workspace memberships, and authentication tokens. We do not collect crash reports, usage analytics, or telemetry beyond what is required for account management.
            </p>
            <p>All scan results, findings, and project metadata are stored locally on your machine. Only your account credentials and workspace settings are synchronized with the Vindicter service.
            </p>
          </section>

          <section>
            <h2>2. Local Storage</h2>
            <p>Vindicter stores the following data exclusively on your local machine:</p>
            <ul>
              <li>Project directories and metadata you register</li>
              <li>Scan results and vulnerability findings</li>
              <li>App preferences and settings</li>
            </ul>
            <p>You can inspect, edit, or delete this data at any time. Uninstalling Vindicter removes all app-managed storage.</p>
          </section>

          <section>
            <h2>3. External Network Requests</h2>
            <p>Vindicter makes a small number of outbound network requests, none of which involve your personal data:</p>
            <ul>
              <li>
                <strong>Beta sign-up</strong> — when you register for the open beta, we collect your name and email address to send you a download link. This data is stored in our database and is not shared with third parties or used for marketing.
              </li>
              <li>
                <strong>AI provider calls (Scan)</strong> — if you configure an AI model (Claude, OpenRouter, or Ollama) for scanning, the app invokes those CLIs or APIs directly from your machine using credentials you supply. Vindicter does not proxy, store, or log those requests. The AI provider's own privacy policy applies to any data you send.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Cookies & Tracking</h2>
            <p>The Vindicter desktop application does not use cookies, browser storage, or any tracking technology.</p>
            <p>The landing website (<code>vindicter.xyz</code>) also does not use cookies, analytics scripts, or advertising trackers. It serves static HTML with no session tracking.</p>
          </section>

          <section>
            <h2>5. Children's Privacy</h2>
            <p>Vindicter does not knowingly collect any information from anyone, including children under the age of 13. Because no data is collected, there is nothing to distinguish.</p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              Beta sign-up information (name and email) is retained for the duration of the beta programme. You may request deletion at any time by emailing
              <a href="mailto:privacy@vindicter.xyz">privacy@vindicter.xyz</a>.
            </p>
          </section>

          <section>
            <h2>7. Changes to This Policy</h2>
            <p>If we ever change this policy in a material way, we will update the date at the top of this page. Because we collect minimal data, any future changes are likely to remain minimal.</p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>
              Questions about this policy? Email us at
              <a href="mailto:privacy@vindicter.xyz">privacy@vindicter.xyz</a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  </div>
</template>

