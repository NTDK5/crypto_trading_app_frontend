import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminService, AdminStats } from '../services/adminService'
import { Users, Activity, CreditCard, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getDashboardStats()
                setStats(data)
            } catch (error) {
                console.error('Failed to fetch admin stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-red-500 animate-spin" />
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-8">
                Hello, {user?.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Active Users"
                    value={stats?.activeUsers || 0}
                    icon={Activity}
                    color="green"
                />
                <StatsCard
                    title="Pending Deposits"
                    value={stats?.pendingDeposits || 0}
                    icon={CreditCard}
                    color="yellow"
                />
                <StatsCard
                    title="Pending Withdrawals"
                    value={stats?.pendingWithdrawals || 0}
                    icon={AlertTriangle}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">System Status</h2>
                    <div className="space-y-4 text-gray-400">
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span>Database Connection</span>
                            <span className="text-green-400 px-2 py-1 bg-green-500/10 rounded text-xs font-semibold">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span>Redis Cache</span>
                            <span className="text-yellow-400 px-2 py-1 bg-yellow-500/10 rounded text-xs font-semibold">Connecting...</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span>Total Volume</span>
                            <span className="text-white font-mono">${stats?.totalVolume?.toLocaleString() || '0.00'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">Recent Alerts</h2>
                    <div className="space-y-3">
                        {/* Placeholder alerts since API doesn't return them yet */}
                        <div className="p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-lg text-sm text-yellow-500 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span>Redis connection warning</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
    const colors: Record<string, string> = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
    }

    return (
        <div className={`p-6 rounded-xl border ${colors[color].split(' ')[2]} bg-gray-900/50 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">{title}</h3>
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    )
}
