import { http, HttpResponse } from 'msw'
import type { SimulationResult } from '@/types'

export const simulationHandlers = [
  http.post('/api/simulation/calculate', async ({ request }) => {
    const body = await request.json() as {
      installmentValue: number
      installments: number
      interestRate: number
    }
    const { installmentValue, installments, interestRate } = body
    const i = interestRate / 100
    const releasedValue =
      i === 0
        ? installmentValue * installments
        : installmentValue * ((1 - Math.pow(1 + i, -installments)) / i)
    const totalValue = installmentValue * installments
    const financingCost = totalValue - releasedValue
    const result: SimulationResult = {
      releasedValue: Math.round(releasedValue * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      financingCost: Math.round(financingCost * 100) / 100,
    }
    return HttpResponse.json(result)
  }),
]
