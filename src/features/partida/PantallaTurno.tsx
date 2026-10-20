import { useGameStore } from '../../state/gameStore.ts'
import {
  REGLAS_VISIBLES,
  selectCambiosEstimulo,
  selectCartasEfectores,
  selectEfectoresPermitidos,
  selectErrorDe,
  selectEstimuloActual,
  selectFase,
  selectMedidores,
  selectNombreFranja,
  selectNombreJugadorActivo,
  selectPuedeAfinar,
  selectPuntajeJugadorActivo,
  selectSintomas,
  selectTurno,
  selectValidacionDecision,
} from '../../state/selectors.ts'
import Boton from '../../ui/Boton.tsx'
import BotonAfinarSensor from '../../ui/BotonAfinarSensor.tsx'
import CartaEfector from '../../ui/CartaEfector.tsx'
import CartaEstimulo from '../../ui/CartaEstimulo.tsx'
import EncabezadoTurno from '../../ui/EncabezadoTurno.tsx'
import MedidorVariable from '../../ui/MedidorVariable.tsx'
import MensajeError from '../../ui/MensajeError.tsx'

const { totalTurnos, rango, intervalosZona, costoAfinar, efectoresPorTurno } = REGLAS_VISIBLES

/** Fase ESTIMULO: pantalla para pasar el dispositivo. No muestra nada del jugador anterior. */
function CambioDeJugador() {
  const nombre = useGameStore(selectNombreJugadorActivo)
  const turno = useGameStore(selectTurno)
  const franja = useGameStore(selectNombreFranja)
  const error = useGameStore(selectErrorDe('estimulo'))
  const revelarEstimulo = useGameStore((s) => s.revelarEstimulo)

  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
      <p className="text-sm text-slate-400">
        Turno {turno} de {totalTurnos} · {franja}
      </p>
      <h2 className="text-3xl font-bold">Turno de {nombre}</h2>
      <p className="text-slate-300">
        Pasa el dispositivo a {nombre}. El estímulo y las lecturas solo se muestran al revelarlo.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Boton anchoCompleto onClick={revelarEstimulo}>
          Revelar estímulo
        </Boton>
        <MensajeError mensaje={error} />
      </div>
    </section>
  )
}

function Sintomas() {
  const sintomas = useGameStore(selectSintomas)
  return (
    <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
      {sintomas?.agotamiento && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm font-medium text-amber-200">
          Tu organismo está agotado: solo puedes activar 1 efector
        </p>
      )}
      {sintomas?.deshidratacion && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm font-medium text-amber-200">
          Tu organismo está deshidratado: sudar enfría menos
        </p>
      )}
    </div>
  )
}

function Sensores() {
  const medidores = useGameStore(selectMedidores)
  const puedeAfinar = useGameStore(selectPuedeAfinar)
  const error = useGameStore(selectErrorDe('sensores'))
  const afinarSensor = useGameStore((s) => s.afinarSensor)

  return (
    <section aria-labelledby="titulo-sensores" className="flex flex-col gap-3">
      <div>
        <h3 id="titulo-sensores" className="text-lg font-semibold">
          Sensores
        </h3>
        <p className="text-sm text-slate-400">
          Las lecturas tienen ruido. Puedes afinar un sensor por turno para ver su valor real; cuesta{' '}
          {costoAfinar} de energía.
        </p>
      </div>
      <MensajeError mensaje={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        {medidores?.map((medidor) => (
          <MedidorVariable key={medidor.variable} medidor={medidor} rango={rango} intervalos={intervalosZona}>
            <BotonAfinarSensor
              nombreVariable={medidor.nombre}
              afinada={medidor.afinada}
              puedeAfinar={puedeAfinar}
              costo={costoAfinar}
              onAfinar={() => afinarSensor(medidor.variable)}
            />
          </MedidorVariable>
        ))}
      </div>
    </section>
  )
}

function Decision() {
  const cartas = useGameStore(selectCartasEfectores)
  const permitidos = useGameStore(selectEfectoresPermitidos)
  const validacion = useGameStore(selectValidacionDecision)
  const fase = useGameStore(selectFase)
  const errorEfectores = useGameStore(selectErrorDe('efectores'))
  const errorDecision = useGameStore(selectErrorDe('decision'))
  const seleccionarEfector = useGameStore((s) => s.seleccionarEfector)
  const confirmarDecision = useGameStore((s) => s.confirmarDecision)

  const instruccion =
    permitidos === 1
      ? 'Elige 1 efector (o Descansar).'
      : `Elige ${permitidos ?? efectoresPorTurno} efectores distintos (o Descansar).`
  const motivo = fase === 'LECTURA' ? 'Aún no elegiste efectores.' : validacion?.valida === false ? validacion.motivo : null

  return (
    <section aria-labelledby="titulo-efectores" className="flex flex-col gap-3">
      <div>
        <h3 id="titulo-efectores" className="text-lg font-semibold">
          Efectores
        </h3>
        <p className="text-sm text-slate-400">{instruccion}</p>
      </div>
      <Sintomas />
      <MensajeError mensaje={errorEfectores} />
      <div className="grid gap-2 sm:grid-cols-2">
        {cartas?.map((carta) => (
          <CartaEfector
            key={carta.id}
            efector={carta}
            efectoresPorTurno={efectoresPorTurno}
            onAlternar={() => seleccionarEfector(carta.id)}
          />
        ))}
      </div>
      <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        <MensajeError mensaje={errorDecision} />
        {motivo && <p className="text-sm text-slate-400">{motivo}</p>}
        <Boton anchoCompleto onClick={confirmarDecision} disabled={validacion?.valida !== true}>
          Confirmar decisión
        </Boton>
      </div>
    </section>
  )
}

export default function PantallaTurno() {
  const fase = useGameStore(selectFase)
  const nombre = useGameStore(selectNombreJugadorActivo)
  const turno = useGameStore(selectTurno)
  const franja = useGameStore(selectNombreFranja)
  const puntaje = useGameStore(selectPuntajeJugadorActivo)
  const estimulo = useGameStore(selectEstimuloActual)
  const cambios = useGameStore(selectCambiosEstimulo)

  if (fase === 'ESTIMULO') {
    return <CambioDeJugador />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-4">
        <EncabezadoTurno
          turno={turno ?? 1}
          totalTurnos={totalTurnos}
          franja={franja ?? ''}
          nombre={nombre ?? ''}
          puntaje={puntaje ?? 0}
        />
        {estimulo && cambios && <CartaEstimulo nombre={estimulo.nombre} cambios={cambios} />}
        <Sensores />
      </div>
      <Decision />
    </div>
  )
}
