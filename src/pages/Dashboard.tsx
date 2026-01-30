import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Repeat, Zap} from 'lucide-react'
import { tradeService, Trade } from '../services/tradeService'
import { walletService, WalletBalance } from '../services/walletService'
import { marketService, MarketData } from '../services/marketService'
import {MarketCard} from "../components/MarketCard"
import  DashboardHero  from '../components/DashboardHero'
import { useAuth } from '../contexts/AuthContext'
import FundPasswordModal from '../components/FundPasswordModal'


const actionIcons: Record<string, JSX.Element> = {
  Deposit: <ArrowUp className="inline w-5 h-5 mr-2" />,
  Withdraw: <ArrowDown className="inline w-5 h-5 mr-2" />,
  Trade: <Zap className="inline w-5 h-5 mr-2" />,
  Demo: <Repeat className="inline w-5 h-5 mr-2" />,
};

export default function Dashboard() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
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
      const [tradesData, balancesData, marketDataData] = await Promise.all([
        tradeService.getUserTrades(),
        walletService.getBalances(),
        marketService.getAllMarketData(),
      ])
      setTrades(Array.isArray(tradesData) ? tradesData : [])
      setBalances(Array.isArray(balancesData) ? balancesData : [])
      setMarketData(Array.isArray(marketDataData) ? marketDataData.slice(0, 5) : [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const totalBalance = balances.reduce((s, b) => s + b.balance, 0)
  const lockedBalance = balances.reduce((s, b) => s + (b.locked || 0), 0)
  const availableBalance = totalBalance - lockedBalance

  const wonTrades = trades.filter(t => t.status === 'WON').length
  const lostTrades = trades.filter(t => t.status === 'LOST').length
  const totalTrades = trades.length
  const winRate = totalTrades ? (wonTrades / totalTrades) * 100 : 0
  const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0)
  const recentTrades = trades.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin h-14 w-14 rounded-full border-t-2 border-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0ff2,_#000_45%)] px-6 py-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className=' mb-20'>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Live trading performance</p>
        </div>
        <DashboardHero />

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 items-center my-20">


          <div className="text-left space-y-2">
            <p className="text-xs tracking-widest text-gray-400 text-semibold">AVAILABLE BALANCE</p>
            <p className="text-5xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
              {availableBalance.toFixed(2)} <span className="text-sm text-gray-400">USDT</span>
            </p>
            <p className="text-sm">Welcome back, <span className="text-yellow-600">natantamiru18@gmail.com</span></p>
          </div>
          <button className="py-2 px-8 text-center text-yellow-400 rounded-xl border-[1px] flex items-center gap-2 border-red-200 transition">
             <ArrowDown/> <span className="text-sm">Deposite</span>
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
        <div className=" my-20 relative">
          <div className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar">
            {marketData.map(m => (
              <div key={m.asset} className="min-w-[160px] flex-shrink-0">
                <MarketCard
                  asset={m.asset}
                  pair="Gold vs USD"
                  price={m.price}
                  change={m.change24h}
                />
              </div>
            ))}
          </div>
        </div>


        {/* ACTIONS */}
        <div className="grid grid-cols-4 gap-4 my-20">
          {['Deposit', 'Trade', 'Withdraw', 'Demo'].map(a => (
            <button
              key={a}
              className="flex items-center justify-center border-[1px] border-transparent py-4 rounded-xl hover:bg-yellow-400/10  hover:border-yellow-300 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition"
            >
              {actionIcons[a]}
              {a}
            </button>
          ))}
        </div>

        {/* LISTS */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* RECENT TRADES */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-cyan-300">Recent Trades</h2>
            {recentTrades.map(t => (
              <div key={t.id} className="flex justify-between px-4 py-3 border border-gray-700 rounded-lg bg-black/40">
                <div>
                  <p className="font-medium">{t.asset}</p>
                  <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p>{t.amount} USDT</p>
                  <p className={`text-xs ${t.status === 'WON' ? 'text-green-400' : t.status === 'LOST' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {t.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* TOP MARKETS */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-cyan-300">Top Markets</h2>
            {marketData.map(a => (
              <div key={a.asset} className="flex justify-between px-4 py-3 border border-gray-700 rounded-lg bg-black/40">
                <p>{a.asset}</p>
                <p className={a.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
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
