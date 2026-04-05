import { describe, it, expect } from 'vitest'
import { buildCan } from './permissions'

describe('buildCan - representative', () => {
  const can = buildCan('representative')
  it('can view consignments', () => expect(can('view', 'consignment')).toBe(true))
  it('can create consignments', () => expect(can('create', 'consignment')).toBe(true))
  it('cannot approve consignments', () => expect(can('approve', 'consignment')).toBe(false))
  it('cannot access employees', () => expect(can('view', 'employees')).toBe(false))
  it('cannot access audit', () => expect(can('view', 'audit')).toBe(false))
})

describe('buildCan - employee', () => {
  const can = buildCan('employee')
  it('can view own consignments', () => expect(can('view', 'consignment')).toBe(true))
  it('cannot create consignments', () => expect(can('create', 'consignment')).toBe(false))
  it('cannot view portability', () => expect(can('view', 'portability')).toBe(false))
  it('cannot request outstanding balance', () => expect(can('request', 'outstanding-balance')).toBe(false))
})

describe('buildCan - hr_manager', () => {
  const can = buildCan('hr_manager')
  it('can approve consignments', () => expect(can('approve', 'consignment')).toBe(true))
  it('cannot create consignments', () => expect(can('create', 'consignment')).toBe(false))
  it('can view employees', () => expect(can('view', 'employees')).toBe(true))
  it('cannot access institutions', () => expect(can('view', 'institutions')).toBe(false))
})

describe('buildCan - admin', () => {
  const can = buildCan('admin')
  it('can do everything', () => {
    expect(can('view', 'audit')).toBe(true)
    expect(can('delete', 'users')).toBe(true)
    expect(can('create', 'consignment')).toBe(true)
  })
})
