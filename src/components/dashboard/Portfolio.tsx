import { useEffect, useState } from 'react'
import { walletService, WalletBalance } from '../../services/walletService'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Portfolio() {
    const [balances, setBalances] = useState<WalletBalance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBalances()
    }, [])

    const fetchBalances = async () => {
        try {
            const data = await walletService.getBalances()
            // Filter out zero balances
            const active = data.filter(b => b.balance > 0)
            setBalances(active)
        } catch (error) {
            console.error('Failed to fetch portfolio', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="h-64 flex items-center justify-center text-gray-500">Loading portfolio...</div>

    if (balances.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
                Empty Portfolio
            </div>
        )
    }

    const data = balances.map(b => ({
        name: b.asset,
        value: b.balance
    }))
    return (
        <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#F3F4F6' }}
                            formatter={(value: number) => value.toFixed(4)}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-3">
                {balances.map((b, i) => (
                    <div key={b.asset} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-semibold text-gray-200">{b.asset}</span>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-gray-100">{b.balance.toFixed(4)}</div>
                            {(b.locked || 0) > 0 && <div className="text-xs text-gray-500">Locked: {(b.locked || 0).toFixed(4)}</div>}
                        </div>
                    </div>
                ))}
                {/* <div className="pt-4 border-t border-gray-700 mt-4">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. Total Value (USDT)</span>
                <span className="text-white font-bold">{totalValue.toFixed(2)}</span>
            </div>
        </div> */}
            </div>
        </div>
    )
}
