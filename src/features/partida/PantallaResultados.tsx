import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../../state/gameStore.ts'
import { REGLAS_VISIBLES, selectModo, selectResultados, selectVictoriaSolitario } from '../../state/selectors.ts'
import Boton from '../../ui/Boton.tsx'
import Ranking from '../../ui/Ranking.tsx'

// Recharts solo se descarga al llegar a los resultados.
const GraficaEvolucion = lazy(() => import('../../ui/GraficaEvolucion.tsx'))

export default function PantallaResultados() {
  const filas = useGameStore(selectResultados)
  const modo = useGameStore(selectModo)
  const victoria = useGameStore(selectVictoriaSolitario)
  const reiniciarPartida = useGameStore((s) => s.reiniciarPartida)
  const navigate = useNavigate()

  if (!filas) {
    return null
  }
  const ganador = filas[0]

  const nuevaPartida = () => {
    reiniciarPartida()
    navigate('/')
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-texto-tenue">Fin del día</p>
        {modo === 'solitario' && ganador ? (
          <div
            className={`rounded-2xl border p-4 ${victoria ? 'border-zona-verde/50 bg-zona-verde-suave' : 'border-zona-roja/50 bg-zona-roja-suave'}`}
          >
            <h2 className="text-2xl font-bold">{victoria ? '¡Victoria!' : 'Derrota'}</h2>
            <p className="text-texto-suave">
              {ganador.colapsado
                ? `Tu organismo colapsó en el turno ${ganador.turnosJugados} con ${ganador.puntaje} puntos.`
                : `Terminaste el día con ${ganador.puntaje} puntos (meta: ${REGLAS_VISIBLES.puntajeVictoria}).`}
            </p>
          </div>
        ) : (
          ganador && (
            <div className="rounded-2xl border border-acento/50 bg-acento-suave p-4">
              <h2 className="text-2xl font-bold">Gana {ganador.nombre}</h2>
              <p className="text-texto-suave">
                {ganador.puntaje} puntos. Desempate: menos variables en rojo y luego más energía final.
              </p>
            </div>
          )
        )}
      </header>

      {modo === 'multijugador' && <Ranking filas={filas} />}

      <section aria-labelledby="titulo-evolucion" className="flex flex-col gap-4">
        <h3 id="titulo-evolucion" className="text-lg font-semibold">
          Evolución de las variables
        </h3>
        <div className="flex flex-col gap-4">
          {filas.map((fila) => (
            <article key={fila.nombre + fila.posicion} className="rounded-2xl border border-borde bg-superficie p-4">
              <h4 className="mb-2 font-semibold">{fila.nombre}</h4>
              <Suspense fallback={<p className="h-40 text-sm text-texto-tenue">Cargando gráfica…</p>}>
                <GraficaEvolucion nombre={fila.nombre} evolucion={fila.evolucion} />
              </Suspense>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Boton onClick={nuevaPartida}>Nueva partida</Boton>
        <Boton variante="secundario" a="/instrucciones">
          Ver instrucciones
        </Boton>
      </div>
    </section>
  )
}
