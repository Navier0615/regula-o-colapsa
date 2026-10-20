import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { REGLAS_VISIBLES, type PuntoEvolucion, type Variable } from '../state/selectors.ts'

// Colores categóricos fijos por variable (paleta validada para fondo oscuro).
const COLORES: Readonly<Record<Variable, string>> = {
  temperatura: '#d95926',
  glucosa: '#3987e5',
  hidratacion: '#199e70',
  energia: '#c98500',
}

const { rango, totalTurnos, variables, nombresVariables, intervalosZona } = REGLAS_VISIBLES
const verde = intervalosZona.find((tramo) => tramo.zona === 'verde')!
const TICKS_Y = Array.from({ length: rango.max / 2 + 1 }, (_, i) => rango.min + i * 2)

interface Props {
  nombre: string
  evolucion: readonly PuntoEvolucion[]
}

export default function GraficaEvolucion({ nombre, evolucion }: Props) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm text-slate-400">
        Valores reales de {nombre} al final de cada turno (franja sombreada: zona verde)
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...evolucion]} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="2 4" vertical={false} />
            <ReferenceArea y1={verde.min} y2={verde.max} fill="#10b981" fillOpacity={0.12} ifOverflow="extendDomain" />
            <XAxis
              dataKey="turno"
              type="number"
              domain={[0, totalTurnos]}
              ticks={Array.from({ length: totalTurnos + 1 }, (_, i) => i)}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              domain={[rango.min, rango.max]}
              ticks={TICKS_Y}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(turno) => (turno === 0 ? 'Inicio' : `Turno ${String(turno)}`)}
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ stroke: '#64748b' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
            {variables.map((variable) => (
              <Line
                key={variable}
                dataKey={variable}
                name={nombresVariables[variable]}
                stroke={COLORES[variable]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: '#0f172a', fill: COLORES[variable] }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm text-slate-300">
        <summary className="min-h-11 cursor-pointer content-center text-sky-300">Ver tabla de valores</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead className="text-slate-400">
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
