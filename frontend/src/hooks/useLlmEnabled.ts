/**
 * Hook to check if LLM features are enabled on the backend.
 * Fetches the /health/live endpoint (public, no auth) and caches the result.
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api/client'
import { API_ENDPOINTS } from '@/services/api/config'

interface LivenessResponse {
  status: string
  version: string
  timestamp: string
  llm_enabled: boolean
}

export function useLlmEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ['health', 'live'],
    queryFn: () => apiClient.get<LivenessResponse>(API_ENDPOINTS.healthLive, { skipAuth: true }),
    staleTime: Infinity,
    retry: false,
  })

  return data?.llm_enabled ?? false
}
