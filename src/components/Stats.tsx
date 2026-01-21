import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'

interface Stat {
  icon: React.ReactNode
  value: string
  label: string
  suffix?: string
  prefix?: string
}

const stats: Stat[] = [
  { icon: <Users className="w-8 h-8" />, value: '100000', label: 'Active Users', suffix: '+' },
  { icon: <DollarSign className="w-8 h-8" />, value: '5000000000', label: 'Volume Traded', prefix: '$', suffix: '+' },
  { icon: <TrendingUp className="w-8 h-8" />, value: '500', label: 'Supported Coins', suffix: '+' },
  { icon: <Zap className="w-8 h-8" />, value: '99.9', label: 'Uptime', suffix: '%' },
]

function useCountUp(end: number, duration: number = 2000, prefix: string = '', suffix: string = '') {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    let animationFrameId: number
    
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentCount = Math.floor(easeOutQuart * end)
      setCount(currentCount)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isVisible, end, duration])

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return { count, ref, displayValue: prefix + formatNumber(count) + suffix }
}

function StatCard({ stat }: { stat: Stat }) {
  const { ref, displayValue } = useCountUp(
    parseFloat(stat.value),
    2000,
    stat.prefix || '',
    stat.suffix || ''
  )

  return (
    <div
      ref={ref}
      className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
      
      <div className="relative z-10">
        <div className="inline-flex p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
          <div className="text-cyan-400">{stat.icon}</div>
        </div>
        
        <div className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {displayValue}
        </div>
        
        <div className="text-gray-400 font-medium">{stat.label}</div>
      </div>
    </div>
  )
}

export default function Stats() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Platform Statistics
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of traders and investors already using our platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  )
}

