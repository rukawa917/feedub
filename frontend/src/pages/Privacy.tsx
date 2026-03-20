/**
 * Privacy Policy Page
 * Details data collection, usage, and user rights for Feedub
 */

import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Privacy() {
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
          <h1 className="text-xl font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Privacy Policy</h2>
          <p className="text-muted-foreground">Last updated: February 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="max-w-3xl mx-auto mb-12 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h3>
          <nav className="space-y-2">
            <a href="#what-is-feedub" className="block text-sm text-primary hover:underline">
              1. What is Feedub
            </a>
            <a href="#data-collected" className="block text-sm text-primary hover:underline">
              2. Data We Collect
            </a>
            <a href="#how-collected" className="block text-sm text-primary hover:underline">
              3. How We Collect Data
            </a>
            <a href="#why-collected" className="block text-sm text-primary hover:underline">
              4. Why We Collect Data
            </a>
            <a href="#third-party" className="block text-sm text-primary hover:underline">
              5. Third-Party Processors
            </a>
            <a href="#ai-processing" className="block text-sm text-primary hover:underline">
              6. AI Processing Disclosure
            </a>
            <a href="#data-retention" className="block text-sm text-primary hover:underline">
              7. Data Retention
            </a>
            <a href="#user-rights" className="block text-sm text-primary hover:underline">
              8. Your Rights
            </a>
            <a href="#security" className="block text-sm text-primary hover:underline">
              9. Security Measures
            </a>
            <a href="#contact" className="block text-sm text-primary hover:underline">
              10. Contact Us
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Section 1 */}
          <section id="what-is-feedub">
            <h3 className="text-lg font-semibold text-foreground mb-4">1. What is Feedub</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Feedub is a web application that helps you aggregate, search, and analyze messages
              from your Telegram channels. We provide AI-powered insights to help you understand
              trends, topics, and key information from your Telegram message history.
            </p>
          </section>

          {/* Section 2 */}
          <section id="data-collected">
            <h3 className="text-lg font-semibold text-foreground mb-4">2. Data We Collect</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Authentication Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
                  <li>Phone number (used for Telegram authentication)</li>
                  <li>Telegram user ID</li>
                  <li>Telegram session string (stored locally in your self-hosted database)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Message Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
                  <li>Text content from user-selected Telegram channels</li>
                  <li>Message metadata (timestamp, sender information, channel information)</li>
                  <li>Media information (file names, types, URLs)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Usage Data</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
                  <li>Channel selection preferences</li>
                  <li>AI consent preferences (per-channel)</li>
                  <li>Data retention settings</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="how-collected">
            <h3 className="text-lg font-semibold text-foreground mb-4">3. How We Collect Data</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              We collect data through the Telegram Client API using the Telethon library. When you
              authenticate with Feedub:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>You log in using your phone number and Telegram verification code</li>
              <li>We create an encrypted session using your Telegram credentials</li>
              <li>You explicitly choose which channels to sync</li>
              <li>
                We fetch messages from your selected channels using your authenticated session
              </li>
              <li>
                All data is collected through your own Telegram account - we do not access channels
                you have not explicitly selected
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="why-collected">
            <h3 className="text-lg font-semibold text-foreground mb-4">4. Why We Collect Data</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              We collect and process your data to provide the following services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>Full-text search across your Telegram channel messages</li>
              <li>Message filtering and organization</li>
              <li>AI-powered insights and trend analysis (when you opt-in)</li>
              <li>Message history management with configurable retention periods</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="third-party">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              5. Third-Party Processors
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">LLM Provider</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Feedub uses your configured LLM provider (e.g. Ollama, OpenAI, Anthropic, Google
                  Gemini) to generate AI-powered insights from your message content. Insights are
                  only generated when you explicitly request them and only for channels where you
                  have granted AI consent. Since Feedub is self-hosted, you choose which LLM
                  provider to use and your data stays on your infrastructure.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 text-sm">Self-Hosted Storage</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Feedub stores all data locally in a SQLite database on your machine. No cloud
                  database services are used. You have full control over your data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="ai-processing">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              6. AI Processing Disclosure
            </h3>
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you use the Insights feature, message content from your selected channels is
                sent to your configured LLM provider for analysis. This processing occurs only
                when you explicitly request it and only for channels where you have granted AI
                consent. You can revoke AI consent for any channel at any time through your channel
                settings.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="data-retention">
            <h3 className="text-lg font-semibold text-foreground mb-4">7. Data Retention</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              You have full control over how long your data is stored:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>Default retention period: 7 days</li>
              <li>You can configure retention periods per channel</li>
              <li>Messages are automatically deleted after the retention period expires</li>
              <li>You can manually delete messages or entire channels at any time</li>
              <li>Account deletion removes all your data permanently</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="user-rights">
            <h3 className="text-lg font-semibold text-foreground mb-4">8. Your Rights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>
                <strong className="text-foreground">Access:</strong> View all data we have collected
                about you
              </li>
              <li>
                <strong className="text-foreground">Export:</strong> Download your data in a
                portable format
              </li>
              <li>
                <strong className="text-foreground">Delete:</strong> Remove specific messages,
                channels, or your entire account
              </li>
              <li>
                <strong className="text-foreground">Control AI Processing:</strong> Grant or revoke
                AI consent for any channel
              </li>
              <li>
                <strong className="text-foreground">Configure Retention:</strong> Set custom
                retention periods for your data
              </li>
              <li>
                <strong className="text-foreground">Revoke Access:</strong> Disconnect your Telegram
                session at any time
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              To exercise any of these rights, open an issue on{' '}
              <a href="https://github.com/feeduby/feedub_v2/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                GitHub
              </a>.
            </p>
          </section>

          {/* Section 9 */}
          <section id="security">
            <h3 className="text-lg font-semibold text-foreground mb-4">9. Security Measures</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground leading-relaxed">
              <li>All data stored locally in your self-hosted SQLite database</li>
              <li>HTTPS/TLS encryption for data transmission (when configured with reverse proxy)</li>
              <li>Configurable data retention to minimize stored data</li>
              <li>No password storage (authentication via Telegram only)</li>
              <li>JWT-based session management with configurable expiration</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="contact">
            <h3 className="text-lg font-semibold text-foreground mb-4">10. Contact Us</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or how we handle your data, please
              contact us:
            </p>
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <p className="text-sm text-foreground">
                GitHub:{' '}
                <a href="https://github.com/feeduby/feedub_v2/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Open an issue
                </a>
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
