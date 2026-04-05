import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { NotFoundPage } from './not-found-page'

describe('NotFoundPage', () => {
  it('renders a 404 heading', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
  })

  it('renders a link back to home', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /início/i })).toBeInTheDocument()
  })
})
