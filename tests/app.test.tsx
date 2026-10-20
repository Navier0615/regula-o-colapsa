import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App.tsx'

describe('App', () => {
  it('muestra la pantalla de inicio', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Regula o Colapsa' })).toBeInTheDocument()
  })
})
