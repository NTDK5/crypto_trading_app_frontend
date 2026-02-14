import { useState, useEffect } from 'react'
import { adminService, AdminTransaction } from '../services/adminService'
import { Check, X,  ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export default function AdminTransactions() {
    const [activeTab, setActiveTab] = useState<'DEPOSITS' | 'WITHDRAWALS' | 'HISTORY'>('DEPOSITS')
    const [transactions, setTransactions] = useState<AdminTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            let data: AdminTransaction[] = []
            if (activeTab === 'DEPOSITS') {
                data = await adminService.getPendingDeposits()
            } else if (activeTab === 'WITHDRAWALS') {
                data = await adminService.getPendingWithdrawals()
            } else {
                // TODO: Implement history endpoint or reuse pending for now
                // For now, let's just show empty or mock history?
                // Actually, backend has getTransactionHistory but we need to wire it up in service properly.
                // Assuming adminService doesn't have it fully typed for filters yet, I'll skip History for now or just clear list.
                data = []
            }
            setTransactions(data)
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [activeTab])

    const handleApprove = async (tx: AdminTransaction) => {
        if (!window.confirm('Are you sure you want to approve this transaction?')) return

        setProcessing(tx.id)
        try {
            if (tx.type === 'DEPOSIT') {
                await adminService.approveDeposit(tx.id)
            } else if (tx.type === 'WITHDRAWAL') {
                // Ask for TxHash for withdrawals often
                const txHash = window.prompt('Enter Transaction Hash (optional):') || undefined
                await adminService.approveWithdrawal(tx.id, txHash)
            }
            fetchTransactions()
        } catch (error) {
            console.error('Failed to approve transaction:', error)
            alert('Failed to approve transaction')
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (tx: AdminTransaction) => {
        const reason = window.prompt('Enter reason for rejection:')
        if (!reason) return

        setProcessing(tx.id)
        try {
            if (tx.type === 'DEPOSIT') {
                await adminService.rejectDeposit(tx.id, reason)
            } else if (tx.type === 'WITHDRAWAL') {
                await adminService.rejectWithdrawal(tx.id, reason)
            }
            fetchTransactions()
        } catch (error) {
            console.error('Failed to reject transaction:', error)
            alert('Failed to reject transaction')
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Transaction Management</h1>
            </div>

            <div className="flex space-x-1 bg-gray-900 p-1 rounded-xl mb-6 w-fit border border-gray-800">
                <TabButton
                    active={activeTab === 'DEPOSITS'}
                    onClick={() => setActiveTab('DEPOSITS')}
                    icon={ArrowDownLeft}
                    label="Pending Deposits"
                />
                <TabButton
                    active={activeTab === 'WITHDRAWALS'}
                    onClick={() => setActiveTab('WITHDRAWALS')}
                    icon={ArrowUpRight}
                    label="Pending Withdrawals"
                />
                {/* <TabButton 
          active={activeTab === 'HISTORY'} 
          onClick={() => setActiveTab('HISTORY')} 
          icon={History} 
          label="History" 
        /> */}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700">
                                <th className="px-6 py-4 font-medium text-gray-400">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-400">User</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Type</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Amount</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Address / Details</th>
                                <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No pending transactions found</td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tx.user?.email || tx.userId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'DEPOSIT'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {tx.amount} {tx.asset}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                                            {tx.address || tx.txHash || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleApprove(tx)}
                                                    disabled={!!processing}
                                                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(tx)}
                                                    disabled={!!processing}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
        >
            <Icon className={`w-4 h-4 mr-2 ${active ? 'text-cyan-400' : ''}`} />
            {label}
        </button>
    )
}
