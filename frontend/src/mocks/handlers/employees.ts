import { http, HttpResponse } from 'msw'
import { EMPLOYEES } from '../fixtures/employees'

export const employeeHandlers = [
  http.get('/api/employees', () => {
    return HttpResponse.json({ data: EMPLOYEES, total: EMPLOYEES.length })
  }),

  http.get('/api/employees/:id', ({ params }) => {
    const employee = EMPLOYEES.find((e) => e.id === params.id)
    if (!employee) {
      return HttpResponse.json({ message: 'Servidor não encontrado' }, { status: 404 })
    }
    return HttpResponse.json({ data: employee })
  }),
]
