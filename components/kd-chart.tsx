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
      <div className="flex h-52 items-center justify-center rounded-xl border border-white/8 bg-[#0c1118] text-sm text-[#687588]">
        Aguardando seus dados
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-52 w-full">
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} stroke="#687588" />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={34} domain={[0, "auto"]} stroke="#687588" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Line dataKey="kd" type="monotone" stroke="var(--color-kd)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-kd)" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartContainer>
  )
}

export type { KDPoint }
