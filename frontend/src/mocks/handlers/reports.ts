import { http, HttpResponse } from 'msw'

const REPORT_TYPES = ['consignments', 'employees', 'deductions', 'representatives'] as const

export const reportHandlers = [
  http.post('/api/reports/export', async ({ request }) => {
    const body = await request.json() as { type: string; institutionId?: string }
    if (!REPORT_TYPES.includes(body.type as typeof REPORT_TYPES[number])) {
      return HttpResponse.json({ message: 'Tipo de relatório inválido' }, { status: 400 })
    }
    const scope = body.institutionId ? ` (entidade ${body.institutionId})` : ''
    return HttpResponse.json({ message: `Relatório "${body.type}"${scope} exportado com sucesso.` })
  }),
]
