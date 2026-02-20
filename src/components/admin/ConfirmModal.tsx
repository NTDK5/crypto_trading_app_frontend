import React, { useState } from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    requireTyped?: string // if set, user must type this string to confirm
    loading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = 'Confirm', cancelText = 'Cancel',
    variant = 'danger', requireTyped, loading
}) => {
    const [typed, setTyped] = useState('')
    const [busy, setBusy] = useState(false)

    if (!isOpen) return null

    const variantStyles = {
        danger: { btn: 'bg-red-600 hover:bg-red-700 text-white', icon: '⚠️', bar: 'bg-red-600' },
        warning: { btn: 'bg-yellow-500 hover:bg-yellow-600 text-white', icon: '⚡', bar: 'bg-yellow-500' },
        info: { btn: 'bg-blue-600 hover:bg-blue-700 text-white', icon: 'ℹ️', bar: 'bg-blue-600' },
    }[variant]

    const canConfirm = !requireTyped || typed === requireTyped

    const handleConfirm = async () => {
        if (!canConfirm) return
        setBusy(true)
        try {
            await onConfirm()
            onClose()
        } finally {
            setBusy(false)
            setTyped('')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className={`h-1 ${variantStyles.bar}`} />
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{variantStyles.icon}</span>
                        <h3 className="text-white font-semibold text-lg">{title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-5">{message}</p>
                    {requireTyped && (
                        <div className="mb-5">
                            <p className="text-slate-500 text-xs mb-2">
                                Type <span className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{requireTyped}</span> to confirm
                            </p>
                            <input
                                type="text"
                                value={typed}
                                onChange={e => setTyped(e.target.value)}
                                placeholder={requireTyped}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                            />
                        </div>
                    )}
                    <div className="flex gap-3 justify-end">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!canConfirm || busy || loading}
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles.btn}`}
                        >
                            {(busy || loading) ? (
                                <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{confirmText}</span>
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal
