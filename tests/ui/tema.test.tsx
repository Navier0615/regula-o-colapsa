import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.tsx'
import { CLAVE_TEMA, temaInicial } from '../../src/ui/tema.ts'

/** Simula prefers-color-scheme (jsdom no implementa matchMedia). */
function sistemaOscuro(oscuro: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({
      matches: oscuro && consulta.includes('dark'),
      media: consulta,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = '#/'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tema', () => {
  it('sin elección guardada sigue prefers-color-scheme', () => {
    sistemaOscuro(true)
    expect(temaInicial()).toBe('oscuro')
    sistemaOscuro(false)
    expect(temaInicial()).toBe('claro')
  })

  it('la elección guardada tiene prioridad sobre el sistema', () => {
    sistemaOscuro(true)
    localStorage.setItem(CLAVE_TEMA, 'claro')
    expect(temaInicial()).toBe('claro')
  })

  it('el botón alterna claro/oscuro y lo guarda en localStorage', () => {
    sistemaOscuro(false)
    render(<App />)
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro')

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro')
  })

  it('funciona sin matchMedia (tema claro por defecto)', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(temaInicial()).toBe('claro')
  })
})
