import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable } from './data-table'

interface Row { name: string; value: number }
const col = createColumnHelper<Row>()
const columns = [
  col.accessor('name', { header: 'Nome' }),
  col.accessor('value', { header: 'Valor' }),
]
const data: Row[] = [
  { name: 'Alpha', value: 1 },
  { name: 'Beta',  value: 2 },
  { name: 'Gamma', value: 3 },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Valor')).toBeInTheDocument()
  })

  it('renders all rows', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
  })

  it('filters rows by search input', async () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="Buscar..." />)
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'Beta')
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    render(<DataTable columns={columns} data={data} searchPlaceholder="Buscar..." />)
    await userEvent.type(screen.getByPlaceholderText('Buscar...'), 'ZZZZ')
    expect(screen.getByText('Nenhum resultado encontrado.')).toBeInTheDocument()
  })
})
