import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowDown, Repeat, Zap } from 'lucide-react'

import { walletService, WalletBalance } from '../services/walletService'
import { marketService, MarketData } from '../services/marketService'
import { MarketCard } from '../components/MarketCard'
import DashboardHero from '../components/DashboardHero'
import { useAuth } from '../contexts/AuthContext'
import FundPasswordModal from '../components/FundPasswordModal'
import TransactionHistory from '../components/dashboard/TransactionHistory'
import Portfolio from '../components/dashboard/Portfolio'


const actionIcons: Record<string, JSX.Element> = {
  Deposit: <ArrowUp className="inline w-5 h-5 mr-2" />,
  Withdraw: <ArrowDown className="inline w-5 h-5 mr-2" />,
  Trade: <Zap className="inline w-5 h-5 mr-2" />,
  Demo: <Repeat className="inline w-5 h-5 mr-2" />,
};

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [balances, setBalances] = useState<WalletBalance[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [showFundPasswordModal, setShowFundPasswordModal] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  // Show fund password modal if user hasn't set it
  useEffect(() => {
    if (user && !user.isFundPasswordSet) {
      setShowFundPasswordModal(true)
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch market data separately so it renders even if user data fails
      try {
        const marketDataData = await marketService.getAllMarketData()
        console.log('Market data received:', marketDataData)
        if (Array.isArray(marketDataData)) {
          const sorted = [...marketDataData].sort((a, b) => b.change24h - a.change24h)
          setMarketData(sorted.slice(0, 8))
        } else {
          console.warn('Market data is not an array:', marketDataData)
          setMarketData([])
        }
      } catch (marketError) {
        console.error('Failed to fetch market data:', marketError)
      }

      // Fetch user data
      try {
        const balancesData = await walletService.getBalances()
        setBalances(Array.isArray(balancesData) ? balancesData : [])
      } catch (userError) {
        console.error('Failed to fetch user data:', userError)
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0)
  const lockedBalance = balances.reduce((s, b) => s + (b.locked || 0), 0)
  const availableBalance = totalBalance - lockedBalance

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0ff2,_#000_45%)] px-6 py-8 text-white">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Page title skeleton */}
          <div className="space-y-3 mt-8">
            <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-white/5 rounded-lg animate-pulse" />
          </div>

          {/* Hero skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 h-40 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          </div>

          {/* Balance + actions skeleton */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 items-center my-10">
            <div className="space-y-3 w-full md:w-auto">
              <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
              <div className="h-10 w-52 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-white/10 rounded-xl animate-pulse" />
          </div>

          {/* Markets ticker skeleton */}
          <div className="my-10">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-w-[200px] h-32 rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Lists skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, colIdx) => (
              <div key={colIdx} className="space-y-4">
                <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                {Array.from({ length: 4 }).map((__, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="h-14 bg-white/5 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0ff2,_#000_45%)] px-6 py-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-10 lg:mb-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">Live trading performance</p>
        </div>
        <DashboardHero />

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 items-start my-6 md:my-10 lg:my-20">

          <div className="text-left space-y-2 w-full md:w-auto">
            <p className="text-xs tracking-widest text-gray-400 font-semibold">
              AVAILABLE BALANCE
            </p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
              {availableBalance.toFixed(2)} <span className="text-xs md:text-sm text-gray-400">USDT</span>
            </p>
            <p className="text-xs md:text-sm">
              Welcome back,
              <span className="text-yellow-600">
                {' '}
                {user?.email}
              </span>
            </p>
          </div>
          <button className="py-2 px-6 md:px-8 text-center text-yellow-400 rounded-xl border border-red-200 flex items-center gap-2 transition hover:bg-yellow-400/10 w-full md:w-auto justify-center">
            <ArrowDown />
            <span className="text-sm">Deposit</span>
          </button>
        </div>

        {/* STATS – FLAT NEON STRIP */}
        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            label: 'TOTAL BALANCE',
            value: `${totalBalance.toFixed(2)} USDT`,
            icon: <DollarSign />,
          }, {
            label: 'PROFIT / LOSS',
            value: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} USDT`,
            icon: totalProfit >= 0 ? <TrendingUp /> : <TrendingDown />,
            color: totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
          }, {
            label: 'WIN RATE',
            value: `${winRate.toFixed(1)}%`,
            sub: `${wonTrades}W / ${lostTrades}L`,
            icon: <Activity />,
          }, {
            label: 'TOTAL TRADES',
            value: totalTrades,
            icon: <Activity />,
          }].map((s, i) => (
            <div key={i} className="relative px-5 py-4 border border-cyan-500/30 rounded-xl bg-black/40 backdrop-blur hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] transition">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <p className="text-xs text-gray-400 tracking-widest">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color || ''}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-gray-500">{s.sub}</p>}
            </div>
          ))}
        </div> */}

        {/* MARKETS – NEON TICKER */}
        <div className="my-6 md:my-10 lg:my-20 relative">
          <h2 className="text-lg md:text-xl font-semibold text-cyan-300 mb-4 px-2">Top Markets</h2>
          <div className="flex gap-3 md:gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
            {marketData.map(m => (
              <div key={m.asset} className="min-w-[240px] md:min-w-[260px] flex-shrink-0 snap-start">
                <MarketCard
                  asset={m.asset}
                  pair={`${m.asset}/USDT`}
                  price={m.price}
                  change={m.change24h}
                />
              </div>
            ))}
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 my-6 md:my-10 lg:my-20">
          {['Deposit', 'Trade', 'Withdraw', 'Demo'].map(a => (
            <button
              key={a}
              onClick={() => {
                if (a === 'Trade') navigate('/app/trade')
                // For SPA navigation use useNavigate if available, but window.location works too
              }}
              className="flex items-center justify-center border-[1px] border-transparent py-3 md:py-4 rounded-xl hover:bg-yellow-400/10  hover:border-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition text-sm md:text-base"
            >
              {actionIcons[a]}
              {a}
            </button>
          ))}
        </div>

        {/* NEW SECTIONS: PORTFOLIO & HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
              <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6 overflow-hidden">
              <TransactionHistory />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white px-2">Portfolio Allocation</h2>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6 h-full">
              <Portfolio />
            </div>
          </div>
        </div>

        {/* LISTS */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-10">
          {/* TOP MARKETS */}
          <div className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-cyan-300">Top Markets</h2>
            {marketData
              .slice()
              .sort((a, b) => b.change24h - a.change24h)
              .map(a => (
                <div
                  key={a.asset}
                  className="flex justify-between px-3 md:px-4 py-3 border border-gray-700 rounded-lg bg-black/40"
                >
                  <p className="text-sm md:text-base">{a.asset}</p>
                  <p className={a.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {a.change24h >= 0 ? '+' : ''}
                    {a.change24h.toFixed(2)}%
                  </p>
                </div>
              ))}
          </div>

        </div>
      </div>


      {/* Fund Password Modal */}
      <FundPasswordModal
        isOpen={showFundPasswordModal}
        onClose={() => {
          // Don't allow closing if fund password is not set
          if (!user?.isFundPasswordSet) {
            return
          }
          setShowFundPasswordModal(false)
        }}
        onSuccess={() => {
          setShowFundPasswordModal(false)
        }}
      />
    </div>
  )
}
