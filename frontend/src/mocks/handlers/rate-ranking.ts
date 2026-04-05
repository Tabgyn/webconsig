import { http, HttpResponse } from 'msw'
import { INSTITUTIONS } from '../fixtures/institutions'
import type { RateRankingEntry } from '@/types'

const RATES: Record<string, number> = {
  'inst-1': 1.75,
  'inst-2': 1.89,
  'inst-3': 2.05,
  'inst-4': 2.30,
}

export const rateRankingHandlers = [
  http.get('/api/rate-ranking', () => {
    const data: RateRankingEntry[] = INSTITUTIONS
      .filter((inst) => inst.isActive)
      .map((inst) => ({
        rank: 0,
        institutionId: inst.id,
        institutionName: inst.name,
        interestRate: RATES[inst.id] ?? 2.0,
      }))
      .sort((a, b) => a.interestRate - b.interestRate)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    return HttpResponse.json({ data })
  }),
]
