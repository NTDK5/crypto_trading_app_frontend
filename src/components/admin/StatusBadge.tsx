import React from 'react'

type StatusVariant =
    | 'EXECUTED' | 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'FAILED' | 'REJECTED'
    | 'ENABLED' | 'DISABLED' | 'HEALTHY' | 'WARNING' | 'CRITICAL'
    | 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL'
    | 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'RISK_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN'
    | string

interface StatusBadgeProps {
    status: StatusVariant
    size?: 'sm' | 'md'
    dot?: boolean
}

const colorMap: Record<string, string> = {
    EXECUTED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    HEALTHY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ENABLED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',

    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    WARNING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',

    CANCELLED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    DISABLED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',

    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',

    BUY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    SELL: 'bg-red-500/15 text-red-400 border-red-500/30',

    DEPOSIT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    WITHDRAWAL: 'bg-orange-500/15 text-orange-400 border-orange-500/30',

    SUPER_ADMIN: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    ADMIN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    USER: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const dotColorMap: Record<string, string> = {
    EXECUTED: 'bg-emerald-400',
    COMPLETED: 'bg-emerald-400',
    ACTIVE: 'bg-emerald-400',
    HEALTHY: 'bg-emerald-400',
    ENABLED: 'bg-emerald-400',
    PENDING: 'bg-amber-400',
    WARNING: 'bg-amber-400',
    CANCELLED: 'bg-slate-400',
    DISABLED: 'bg-slate-400',
    FAILED: 'bg-red-400',
    REJECTED: 'bg-red-400',
    CRITICAL: 'bg-red-400',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', dot = false }) => {
    const color = colorMap[status?.toUpperCase()] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    const dotColor = dotColorMap[status?.toUpperCase()] || 'bg-slate-400'
    const sizeClass = size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'

    return (
        <span className={`inline-flex items-center gap-1.5 ${sizeClass} rounded-full border font-medium ${color}`}>
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
            {status}
        </span>
    )
}

export default StatusBadge
