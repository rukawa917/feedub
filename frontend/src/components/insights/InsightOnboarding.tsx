/**
 * InsightOnboarding component
 *
 * First-time user experience for AI-powered insights.
 * Explains the value proposition and includes a data privacy disclaimer.
 */

import { Sparkles, Check, ArrowRight, AlertTriangle } from 'lucide-react'

interface InsightOnboardingProps {
  /** Callback to navigate to dashboard for message selection */
  onGetStarted: () => void
}

export function InsightOnboarding({ onGetStarted }: InsightOnboardingProps) {
  const features = [
    'Key topics and themes',
    'Important announcements',
    'Action items with assignees',
  ]

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in-up">
      {/* Gradient icon container with sparkles */}
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-6 shadow-glow relative overflow-hidden">
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        <Sparkles className="h-12 w-12 text-primary relative z-10" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
        AI-Powered Insights
      </h2>

      {/* Subtitle */}
      <p className="text-foreground-muted mb-8 max-w-md leading-relaxed text-base">
        Get intelligent summaries of your Telegram conversations. AI analyzes your messages to
        extract:
      </p>

      {/* Feature list */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {features.map((feature, index) => (
          <div
            key={feature}
            className="flex items-center gap-3 text-left p-3.5 rounded-xl bg-secondary/30 border border-border hover:border-border-highlight transition-all duration-250 hover:bg-secondary/50"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fade-in-up 0.4s ease-out backwards',
            }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-medium text-foreground">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onGetStarted}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-glow-sm hover:shadow-glow transition-all duration-250 hover:scale-105 active:scale-95"
      >
        Get Started
        <ArrowRight className="w-4 h-4 transition-transform duration-250 group-hover:translate-x-0.5" />
      </button>

      {/* Data privacy disclaimer */}
      <div className="mt-6 flex items-start gap-2 max-w-sm text-left">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground-muted">
          Message data will be sent to your configured LLM provider for analysis. You are
          responsible for any data privacy risks associated with this.
        </p>
      </div>
    </div>
  )
}
