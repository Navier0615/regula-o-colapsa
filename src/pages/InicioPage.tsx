import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../state/gameStore.ts'
import { REGLAS_VISIBLES, selectCodigo, selectErrorDe, selectFase } from '../state/selectors.ts'
import Boton from '../ui/Boton.tsx'
import MensajeError from '../ui/MensajeError.tsx'
import { generarCodigo, normalizarCodigo } from '../utils/codigoPartida.ts'

const { jugadores: LIMITES } = REGLAS_VISIBLES
const CANTIDADES = Array.from({ length: LIMITES.max - LIMITES.min + 1 }, (_, i) => LIMITES.min + i)
const nombrePorDefecto = (i: number) => `Jugador ${i + 1}`

function PartidaEnCurso() {
  const fase = useGameStore(selectFase)
  const codigo = useGameStore(selectCodigo)
  const reiniciarPartida = useGameStore((s) => s.reiniciarPartida)
  if (fase === 'CONFIGURACION' || fase === 'FIN_DEL_DIA') {
    return null
  }
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-sky-500/40 bg-sky-950/30 p-4">
      <p>
        Tienes una partida en curso (código <span className="font-mono">{codigo}</span>).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Boton a="/partida">Continuar partida</Boton>
        <Boton variante="secundario" onClick={reiniciarPartida}>
          Abandonar partida
        </Boton>
      </div>
    </section>
  )
}

export default function InicioPage() {
  const [cantidad, setCantidad] = useState<number>(LIMITES.min)
  const [nombres, setNombres] = useState<string[]>(() => CANTIDADES.map((_, i) => nombrePorDefecto(i)))
  const [codigo, setCodigo] = useState(() => generarCodigo())
  const error = useGameStore(selectErrorDe('inicio'))
  const iniciarPartida = useGameStore((s) => s.iniciarPartida)
  const navigate = useNavigate()

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    const elegidos = nombres.slice(0, cantidad).map((n, i) => n.trim() || nombrePorDefecto(i))
    iniciarPartida(normalizarCodigo(codigo), elegidos)
    if (useGameStore.getState().controlError !== 'inicio') {
      navigate('/partida')
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 py-6">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Regula o Colapsa</h1>
        <p className="text-slate-300">
          Eres el centro de control de un organismo humano. Mantén temperatura, glucosa, hidratación y energía en
          equilibrio durante un día de {REGLAS_VISIBLES.totalTurnos} turnos.
        </p>
        <div>
          <Boton variante="fantasma" a="/instrucciones">
            ¿Cómo se juega?
          </Boton>
        </div>
      </header>

      <PartidaEnCurso />

      <form onSubmit={enviar} className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h2 className="text-xl font-bold">Nueva partida</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-slate-300">Jugadores</legend>
          <div className="grid grid-cols-4 gap-2">
            {CANTIDADES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={cantidad === n}
                onClick={() => setCantidad(n)}
                className={`min-h-11 rounded-xl text-sm font-semibold ring-1 transition-colors ${
                  cantidad === n ? 'bg-sky-400 text-slate-950 ring-sky-400' : 'bg-slate-800 ring-slate-700 hover:bg-slate-700'
                }`}
              >
                {n === LIMITES.min ? 'Solitario' : n}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            {cantidad === LIMITES.min
              ? `Meta: ${REGLAS_VISIBLES.puntajeVictoria} puntos o más sin colapsar.`
              : 'Se juega por turnos en este dispositivo. Gana el mayor puntaje.'}
          </p>
        </fieldset>

        <div className="flex flex-col gap-3">
          {Array.from({ length: cantidad }, (_, i) => (
            <label key={i} className="flex flex-col gap-1 text-sm font-medium text-slate-300">
              {cantidad === LIMITES.min ? 'Tu nombre' : `Nombre del jugador ${i + 1}`}
              <input
                value={nombres[i]}
                maxLength={20}
                onChange={(e) => setNombres((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
                className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-slate-100"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="codigo" className="text-sm font-medium text-slate-300">
            Código de partida
          </label>
          <div className="flex gap-2">
            <input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="ayuda-codigo"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-base tracking-wider text-slate-100 uppercase"
            />
            <Boton variante="secundario" onClick={() => setCodigo(generarCodigo())}>
              Nuevo
            </Boton>
          </div>
          <p id="ayuda-codigo" className="text-sm text-slate-400">
            Con el mismo código se juega la misma partida en cualquier dispositivo.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <MensajeError mensaje={error} />
          <Boton type="submit" anchoCompleto>
            Comenzar partida
          </Boton>
        </div>
      </form>
    </div>
  )
}
