import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders "Ativo" for active consignment status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })
  it('renders "Pendente" for pending status', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })
  it('renders "Cancelado" for cancelled status', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })
  it('renders "Encerrado" for finished status', () => {
    render(<StatusBadge status="finished" />)
    expect(screen.getByText('Encerrado')).toBeInTheDocument()
  })
  it('renders "Solicitada" for requested portability status', () => {
    render(<StatusBadge status="requested" />)
    expect(screen.getByText('Solicitada')).toBeInTheDocument()
  })
  it('renders "Processado" for processed deduction', () => {
    render(<StatusBadge status="processed" />)
    expect(screen.getByText('Processado')).toBeInTheDocument()
  })
})
