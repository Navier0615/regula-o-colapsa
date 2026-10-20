import type { FilaResultado } from '../state/selectors.ts'

interface Props {
  filas: readonly FilaResultado[]
}

export default function Ranking({ filas }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Clasificación final</caption>
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">#</th>
            <th scope="col" className="px-3 py-2 font-medium">Jugador</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Puntos</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">En rojo</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Energía<span className="hidden sm:inline"> final</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {filas.map((fila) => (
            <tr key={fila.nombre + fila.posicion} className={fila.posicion === 1 ? 'bg-sky-950/40' : ''}>
              <td className="px-3 py-2 font-semibold">{fila.posicion}</td>
              <td className="px-3 py-2">
                <span className="block font-semibold">{fila.nombre}</span>
                <span className="block text-xs text-slate-400">
                  {fila.colapsado ? `Colapsó en el turno ${fila.turnosJugados}` : 'Completó el día'}
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fila.puntaje}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fila.turnosEnRojo}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fila.energiaFinal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
