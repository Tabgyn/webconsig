import { http, HttpResponse } from 'msw'
import { SETTINGS } from '../fixtures/settings'
import type { SystemSetting } from '@/types'

let settingsData: SystemSetting[] = [...SETTINGS]

export const settingsHandlers = [
  http.get('/api/settings', () => {
    return HttpResponse.json({ data: settingsData })
  }),

  http.put('/api/settings/:key', async ({ params, request }) => {
    const body = await request.json() as { value: string }
    const index = settingsData.findIndex((s) => s.key === params.key)
    if (index === -1) {
      return HttpResponse.json({ message: 'Configuração não encontrada' }, { status: 404 })
    }
    settingsData = settingsData.map((s) =>
      s.key === params.key ? { ...s, value: body.value } : s,
    )
    const updated = settingsData.find((s) => s.key === params.key)!
    return HttpResponse.json({ data: updated })
  }),
]
