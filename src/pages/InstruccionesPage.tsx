import type { ReactNode } from 'react'
import { CATALOGO_EFECTORES, REGLAS_VISIBLES } from '../state/selectors.ts'
import Boton from '../ui/Boton.tsx'
import { ESTILOS_ZONA, formatearCambio, formatearDelta } from '../ui/formato.ts'

const R = REGLAS_VISIBLES
const [ruidoInicial, ruidoFinal] = R.ruido
const verde = R.intervalosZona.find((t) => t.zona === 'verde')!

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  )
}

const FASES: { nombre: string; detalle: string }[] = [
  {
    nombre: 'Estímulo',
    detalle: 'El entorno perturba tu organismo (calor, ayuno, ejercicio…). Cada jugador recibe los mismos estímulos en distinto orden.',
  },
  {
    nombre: 'Lectura',
    detalle: `Ves lecturas con ruido de los sensores, no los valores reales: ±${ruidoInicial?.margen} en los turnos 1–${ruidoInicial?.hastaTurno} y ±${ruidoFinal?.margen} después. Puedes afinar un sensor por turno para ver su valor real (cuesta ${R.costoAfinar} de energía).`,
  },
  {
    nombre: 'Decisión',
    detalle: `Activas ${R.efectoresPorTurno} efectores distintos, o Descansar, que ocupa todo el turno.`,
  },
  {
    nombre: 'Retroalimentación',
    detalle: 'Se aplican los efectores y los bucles de retroalimentación de tu organismo.',
  },
  {
    nombre: 'Puntuación',
    detalle: 'Cada variable puntúa según la zona en que termina el turno.',
  },
]

export default function InstruccionesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <Boton variante="fantasma" a="/" className="self-start">
          ← Volver al inicio
        </Boton>
        <h1 className="text-3xl font-extrabold">Cómo se juega</h1>
      </header>

      <Seccion titulo="Objetivo">
        <p className="text-slate-300">
          Eres el centro de control de un organismo. Mantén {R.variables.map((v) => R.nombresVariables[v].toLowerCase()).join(', ')}{' '}
          cerca de su punto de ajuste ({R.puntoDeAjuste}, en una escala de {R.rango.min} a {R.rango.max}) durante{' '}
          {R.totalTurnos} turnos: mañana, tarde y noche.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {R.intervalosZona.map((tramo) => (
            <li
              key={`${tramo.zona}-${tramo.min}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${ESTILOS_ZONA[tramo.zona].borde}`}
            >
              <span aria-hidden="true" className={`size-2.5 rounded-full ${ESTILOS_ZONA[tramo.zona].punto}`} />
              {tramo.min}–{tramo.max}: {R.etiquetasZona[tramo.zona]}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="El turno en 5 fases">
        <ol className="flex flex-col gap-3">
          {FASES.map((fase, i) => (
            <li key={fase.nombre} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-400 font-bold text-slate-950">
                {i + 1}
              </span>
              <p className="text-slate-300">
                <strong className="text-slate-100">{fase.nombre}.</strong> {fase.detalle}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-slate-400">
          En multijugador, todos juegan el turno N antes de pasar al N+1. Antes de cada turno aparece “Turno de
          &lt;nombre&gt;” para pasar el dispositivo sin ver la jugada anterior.
        </p>
      </Seccion>

      <Seccion titulo="Efectores">
        <ul className="grid gap-2 sm:grid-cols-2">
          {CATALOGO_EFECTORES.map((efector) => (
            <li key={efector.id} className="rounded-xl border border-slate-800 p-3">
              <p className="font-semibold">{efector.nombre}</p>
              <p className="text-sm text-slate-300">
                {efector.cambios.map(formatearCambio).join(' · ')}
                {efector.ocupaTurnoCompleto && ` · ocupa los ${R.efectoresPorTurno} efectores`}
              </p>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-1 text-sm text-slate-300">
          <li>
            <strong className="text-slate-100">Agotamiento</strong> (energía ≤ {R.agotamiento.umbral}): solo puedes
            activar {R.agotamiento.efectoresPermitidos} efector (o Descansar).
          </li>
          <li>
            <strong className="text-slate-100">Deshidratación</strong> (hidratación ≤ {R.deshidratacion.umbral}):
            sudar baja la temperatura solo {formatearDelta(R.deshidratacion.efectoSudarTemperatura)}.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Bucles de retroalimentación">
        <p className="text-slate-300">
          <strong className="text-amber-300">Bucles positivos</strong> amplifican el desequilibrio:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            Fiebre: si la temperatura llega a {R.fiebre.umbral} o más, sube {formatearDelta(R.fiebre.incremento)} más.
          </li>
          <li>
            Hipoglucemia: si la glucosa queda en {R.hipoglucemia.umbral} o menos, la energía cambia{' '}
            {formatearDelta(R.hipoglucemia.efectoEnergia)}.
          </li>
          <li>Deshidratación y agotamiento al final del turno limitan tus opciones en el siguiente.</li>
        </ul>
        <p className="text-slate-300">
          <strong className="text-emerald-300">Bucles negativos</strong> son la regulación exitosa: una variable que el
          estímulo sacó de la zona verde y tú devolviste a ella.
        </p>
      </Seccion>

      <Seccion titulo="Puntuación">
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          <li>
            Por cada variable al final del turno: verde {formatearDelta(R.puntosPorZona.verde)}, alerta{' '}
            {formatearDelta(R.puntosPorZona.amarilla)}, crisis {formatearDelta(R.puntosPorZona.roja)}.
          </li>
          <li>
            Bonificación {formatearDelta(R.bonificacion)} por cada variable que regulaste de vuelta a la zona verde (
            {verde.min}–{verde.max}).
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Colapso y victoria">
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          <li>
            Si alguna variable termina un turno en {R.valoresColapso.join(' o ')}, tu organismo colapsa. En solitario
            la partida termina; en multijugador quedas fuera y conservas tus puntos.
          </li>
          <li>
            <strong className="text-slate-100">Solitario:</strong> ganas con {R.puntajeVictoria} puntos o más sin
            colapsar.
          </li>
          <li>
            <strong className="text-slate-100">Multijugador:</strong> gana el mayor puntaje. Desempate: menos
            variables en crisis a lo largo del día; luego más energía final.
          </li>
        </ul>
      </Seccion>

      <Boton a="/" className="self-start">
        Jugar
      </Boton>
    </div>
  )
}
