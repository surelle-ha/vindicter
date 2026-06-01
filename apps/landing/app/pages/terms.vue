<script setup lang="ts">
useLandingSeo({
  title: 'Vindicta Terms of Service',
  description: 'Review the Vindicta terms for responsible security testing, licensing, educational Academy content, AI provider usage, and warranty limits.',
  path: '/terms',
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
            Terms of Service
          </h1>
          <p class="text-[13px] text-white/35">Last updated: {{ lastUpdated }}</p>
        </div>

        <!-- Summary callout -->
        <div class="mb-10 rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
              <svg class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p class="text-[14px] font-bold text-white mb-1">The short version</p>
              <p class="text-[13px] leading-relaxed text-white/55">
                Vindicta is free proprietary software. Use it responsibly — only on systems you own or have explicit written permission to test. We provide no warranty.
              </p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="prose-policy space-y-10">

          <section>
            <h2>1. Acceptance</h2>
            <p>
              By downloading, installing, or using Vindicta ("the Software"), you agree to these Terms of Service. If you do not agree, do not use the Software.
            </p>
          </section>

          <section>
            <h2>2. License</h2>
            <p>
              Vindicta is proprietary software. You are granted a personal, non-transferable licence to install and use the Software on devices you own, solely for your own security research and learning purposes.
            </p>
            <p>
              You may not redistribute, resell, sublicense, or create derivative works of the Software without prior written consent from Surelle-ha.
            </p>
          </section>

          <section>
            <h2>3. Acceptable Use</h2>
            <p>Vindicta is a security research and learning tool. You agree to use it only in ways that are legal and ethical:</p>
            <ul>
              <li>Only scan, audit, or perform penetration testing on systems, networks, and codebases you own or have <strong>explicit written authorisation</strong> to test</li>
              <li>Do not use the Software to gain unauthorised access to any computer system or network</li>
              <li>Do not use the Software to violate any applicable local, national, or international law</li>
              <li>Do not use the Software for malicious purposes, including but not limited to extortion, sabotage, or data theft</li>
            </ul>
            <p>
              Unauthorised security testing is illegal in most jurisdictions. You are solely responsible for ensuring your use of Vindicta complies with all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2>4. Academy & Educational Content</h2>
            <p>
              The Vindicta Academy curriculum covers security concepts including penetration testing techniques. This content is provided for educational purposes only. Applying these techniques to systems without authorisation is illegal and unethical.
            </p>
            <p>
              The Academy completion certificate is issued locally and is not an accredited qualification. It is intended as a personal learning milestone.
            </p>
          </section>

          <section>
            <h2>5. AI Features</h2>
            <p>
              Vindicta integrates with third-party AI providers (Anthropic Claude, OpenRouter, Ollama) for security scanning and the Academy professor. When you use these features, your data is sent to the respective provider's API under their own terms of service and privacy policy. Vindicta does not control, store, or review that data.
            </p>
            <p>You are responsible for complying with your AI provider's acceptable use policies.</p>
          </section>

          <section>
            <h2>6. No Warranty</h2>
            <p>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              Security scan results, findings, and recommendations produced by Vindicta are generated by AI and may be incomplete, inaccurate, or incorrect. Do not rely solely on Vindicta output for production security decisions. Always verify findings manually or with a qualified security professional.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </section>

          <section>
            <h2>8. Changes to These Terms</h2>
            <p>
              We may update these terms at any time. The "last updated" date at the top of this page reflects the most recent revision. Continued use of the Software after a change constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2>9. Contact</h2>
            <p>
              For questions or concerns about these terms, email us at
              <a href="mailto:legal@vindicta.surelle.xyz">legal@vindicta.surelle.xyz</a>.
            </p>
          </section>

        </div>
      </div>
    </main>
  </div>
</template>

