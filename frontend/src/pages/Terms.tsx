/**
 * Terms of Service Page
 * Legal terms and conditions for using Feedub
 */

import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </button>
          <h1 className="text-xl font-semibold text-foreground">Terms of Service</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Terms of Service</h2>
          <p className="text-muted-foreground">Last updated: February 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="max-w-3xl mx-auto mb-12 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h3>
          <nav className="space-y-2">
            <a href="#agreement" className="block text-sm text-primary hover:underline">
              1. Agreement to Terms
            </a>
            <a href="#service-description" className="block text-sm text-primary hover:underline">
              2. Service Description
            </a>
            <a href="#account" className="block text-sm text-primary hover:underline">
              3. Account & Authentication
            </a>
            <a href="#ai-features" className="block text-sm text-primary hover:underline">
              4. AI Features Disclaimer
            </a>
            <a href="#data-processing" className="block text-sm text-primary hover:underline">
              5. Data Processing
            </a>
            <a href="#intellectual-property" className="block text-sm text-primary hover:underline">
              6. Intellectual Property
            </a>
            <a href="#telegram-dependency" className="block text-sm text-primary hover:underline">
              8. Telegram Dependency
            </a>
            <a
              href="#limitation-of-liability"
              className="block text-sm text-primary hover:underline"
            >
              9. Limitation of Liability
            </a>
            <a href="#termination" className="block text-sm text-primary hover:underline">
              10. Termination
            </a>
            <a href="#changes" className="block text-sm text-primary hover:underline">
              11. Changes to Terms
            </a>
            <a href="#governing-law" className="block text-sm text-primary hover:underline">
              12. Governing Law
            </a>
            <a href="#contact" className="block text-sm text-primary hover:underline">
              13. Contact
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Section 1 */}
          <section id="agreement">
            <h3 className="text-lg font-semibold text-foreground mb-4">1. Agreement to Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using Feedub, you agree to be bound by these Terms of Service and our
              Privacy Policy. If you do not agree to these terms, you may not use our service. Your
              continued use of Feedub constitutes acceptance of any updated terms.
            </p>
          </section>

          {/* Section 2 */}
          <section id="service-description">
            <h3 className="text-lg font-semibold text-foreground mb-4">2. Service Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Feedub is a web application that provides:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>Aggregation and synchronization of messages from your Telegram channels</li>
              <li>Full-text search and filtering of message content</li>
              <li>AI-powered insights and trend analysis using your configured LLM provider</li>
              <li>Configurable data retention and privacy controls</li>
              <li>Message history management and organization</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              We reserve the right to modify, suspend, or discontinue any part of the service at any
              time with reasonable notice.
            </p>
          </section>

          {/* Section 3 */}
          <section id="account">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              3. Account & Authentication
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Account Requirements</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
                  <li>You must have a valid Telegram account to use Feedub</li>
                  <li>You must provide a valid phone number for authentication</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must be at least 13 years old to use this service</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Account Security</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You are responsible for all activity that occurs under your account. You must
                  notify us immediately of any unauthorized access or security breach. Feedub is not
                  liable for any loss or damage arising from your failure to protect your account
                  credentials.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="ai-features">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              4. AI Features Disclaimer
            </h3>
            <div className="p-4 border border-border rounded-lg bg-card/50 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Important:</strong> AI-generated insights are
                created using your configured LLM provider and may contain inaccuracies,
                hallucinations, or errors. By using the Insights feature, you acknowledge and agree
                that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>AI insights are provided for informational purposes only</li>
                <li>Insights are not financial, legal, medical, or professional advice</li>
                <li>
                  You are responsible for verifying all AI-generated content before taking action
                </li>
                <li>Feedub is not liable for decisions made based on AI insights</li>
                <li>AI analysis may not be completely accurate or comprehensive</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section id="data-processing">
            <h3 className="text-lg font-semibold text-foreground mb-4">5. Data Processing</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                By using Feedub, you grant us permission to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>Access messages from Telegram channels you explicitly select</li>
                <li>Store and process your message data according to your retention settings</li>
                <li>
                  Send message content to your configured LLM provider when you request AI insights
                </li>
                <li>Process your data as described in our Privacy Policy</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                You retain full control over which channels are synced and data retention periods.
                You can revoke these permissions at any time through your account settings. You are
                responsible for any data privacy risks associated with using AI features.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="intellectual-property">
            <h3 className="text-lg font-semibold text-foreground mb-4">6. Intellectual Property</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Your Content</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You retain all ownership rights to your Telegram messages and content. Feedub does
                  not claim ownership of any user content. We only process your content to provide
                  the services you request.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">AI-Generated Content</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-generated insights are provided "as-is" for your personal use. Feedub makes no
                  representations or warranties about the accuracy, completeness, or reliability of
                  AI-generated content.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Feedub Platform</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Feedub is open-source software. Please refer to the project's license for terms
                  governing use, modification, and distribution of the codebase.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="telegram-dependency">
            <h3 className="text-lg font-semibold text-foreground mb-4">8. Telegram Dependency</h3>
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Feedub relies on Telegram's API to function. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li>Service availability depends on Telegram's platform and API</li>
                <li>
                  Feedub is not affiliated with, endorsed by, or officially connected to Telegram
                </li>
                <li>Changes to Telegram's API may affect Feedub's functionality</li>
                <li>Feedub is not responsible for Telegram service outages or limitations</li>
                <li>You must comply with Telegram's Terms of Service when using Feedub</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section id="limitation-of-liability">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              9. Limitation of Liability
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Service "As-Is":</strong> Feedub is provided
                "as-is" and "as available" without warranties of any kind, express or implied. We do
                not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Limitation:</strong> To the maximum extent
                permitted by law, Feedub shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages, including loss of data, revenue, or profits,
                arising from your use of the service.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Self-Hosted:</strong> Feedub is provided as
                self-hosted open-source software. You are responsible for your own deployment, data,
                and infrastructure.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="termination">
            <h3 className="text-lg font-semibold text-foreground mb-4">10. Termination</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">By You</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You may terminate your account at any time through your account settings. Upon
                  termination, all your data will be permanently deleted according to our Privacy
                  Policy.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">By Feedub</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Since Feedub is self-hosted, you have full control over your installation. You may
                  stop using the service at any time by shutting down your local instance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section id="changes">
            <h3 className="text-lg font-semibold text-foreground mb-4">11. Changes to Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update these Terms of Service from time to time. We will notify you of material
              changes via email or through the service. Your continued use of Feedub after changes
              take effect constitutes acceptance of the updated terms. If you do not agree to the
              changes, you should discontinue use of the service.
            </p>
          </section>

          {/* Section 12 */}
          <section id="governing-law">
            <h3 className="text-lg font-semibold text-foreground mb-4">12. Governing Law</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable law. Any
              disputes arising from these Terms or your use of Feedub shall be resolved in
              accordance with the dispute resolution procedures of the applicable jurisdiction.
            </p>
          </section>

          {/* Section 13 */}
          <section id="contact">
            <h3 className="text-lg font-semibold text-foreground mb-4">13. Contact</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <p className="text-sm text-foreground">
                GitHub:{' '}
                <a
                  href="https://github.com/rukawa917/feedub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open an issue
                </a>
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
