import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatCPF,
  formatCNPJ,
  formatPercentage,
  formatCompetence,
} from './formatters'

describe('formatCurrency', () => {
  it('formats a number as BRL currency', () => {
    expect(formatCurrency(1234.56)).toContain('1.234,56')
  })
  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })
})

describe('formatDate', () => {
  it('formats ISO date as dd/mm/yyyy', () => {
    expect(formatDate('2026-04-03')).toBe('03/04/2026')
  })
})

describe('formatCPF', () => {
  it('adds punctuation to 11-digit CPF', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })
})

describe('formatCNPJ', () => {
  it('adds punctuation to 14-digit CNPJ', () => {
    expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95')
  })
})

describe('formatPercentage', () => {
  it('formats rate with comma decimal', () => {
    expect(formatPercentage(1.5)).toBe('1,50%')
  })
})

describe('formatCompetence', () => {
  it('converts YYYY-MM to MM/YYYY', () => {
    expect(formatCompetence('2026-03')).toBe('03/2026')
  })
})
