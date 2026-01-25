import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    title: "Trade Cryptocurrencies with Confidence",
    subtitle:
      "Access 100+ trading pairs with advanced charting tools and real-time market data",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
  },
  {
    title: "Advanced Trading Tools",
    subtitle:
      "Professional indicators, risk controls, and lightning-fast execution",
    image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&q=80",
  },
  {
    title: "Secure & Reliable Platform",
    subtitle:
      "Industry-grade security with real-time monitoring and protection",
    image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
  },
]

export default function DashboardHero() {
  const [index, setIndex] = useState(0)

  const prev = () =>
    setIndex(i => (i === 0 ? slides.length - 1 : i - 1))
  const next = () =>
    setIndex(i => (i === slides.length - 1 ? 0 : i + 1))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-black via-zinc-900 to-black shadow-[0_0_40px_rgba(0,255,255,0.08)]">
      <div className="grid md:grid-cols-2 gap-6 items-center p-6 md:p-10">
        {/* IMAGE */}
        <div className="relative h-[220px] md:h-[260px] rounded-xl overflow-hidden bg-black/40">
          <img
            src={slides[index].image}
            alt={slides[index].title}
            className="h-full w-full object-cover opacity-90"
          />
        </div>

        {/* TEXT */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {slides[index].title}
          </h2>
          <p className="text-gray-400 max-w-xl">
            {slides[index].subtitle}
          </p>
        </div>
      </div>

      {/* ARROWS */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 bg-black/60 hover:bg-white/10 flex items-center justify-center"
      >
        <ChevronLeft />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/20 bg-black/60 hover:bg-white/10 flex items-center justify-center"
      >
        <ChevronRight />
      </button>

      {/* DOTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition ${
              i === index ? "bg-orange-400 w-5" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
