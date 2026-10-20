import { useGameStore } from '../../state/gameStore.ts'
import { selectErrorDe, selectModo, selectResumenTurno } from '../../state/selectors.ts'
import Boton from '../../ui/Boton.tsx'
import MensajeError from '../../ui/MensajeError.tsx'
import RegistroBucles from '../../ui/RegistroBucles.tsx'
import { formatearDelta } from '../../ui/formato.ts'

export default function PantallaRetroalimentacion() {
  const resumen = useGameStore(selectResumenTurno)
  const modo = useGameStore(selectModo)
  const error = useGameStore(selectErrorDe('continuar'))
  const continuar = useGameStore((s) => s.continuar)

  if (!resumen) {
    return null
  }
  const { puntuacion } = resumen

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5">
      <header>
        <p className="text-sm text-slate-400">Retroalimentación · Turno {resumen.turno}</p>
        <h2 className="text-2xl font-bold">{resumen.nombreJugador}</h2>
      </header>

      {resumen.colapso && (
        <div role="alert" className="rounded-2xl border border-rose-500/50 bg-rose-950/50 p-4">
          <p className="text-lg font-bold text-rose-200">Tu organismo colapsó</p>
          <p className="text-sm text-rose-200/80">
            {modo === 'solitario'
              ? 'Una variable llegó a un extremo. La partida termina aquí.'
              : 'Una variable llegó a un extremo. Quedas fuera de la partida y conservas tus puntos.'}
          </p>
        </div>
      )}

      <dl className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-400">Estímulo</dt>
          <dd className="font-semibold">{resumen.estimulo}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Sensor afinado</dt>
          <dd className="font-semibold">{resumen.afinado ?? 'Ninguno'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Efectores</dt>
          <dd className="font-semibold">{resumen.efectores.join(' + ')}</dd>
        </div>
      </dl>

      <section aria-labelledby="titulo-bucles" className="flex flex-col gap-2">
        <h3 id="titulo-bucles" className="text-lg font-semibold">
          Bucles de retroalimentación
        </h3>
        <RegistroBucles bucles={resumen.bucles} />
      </section>

      <section
        aria-labelledby="titulo-puntos"
        className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
      >
        <div>
          <h3 id="titulo-puntos" className="text-sm text-slate-400">
            Puntos del turno
          </h3>
          <p className="text-3xl font-bold tabular-nums">{formatearDelta(puntuacion.total)}</p>
          <p className="text-sm text-slate-400">
            Zonas {puntuacion.base} · bonificación por regulación {puntuacion.bonificacion}
          </p>
        </div>
        <p className="text-sm text-slate-300">
          Total acumulado: <span className="text-lg font-semibold text-slate-100">{resumen.puntajeAcumulado}</span>
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <MensajeError mensaje={error} />
        <Boton anchoCompleto onClick={continuar}>
          Continuar
        </Boton>
      </div>
    </section>
  )
}
