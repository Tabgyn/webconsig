import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from './protected-route'
import { AppLayout } from './app-layout'
import { LoginPage } from '@/pages/login/login-page'
import { HomePage } from '@/pages/home/home-page'
import { ConsignmentsPage } from '@/pages/consignments/consignments-page'
import { PortabilityPage } from '@/pages/portability/portability-page'
import { SimulationPage } from '@/pages/simulation/simulation-page'
import { OutstandingBalancePage } from '@/pages/outstanding-balance/outstanding-balance-page'
import { DeductionStatementPage } from '@/pages/deduction-statement/deduction-statement-page'
import { RateRankingPage } from '@/pages/rate-ranking/rate-ranking-page'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'consignments', element: <ConsignmentsPage /> },
      { path: 'portability', element: <PortabilityPage /> },
      { path: 'simulation', element: <SimulationPage /> },
      { path: 'outstanding-balance', element: <OutstandingBalancePage /> },
      { path: 'deduction-statement', element: <DeductionStatementPage /> },
      { path: 'rate-ranking', element: <RateRankingPage /> },
    ],
  },
])
