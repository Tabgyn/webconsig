import { http, HttpResponse } from 'msw'
import { EMPLOYEES } from '../fixtures/employees'

export const employeeHandlers = [
  http.get('/api/employees', () => {
    return HttpResponse.json({ data: EMPLOYEES, total: EMPLOYEES.length })
  }),
]
