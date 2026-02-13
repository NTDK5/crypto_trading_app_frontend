import { useState, useEffect } from 'react'
import { adminService, AdminUser } from '../services/adminService'
import { Search, MoreVertical, Shield, ShieldAlert, BadgeInfo, Lock, Unlock } from 'lucide-react'

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { users: data, pagination } = await adminService.getUsers(page, 10, search)
            setUsers(data)
            setTotalPages(pagination.totalPages)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 500)
        return () => clearTimeout(timeout)
    }, [page, search])

    const handleFreezeToggle = async (user: AdminUser) => {
        if (!window.confirm(`Are you sure you want to ${user.tradingFrozen ? 'unfreeze' : 'freeze'} trading for this user?`)) return

        try {
            if (user.tradingFrozen) {
                await adminService.unfreezeUserTrading(user.id)
            } else {
                await adminService.freezeUserTrading(user.id, 'Admin action')
            }
            fetchUsers() // Refresh list
        } catch (error) {
            console.error('Failed to update user status:', error)
            alert('Failed to update user status')
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 w-64"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700">
                                <th className="px-6 py-4 font-medium text-gray-400">User</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Role</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Status</th>
                                <th className="px-6 py-4 font-medium text-gray-400">KYC</th>
                                <th className="px-6 py-4 font-medium text-gray-400">Joined</th>
                                <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="h-6 w-6 rounded-full border-t-2 border-b-2 border-red-500 animate-spin mr-3"></div>
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'SUPER_ADMIN' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <ShieldAlert className="w-3 h-3 mr-1" />
                                                    Super Admin
                                                </span>
                                            ) : user.role === 'ADMIN' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.tradingFrozen ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    Frozen
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                                    <Unlock className="w-3 h-3 mr-1" />
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.kycStatus === 'VERIFIED'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : user.kycStatus === 'PENDING'
                                                        ? 'bg-yellow-500/10 text-yellow-500'
                                                        : 'bg-gray-700 text-gray-400'
                                                }`}>
                                                {user.kycStatus || 'UNVERIFIED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleFreezeToggle(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.tradingFrozen
                                                            ? 'text-green-500 hover:bg-green-500/10'
                                                            : 'text-red-500 hover:bg-red-500/10'
                                                        }`}
                                                    title={user.tradingFrozen ? "Unfreeze Trading" : "Freeze Trading"}
                                                >
                                                    {user.tradingFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <span className="text-gray-400">Page {page} of {totalPages || 1}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
