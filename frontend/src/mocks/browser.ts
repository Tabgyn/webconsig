import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { consignmentHandlers } from './handlers/consignments'
import { portabilityHandlers } from './handlers/portability'
import { simulationHandlers } from './handlers/simulation'
import { outstandingBalanceHandlers } from './handlers/outstanding-balance'
import { deductionStatementHandlers } from './handlers/deduction-statement'
import { rateRankingHandlers } from './handlers/rate-ranking'
import { dashboardHandlers } from './handlers/dashboard'

export const worker = setupWorker(
  ...authHandlers,
  ...consignmentHandlers,
  ...portabilityHandlers,
  ...simulationHandlers,
  ...outstandingBalanceHandlers,
  ...deductionStatementHandlers,
  ...rateRankingHandlers,
  ...dashboardHandlers,
)
