/**
 * useInsightsConsent - Manages LLM insights consent state
 * Handles consent status, give/revoke consent, and localStorage caching
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import {
  getConsentStatus,
  giveConsent as giveConsentApi,
  revokeConsent as revokeConsentApi,
} from '../services/insights-service'
import type { ConsentStatus } from '../types/insights'

const CONSENT_CACHE_KEY = 'insights_consent_cache'

interface UseInsightsConsentReturn {
  consentStatus: ConsentStatus | null
  isLoading: boolean
  error: Error | null
  needsConsent: boolean
  giveConsent: () => Promise<void>
  revokeConsent: () => Promise<void>
  refetch: () => Promise<void>
}

export function useInsightsConsent(): UseInsightsConsentReturn {
  const token = useAuthStore((state) => state.token)
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load cached consent status on mount
  useEffect(() => {
    const cached = localStorage.getItem(CONSENT_CACHE_KEY)
    if (cached) {
      try {
        setConsentStatus(JSON.parse(cached))
      } catch {
        localStorage.removeItem(CONSENT_CACHE_KEY)
      }
    }
  }, [])

  // Fetch consent status from API
  const fetchConsentStatus = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const status = await getConsentStatus()
      setConsentStatus(status)
      localStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify(status))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch consent status'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Fetch on mount and when token changes
  useEffect(() => {
    fetchConsentStatus()
  }, [fetchConsentStatus])

  // Computed: needs consent if no consent or re-consent required
  const needsConsent = !consentStatus?.has_consent || consentStatus.requires_re_consent

  // Give consent action
  const giveConsent = useCallback(async () => {
    if (!token || !consentStatus) return

    setIsLoading(true)
    setError(null)

    try {
      await giveConsentApi(consentStatus.current_version)
      await fetchConsentStatus()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to give consent'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, consentStatus, fetchConsentStatus])

  // Revoke consent action
  const revokeConsent = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      await revokeConsentApi()
      localStorage.removeItem(CONSENT_CACHE_KEY)
      await fetchConsentStatus()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to revoke consent'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token, fetchConsentStatus])

  return {
    consentStatus,
    isLoading,
    error,
    needsConsent,
    giveConsent,
    revokeConsent,
    refetch: fetchConsentStatus,
  }
}
