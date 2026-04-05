import { http, HttpResponse } from 'msw'

const REPORT_TYPES = ['consignments', 'employees', 'deductions'] as const

export const reportHandlers = [
  http.post('/api/reports/export', async ({ request }) => {
    const body = await request.json() as { type: string }
    if (!REPORT_TYPES.includes(body.type as typeof REPORT_TYPES[number])) {
      return HttpResponse.json({ message: 'Tipo de relatório inválido' }, { status: 400 })
    }
    return HttpResponse.json({ message: `Relatório "${body.type}" exportado com sucesso.` })
  }),
]
