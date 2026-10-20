import { Link } from 'react-router'
import PantallaResultados from '../features/partida/PantallaResultados.tsx'
import PantallaRetroalimentacion from '../features/partida/PantallaRetroalimentacion.tsx'
import PantallaTurno from '../features/partida/PantallaTurno.tsx'
import { useGameStore } from '../state/gameStore.ts'
import { selectCodigo, selectFase } from '../state/selectors.ts'
import Boton from '../ui/Boton.tsx'

function Pantalla() {
  const fase = useGameStore(selectFase)
  switch (fase) {
    case 'CONFIGURACION':
      return (
        <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
          <h2 className="text-2xl font-bold">No hay una partida en curso</h2>
          <Boton a="/">Crear una partida</Boton>
        </section>
      )
    case 'ESTIMULO':
    case 'LECTURA':
    case 'DECISION':
      return <PantallaTurno />
    case 'RETROALIMENTACION':
      return <PantallaRetroalimentacion />
    case 'FIN_DEL_DIA':
      return <PantallaResultados />
  }
}

export default function PartidaPage() {
  const codigo = useGameStore(selectCodigo)
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <Link to="/" className="flex min-h-11 items-center font-bold text-slate-100">
          Regula o Colapsa
        </Link>
        {codigo && (
          <p className="text-sm text-slate-400">
            Código <span className="font-mono text-slate-200">{codigo}</span>
          </p>
        )}
      </nav>
      <Pantalla />
    </div>
  )
}
