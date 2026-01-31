import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { MarketSparkline } from "./MarketSparkLine"
import {  useMemo } from "react"


type Props = {
  asset: string
  pair: string
  price: number
  change: number
}

export function MarketCard({ asset, pair, price, change }: Props) {
  const up = change >= 0
  const sparkData = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) =>
        price + Math.sin(i / 2) * price * 0.004 + (Math.random() - 0.5) * price * 0.002
      ),
    [price]
  )
  
  return (
    <div
      className="
        relative w-[260px] shrink-0
        rounded-2xl
        bg-gradient-to-b from-[#1b2230]/80 to-[#121826]/80
        backdrop-blur-xl
        border border-white/10
        px-5 py-4
        hover:border-cyan-400/40
        hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]
        transition
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{asset}</p>
          <p className="text-xs text-gray-400">{pair}</p>
        </div>

        <span
          className={`
            flex items-center gap-1 text-xs px-2 py-1 rounded-full
            ${up
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"}
          `}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>

      {/* Sparkline placeholder */}
      {/* <div className="h-10 mb-3 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent" /> */}

      <div className="mb-3">
        <MarketSparkline data={sparkData} up={up} />
      </div>
      {/* Price */}
      <div>
        <p className="text-xl font-bold text-white">
          {price.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">
          ≈ {price.toLocaleString()} USD
        </p>
      </div>
    </div>
  )
}


