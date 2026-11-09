"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type KDPoint = {
  label: string
  kd: number
}

const chartConfig = {
  kd: {
    label: "K/D",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function KDChart({ data }: { data: KDPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-white/8 bg-[#0c1118] text-sm text-[#94a0b1]">
        Aguardando seus dados
      </div>
    )
  }

  return (
    <section aria-labelledby="kd-chart-title" aria-describedby="kd-chart-description" className="w-full">
      <h3 id="kd-chart-title" className="sr-only">Evolução do K/D</h3>
      <p id="kd-chart-description" className="sr-only">Valores de K/D por partida: {data.map((point) => `${point.label}: ${point.kd.toFixed(2)}`).join(', ')}.</p>
      <ChartContainer config={chartConfig} className="h-52 w-full" aria-hidden="true">
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} stroke="#94a0b1" label={{ value: "Partida", position: "insideBottom", offset: -2, fill: "#94a0b1" }} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={34} domain={[0, "auto"]} stroke="#94a0b1" label={{ value: "K/D", angle: -90, position: "insideLeft", fill: "#94a0b1" }} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Line dataKey="kd" name="K/D" type="monotone" stroke="var(--color-kd)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-kd)" }} activeDot={{ r: 5 }} />
      </LineChart>
      </ChartContainer>
      <details className="mt-4 rounded-lg border border-white/8 bg-[#0c1118] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[#c9d0dc]">Consultar dados do gráfico em tabela</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Dados usados no gráfico de evolução do K/D</caption><thead><tr className="border-b border-white/10 text-[#8995a5]"><th scope="col" className="py-2 pr-4">Partida ou data</th><th scope="col" className="py-2 pr-4">K/D</th></tr></thead><tbody>{data.map((point) => <tr key={point.label} className="border-b border-white/5 last:border-0"><th scope="row" className="py-2 pr-4 font-medium">{point.label}</th><td className="py-2">{point.kd.toFixed(2)}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  )
}

export type { KDPoint }
