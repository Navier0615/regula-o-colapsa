import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App.tsx'
import { ESTIMULOS } from '../../src/domain/config/estimulos.ts'
import { crearPartida } from '../../src/domain/engine/partida.ts'
import type { IdEstimulo, Valores } from '../../src/domain/types.ts'
import { useGameStore } from '../../src/state/gameStore.ts'

const TRANQUILO: IdEstimulo[] = Array.from({ length: 8 }, () => 'tranquilo')

/** Partida con estímulos y valores controlados, abierta en #/partida. */
function abrirPartida(nombres: string[], valores: Partial<Valores> = {}, secuencia = TRANQUILO) {
  const base = crearPartida('TGS-1234', nombres)
  useGameStore.setState({
    partida: {
      ...base,
      jugadores: base.jugadores.map((j) => ({
        ...j,
        valores: { ...j.valores, ...valores },
        secuenciaEstimulos: secuencia,
      })),
    },
  })
  window.location.hash = '#/partida'
  return render(<App />)
}

const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre })

beforeEach(() => {
  localStorage.clear()
  useGameStore.getState().reiniciarPartida()
})

describe('InicioPage', () => {
  it('muestra el título y crea una partida en solitario', () => {
    window.location.hash = '#/'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Regula o Colapsa' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Código de partida'), { target: { value: '0427' } })
    fireEvent.click(boton('Comenzar partida'))
    expect(useGameStore.getState().partida?.codigo).toBe('TGS-0427')
    expect(screen.getByRole('heading', { name: /Turno de/ })).toBeInTheDocument()
  })

  it('muestra el error del código junto al botón de comenzar', () => {
    window.location.hash = '#/'
    render(<App />)
    fireEvent.change(screen.getByLabelText('Código de partida'), { target: { value: 'abc' } })
    fireEvent.click(boton('Comenzar partida'))
    expect(screen.getByRole('alert')).toHaveTextContent(/Código de partida inválido/)
  })
})

describe('PantallaTurno', () => {
  it('en ESTIMULO muestra solo "Turno de <nombre>" y el botón para revelar', () => {
    abrirPartida(['Ana', 'Beto'], {}, ['calor', ...TRANQUILO.slice(1)])
    expect(screen.getByRole('heading', { name: 'Turno de Ana' })).toBeInTheDocument()
    expect(screen.queryByText(ESTIMULOS.calor.nombre)).not.toBeInTheDocument()
    expect(screen.queryByText('Sensores')).not.toBeInTheDocument()

    fireEvent.click(boton('Revelar estímulo'))
    expect(screen.getByText(ESTIMULOS.calor.nombre)).toBeInTheDocument()
    expect(screen.getAllByText(/^≈ \d+ ±1$/)).toHaveLength(4)
  })

  it('al pasar al siguiente jugador no muestra nada del anterior', () => {
    abrirPartida(['Ana', 'Beto'], {}, ['calor', ...TRANQUILO.slice(1)])
    fireEvent.click(boton('Revelar estímulo'))
    fireEvent.click(boton(/^Beber agua/))
    fireEvent.click(boton(/^Liberar insulina/))
    fireEvent.click(boton('Confirmar decisión'))
    expect(screen.getByText('Bucles de retroalimentación')).toBeInTheDocument()

    // Retroalimentación: zona final de cada variable con texto, sin valores numéricos.
    const estado = screen.getByRole('region', { name: 'Estado final del organismo' })
    const zonas = within(estado).getAllByRole('listitem')
    expect(zonas).toHaveLength(4)
    zonas.forEach((zona) => {
      expect(zona.textContent).toMatch(/verde|alerta|crisis/)
      expect(zona.textContent).not.toMatch(/\d/)
    })

    fireEvent.click(boton('Continuar'))

    expect(screen.getByRole('heading', { name: 'Turno de Beto' })).toBeInTheDocument()
    expect(screen.queryByText(ESTIMULOS.calor.nombre)).not.toBeInTheDocument()
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })

  it('afinar muestra "= N real" en la variable elegida', () => {
    abrirPartida(['Ana'])
    fireEvent.click(boton('Revelar estímulo'))
    fireEvent.click(boton('Afinar sensor de Glucosa (cuesta 1 de energía)'))
    expect(screen.getByText('= 5 real')).toBeInTheDocument()
    expect(screen.getByText('Sensor afinado')).toBeInTheDocument()
    expect(boton('Afinar sensor de Temperatura (cuesta 1 de energía)')).toBeDisabled()
  })

  it('con agotamiento muestra el síntoma y limita la selección a 1', () => {
    abrirPartida(['Ana'], { energia: 2 })
    fireEvent.click(boton('Revelar estímulo'))
    expect(screen.getByText('Tu organismo está agotado: solo puedes activar 1 efector')).toBeInTheDocument()
    expect(screen.getByText('Elegidas 0/1')).toBeInTheDocument()
    fireEvent.click(boton(/^Beber agua/))
    expect(screen.getByText('Elegidas 1/1')).toBeInTheDocument()
    const comer = boton(/^Comer/)
    expect(comer).toHaveAttribute('aria-disabled', 'true')
    expect(within(comer).getByText('Agotado: solo 1 efector')).toBeInTheDocument()
    expect(boton('Confirmar decisión')).toBeEnabled()
  })

  it('si afinar provoca agotamiento, el síntoma aparece y la selección se revalida', () => {
    abrirPartida(['Ana'], { energia: 3 })
    fireEvent.click(boton('Revelar estímulo'))
    fireEvent.click(boton(/^Beber agua/))
    fireEvent.click(boton(/^Comer/))
    expect(boton('Confirmar decisión')).toBeEnabled()

    fireEvent.click(boton('Afinar sensor de Temperatura (cuesta 1 de energía)'))
    // Síntoma en el aviso de los efectores y como motivo junto al botón de confirmar.
    expect(screen.getAllByText('Tu organismo está agotado: solo puedes activar 1 efector')).toHaveLength(2)
    expect(screen.queryByText(/≤/)).not.toBeInTheDocument()
    expect(within(boton(/^Sudar/)).getByText('Agotado: solo 1 efector')).toBeInTheDocument()
    const contador = screen.getByText('Elegidas 2/1')
    expect(contador).toHaveClass('bg-zona-roja-suave', 'text-zona-roja-texto')
    expect(screen.getByText('Tu organismo se agotó: suelta 1 carta')).toBeInTheDocument()

    // Al soltar una carta, el contador vuelve a estar completo y desaparece el aviso.
    fireEvent.click(boton(/^Comer/))
    expect(screen.getByText('Elegidas 1/1')).not.toHaveClass('bg-zona-roja-suave')
    expect(screen.queryByText(/suelta 1 carta/)).not.toBeInTheDocument()
    expect(boton('Confirmar decisión')).toBeEnabled()
    // Con agotamiento, Comer ya no se puede volver a elegir.
    fireEvent.click(boton(/^Comer/))
    expect(boton(/^Comer/)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Elegidas 1/1')).toBeInTheDocument()
  })

  it('con deshidratación la carta Sudar muestra "Temperatura −1 (deshidratado)"', () => {
    abrirPartida(['Ana'], { hidratacion: 3 })
    fireEvent.click(boton('Revelar estímulo'))
    const sudar = boton(/^Sudar/)
    expect(within(sudar).getByText(/Temperatura −1/)).toBeInTheDocument()
    expect(within(sudar).getByText('(deshidratado)')).toBeInTheDocument()
  })

  it('el error de selección se muestra junto a los efectores', () => {
    abrirPartida(['Ana'])
    fireEvent.click(boton('Revelar estímulo'))
    fireEvent.click(boton(/^Beber agua/))
    fireEvent.click(boton(/^Comer/))
    expect(boton(/^Sudar/)).toHaveAttribute('aria-disabled', 'true')
    // La UI deshabilita el tercer efector; se fuerza la acción para ver el error del store.
    act(() => useGameStore.getState().seleccionarEfector('sudar'))
    const efectores = screen.getByRole('region', { name: 'Efectores' })
    expect(within(efectores).getByRole('alert')).toHaveTextContent('No puedes activar más efectores en este turno.')
    expect(screen.getByRole('region', { name: 'Sensores' })).not.toContainElement(screen.getByRole('alert'))
  })
})

describe('CartaEfector', () => {
  const abrirDecision = (valores: Partial<Valores> = {}) => {
    abrirPartida(['Ana'], valores)
    fireEvent.click(boton('Revelar estímulo'))
  }

  it('cada carta es un botón con aria-pressed que se marca como "✓ Elegida"', () => {
    abrirDecision()
    const beber = boton(/^Beber agua/)
    expect(beber).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Elegidas 0/2')).toBeInTheDocument()

    fireEvent.click(beber)
    expect(boton(/^Beber agua/)).toHaveAttribute('aria-pressed', 'true')
    expect(within(boton(/^Beber agua/)).getByText('✓ Elegida')).toBeInTheDocument()
    expect(screen.getByText('Elegidas 1/2')).toBeInTheDocument()

    fireEvent.click(boton(/^Beber agua/))
    expect(boton(/^Beber agua/)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('✓ Elegida')).not.toBeInTheDocument()
  })

  it('muestra el efecto principal con ▲/▼ y los secundarios como "efecto secundario"', () => {
    abrirDecision()
    const sudar = boton(/^Sudar/)
    expect(within(sudar).getByText('▼ Temperatura −2')).toBeInTheDocument()
    expect(within(sudar).getByText('Hidratación −1')).toBeInTheDocument()
    expect(within(sudar).getByText('efecto secundario')).toBeInTheDocument()

    const comer = boton(/^Comer/)
    expect(within(comer).getByText('▲ Energía +1')).toBeInTheDocument()
    expect(within(comer).getAllByText('efecto secundario')).toHaveLength(2)
  })

  it('Descansar es una "carta doble" y bloquea a las demás al elegirla', () => {
    abrirDecision()
    const descansar = boton(/^Descansar/)
    expect(within(descansar).getByText('Carta doble')).toBeInTheDocument()

    fireEvent.click(descansar)
    expect(screen.getByText('Elegidas 2/2')).toBeInTheDocument()
    const beber = boton(/^Beber agua/)
    expect(beber).toHaveAttribute('aria-disabled', 'true')
    expect(within(beber).getByText('Descansar ocupa todo el turno')).toBeInTheDocument()
  })

  it('una carta no disponible no se puede seleccionar', () => {
    abrirDecision()
    fireEvent.click(boton(/^Beber agua/))
    fireEvent.click(boton(/^Comer/))
    const sudar = boton(/^Sudar/)
    expect(within(sudar).getByText('Ya elegiste 2 efectores')).toBeInTheDocument()

    fireEvent.click(sudar)
    expect(useGameStore.getState().efectoresSeleccionados).toEqual(['beber', 'comer'])
    expect(sudar).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
