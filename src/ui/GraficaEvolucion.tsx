import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { REGLAS_VISIBLES, type PuntoEvolucion, type Variable } from '../state/selectors.ts'

// Una mini gráfica por variable (múltiplos pequeños): cada una tiene una sola serie,
// así que la identidad la da el título y no el color. Los colores salen de los
// tokens del tema, por lo que funcionan en claro y oscuro.

const { rango, totalTurnos, variables, nombresVariables, intervalosZona, puntoDeAjuste } = REGLAS_VISIBLES
const verde = intervalosZona.find((tramo) => tramo.zona === 'verde')!
const TICKS_X = Array.from({ length: totalTurnos + 1 }, (_, i) => i)
const TICKS_Y = [rango.min, puntoDeAjuste, rango.max]
const EJE = { fill: 'var(--color-texto-tenue)', fontSize: 11 }

function MiniGrafica({ variable, evolucion }: { variable: Variable; evolucion: readonly PuntoEvolucion[] }) {
  const final = evolucion.at(-1)?.[variable]
  return (
    <div className="rounded-xl border border-borde p-3">
      <p className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{nombresVariables[variable]}</span>
        <span className="text-texto-tenue">
          final <span className="font-semibold text-texto tabular-nums">{final}</span>
        </span>
      </p>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...evolucion]} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
            <CartesianGrid stroke="var(--color-borde)" strokeDasharray="2 4" vertical={false} />
            <ReferenceArea y1={verde.min} y2={verde.max} fill="var(--color-zona-verde)" fillOpacity={0.15} />
            <XAxis
              dataKey="turno"
              type="number"
              domain={[0, totalTurnos]}
              ticks={TICKS_X}
              tick={EJE}
              stroke="var(--color-borde-fuerte)"
              tickLine={false}
            />
            <YAxis domain={[rango.min, rango.max]} ticks={TICKS_Y} tick={EJE} axisLine={false} tickLine={false} />
            <Tooltip
              labelFormatter={(turno) => (turno === 0 ? 'Inicio' : `Turno ${String(turno)}`)}
              formatter={(valor) => [String(valor), nombresVariables[variable]]}
              contentStyle={{
                background: 'var(--color-superficie)',
                border: '1px solid var(--color-borde)',
                borderRadius: 12,
              }}
              labelStyle={{ color: 'var(--color-texto)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--color-texto-suave)' }}
              cursor={{ stroke: 'var(--color-borde-fuerte)' }}
            />
            <Line
              dataKey={variable}
              name={nombresVariables[variable]}
              stroke="var(--color-acento)"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-superficie)', fill: 'var(--color-acento)' }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface Props {
  nombre: string
  evolucion: readonly PuntoEvolucion[]
}

export default function GraficaEvolucion({ nombre, evolucion }: Props) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm text-texto-tenue">
        Valores reales de {nombre} al final de cada turno (0 = inicio). Franja sombreada: zona verde.
      </figcaption>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {variables.map((variable) => (
          <MiniGrafica key={variable} variable={variable} evolucion={evolucion} />
        ))}
      </div>
      <details className="text-sm text-texto-suave">
        <summary className="min-h-11 cursor-pointer content-center text-enlace">Ver tabla de valores</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead className="text-texto-tenue">
              <tr>
                <th scope="col" className="py-1 pr-3 font-medium">Turno</th>
                {variables.map((variable) => (
                  <th key={variable} scope="col" className="py-1 pr-3 text-right font-medium">
                    {nombresVariables[variable]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evolucion.map((punto) => (
                <tr key={punto.turno}>
                  <td className="py-1 pr-3">{punto.turno === 0 ? 'Inicio' : punto.turno}</td>
                  {variables.map((variable) => (
                    <td key={variable} className="py-1 pr-3 text-right tabular-nums">
                      {punto[variable]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
