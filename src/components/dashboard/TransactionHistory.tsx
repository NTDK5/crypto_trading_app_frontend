import { useEffect, useState } from 'react'
import { walletService, Transaction } from '../../services/walletService'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle } from 'lucide-react'

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const data = await walletService.getTransactions()
            setTransactions(data)
        } catch (error) {
            console.error('Failed to fetch transactions', error)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (type: string) => {
        if (type.includes('DEPOSIT') || type.includes('PROFIT') || type.includes('SELL')) return <ArrowDownLeft className="w-5 h-5 text-green-400" />
        if (type.includes('WITHDRAWAL') || type.includes('INVESTMENT') || type.includes('BUY')) return <ArrowUpRight className="w-5 h-5 text-red-400" />
        return <RefreshCw className="w-5 h-5 text-gray-400" />
    }

    if (loading) return <div className="text-gray-400 text-sm">Loading history...</div>

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No transactions found</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-800">
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-2">
                                <div className="p-2 bg-gray-800 rounded-lg">
                                    {getIcon(tx.type)}
                                </div>
                                <span className="font-medium text-gray-200">{tx.type.replace(/_/g, ' ')}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{tx.asset}</td>
                            <td className={`py-3 px-4 text-right font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400">
                                {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-red-500/10 text-red-400'
                                    }`}>
                                    {tx.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
