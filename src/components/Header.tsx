import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { walletService, WalletBalance } from '../services/walletService'
import { User } from 'lucide-react'

export default function Header() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balances = await walletService.getBalances()
        const usdtBalance = balances.find((b) => b.asset === 'USDT') || balances[0]
        setBalance(usdtBalance)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }
    fetchBalance()

    const interval = setInterval(fetchBalance, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <p className="text-sm text-gray-400">Available Balance</p>
            <p className="text-2xl font-bold text-white">
              {balance ? `${balance.available.toFixed(2)} ${balance.asset}` : 'Loading...'}
            </p>
          </div>
          {balance && balance.locked > 0 && (
            <div>
              <p className="text-sm text-gray-400">Locked</p>
              <p className="text-lg font-semibold text-yellow-500">
                {balance.locked.toFixed(2)} {balance.asset}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 px-4 py-2 bg-dark-700 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

