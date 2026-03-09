import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Save, RefreshCw, Power, Lock, Wrench } from 'lucide-react'
import { adminService } from '../services/adminService'
import ConfirmModal from '../components/admin/ConfirmModal'
import { StatusBadge } from '../components/admin/StatusBadge'

interface ConfigItem { key: string; value: string; category: string; description?: string }

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT']

interface KillSwitch {
    id: 'pause' | 'resume' | 'lock-withdrawals'
    label: string
    description: string
    icon: any
    variant: 'danger' | 'warning' | 'info'
    confirmPhrase: string
    action: () => Promise<void>
}

export default function AdminConfig() {
    const [loading, setLoading] = useState(true)
    const [spreadInputs, setSpreadInputs] = useState<Record<string, string>>({})
    const [feeInput, setFeeInput] = useState('')
    const [saving, setSaving] = useState<string | null>(null)
    const [confirmKS, setConfirmKS] = useState<KillSwitch | null>(null)
    const [ksReason, setKsReason] = useState('')
    const [tradingEnabled, setTradingEnabled] = useState<boolean | null>(null)
    const [withdrawalsEnabled, setWithdrawalsEnabled] = useState<boolean | null>(null)
    const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [depositAddresses, setDepositAddresses] = useState<Record<string, string>>({
        USDT: 'THhtmuzTKrVuM1u7eLvvXBLBbwyLa7DyLG',
        BTC: 'bc1q03gathn45qxuqlarql5t433j23t5547l7vnvnj',
        ETH: '0x53ac263378767af828034C93442D8Fd18EA1E8e3',
    })
    const [depositEnabled, setDepositEnabled] = useState<Record<string, boolean>>({
        USDT: true,
        BTC: true,
        ETH: true,
    })

    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

    const fetchConfigs = useCallback(async () => {
        setLoading(true)
        try {
            const [configs, metrics] = await Promise.allSettled([
                adminService.getSystemConfig(),
                adminService.getDashboardMetrics(),
            ])
            if (configs.status === 'fulfilled') {
                const cfgList = configs.value || []
                // Pre-populate spread inputs from config
                const spreadMap: Record<string, string> = {}
                    ; cfgList.forEach((c: ConfigItem) => {
                        if (c.key.includes('spread') || c.category === 'SPREAD') {
                            const sym = c.key.replace('spread_', '').replace('_', '/')
                            spreadMap[sym] = c.value
                        }
                    })
                setSpreadInputs(spreadMap)
                const feeConfig = cfgList.find((c: ConfigItem) => c.key === 'default_fee')
                if (feeConfig) setFeeInput(feeConfig.value)

                // Resolve system statuses from config if not in metrics
                const wEnabled = cfgList.find((c: ConfigItem) => c.key === 'PLATFORM_WITHDRAWALS_ENABLED')
                if (wEnabled) setWithdrawalsEnabled(wEnabled.value === 'true')

                const mMode = cfgList.find((c: ConfigItem) => c.key === 'MAINTENANCE_MODE_ENABLED')
                if (mMode) setMaintenanceMode(mMode.value === 'true')

                // Deposit address and toggle configs
                const nextAddresses: Record<string, string> = {
                    USDT: depositAddresses.USDT,
                    BTC: depositAddresses.BTC,
                    ETH: depositAddresses.ETH,
                }
                const nextEnabled: Record<string, boolean> = {
                    USDT: depositEnabled.USDT,
                    BTC: depositEnabled.BTC,
                    ETH: depositEnabled.ETH,
                }

                cfgList.forEach((c: ConfigItem) => {
                    if (c.key === 'DEPOSIT_USDT_ADDRESS') nextAddresses.USDT = c.value
                    if (c.key === 'DEPOSIT_BTC_ADDRESS') nextAddresses.BTC = c.value
                    if (c.key === 'DEPOSIT_ETH_ADDRESS') nextAddresses.ETH = c.value
                    if (c.key === 'DEPOSIT_USDT_ENABLED') nextEnabled.USDT = c.value === 'true'
                    if (c.key === 'DEPOSIT_BTC_ENABLED') nextEnabled.BTC = c.value === 'true'
                    if (c.key === 'DEPOSIT_ETH_ENABLED') nextEnabled.ETH = c.value === 'true'
                })

                setDepositAddresses(nextAddresses)
                setDepositEnabled(nextEnabled)
            }
            if (metrics.status === 'fulfilled') {
                setTradingEnabled(metrics.value.systemStatus?.tradingEnabled ?? true)
                if (withdrawalsEnabled === null) setWithdrawalsEnabled(metrics.value.systemStatus?.withdrawalsEnabled ?? true)
            }
        } catch { }
        finally { setLoading(false) }
    }, [withdrawalsEnabled])

    useEffect(() => { fetchConfigs() }, [fetchConfigs])

    const handleUpdateFee = async () => {
        setSaving('fee')
        try {
            await adminService.updateFee(parseFloat(feeInput))
            showToast('Fee updated successfully')
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to update fee', false)
        } finally { setSaving(null) }
    }

    const handleUpdateSpread = async (symbol: string) => {
        setSaving(`spread-${symbol}`)
        try {
            const spread = parseFloat(spreadInputs[symbol] || '0')
            await adminService.updateSpread(symbol, spread)
            showToast(`Spread for ${symbol} updated`)
        } catch (e: any) {
            showToast(e?.response?.data?.message || 'Failed to update spread', false)
        } finally { setSaving(null) }
    }

    const handleSaveDepositConfig = async (asset: 'USDT' | 'BTC' | 'ETH') => {
        setSaving(`deposit-${asset}`)
        try {
            const address = depositAddresses[asset]
            const enabled = depositEnabled[asset]
            await Promise.all([
                adminService.updateSystemConfig(`DEPOSIT_${asset}_ADDRESS`, address, 'PAYMENTS'),
                adminService.updateSystemConfig(`DEPOSIT_${asset}_ENABLED`, enabled ? 'true' : 'false', 'PAYMENTS'),
            ])
            await fetchConfigs()
            showToast(`Deposit config for ${asset} saved`)
        } catch (e: any) {
            showToast(e?.response?.data?.message || `Failed to save ${asset} deposit config`, false)
        } finally {
            setSaving(null)
        }
    }

    const killSwitches: KillSwitch[] = [
        {
            id: 'pause', label: tradingEnabled ? 'Pause Trading' : 'Resume Trading',
            description: tradingEnabled
                ? 'Immediately halt all new trade execution platform-wide. Existing orders will not be processed.'
                : 'Resume normal trading operations. All order types will be enabled.',
            icon: tradingEnabled ? Power : Power,
            variant: tradingEnabled ? 'danger' : 'info',
            confirmPhrase: 'CONFIRM',
            action: async () => {
                if (tradingEnabled) {
                    await adminService.pauseTrading(ksReason || 'Admin action')
                } else {
                    await adminService.resumeTrading()
                }
                await fetchConfigs()
            }
        },
        {
            id: 'resume', // reused as toggle
            label: withdrawalsEnabled ? 'Lock Withdrawals' : 'Unlock Withdrawals',
            description: withdrawalsEnabled
                ? 'Prevent all users from initiating new withdrawal requests. Processing of pending ones will be halted.'
                : 'Allow users to withdraw funds from their wallets.',
            icon: Lock,
            variant: withdrawalsEnabled ? 'warning' : 'info',
            confirmPhrase: 'CONFIRM',
            action: async () => {
                await adminService.toggleWithdrawals(!withdrawalsEnabled, ksReason || 'Admin action')
                await fetchConfigs()
            }
        },
        {
            id: 'lock-withdrawals', // reused as toggle
            label: maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance',
            description: maintenanceMode
                ? 'Take the platform back online. Users will be able to access all features.'
                : 'Put the platform into maintenance mode. Only administrators will have access.',
            icon: Wrench,
            variant: maintenanceMode ? 'info' : 'danger',
            confirmPhrase: 'CONFIRM',
            action: async () => {
                await adminService.toggleMaintenance(!maintenanceMode, ksReason || 'Admin action')
                await fetchConfigs()
            }
        }
    ]

    return (
        <div className="p-8">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border ${toast.ok ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Config</h1>
                    <p className="text-slate-500 text-sm mt-1">Platform-wide settings, kill switches, and fee management</p>
                </div>
                <button onClick={fetchConfigs} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Kill Switches */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" /> Emergency Controls
                </h2>
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5 space-y-4">
                    <p className="text-xs text-red-400/70">These controls affect the entire platform. All actions are logged and audited.</p>

                    {/* Trading Kill Switch */}
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tradingEnabled ? 'bg-red-500/15 border border-red-500/20' : 'bg-emerald-500/15 border border-emerald-500/20'}`}>
                                <Power size={16} className={tradingEnabled ? 'text-red-400' : 'text-emerald-400'} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Platform Trading</p>
                                <p className="text-xs text-slate-500">Halt or resume all trade execution</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={tradingEnabled ? 'ACTIVE' : 'DISABLED'} dot />
                            <button
                                onClick={() => setConfirmKS(killSwitches[0])}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-w-[140px] ${tradingEnabled
                                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                                    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'}`}>
                                {tradingEnabled ? 'Pause Trading' : 'Resume Trading'}
                            </button>
                        </div>
                    </div>

                    {/* Withdrawal Lock Switch */}
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${withdrawalsEnabled ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-red-500/15 border border-red-500/20'}`}>
                                <Lock size={16} className={withdrawalsEnabled ? 'text-amber-400' : 'text-red-400'} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Withdrawal Lock</p>
                                <p className="text-xs text-slate-500">Prevent or allow asset withdrawals</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={withdrawalsEnabled ? 'ACTIVE' : 'LOCKED'} dot />
                            <button
                                onClick={() => setConfirmKS(killSwitches[1])}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-w-[140px] ${withdrawalsEnabled
                                    ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20'
                                    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'}`}>
                                {withdrawalsEnabled ? 'Lock Withdrawals' : 'Unlock Withdrawals'}
                            </button>
                        </div>
                    </div>

                    {/* Maintenance Switch */}
                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${maintenanceMode ? 'bg-red-500/15 border border-red-500/20' : 'bg-slate-500/15 border border-slate-500/20'}`}>
                                <Wrench size={16} className={maintenanceMode ? 'text-red-400' : 'text-slate-400'} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Maintenance Mode</p>
                                <p className="text-xs text-slate-500">Restrict platform access to admins only</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={maintenanceMode ? 'MAINTENANCE' : 'ONLINE'} dot />
                            <button
                                onClick={() => setConfirmKS(killSwitches[2])}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-w-[140px] ${maintenanceMode
                                    ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20'
                                    : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'}`}>
                                {maintenanceMode ? 'End Maintenance' : 'Start Maintenance'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Fee */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Trading Fees</h2>
                <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
                    <div className="flex items-center gap-4 max-w-sm">
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1.5 block">Default Trading Fee (%)</label>
                            <input
                                type="number" step="0.01" min="0" max="5"
                                value={feeInput} onChange={e => setFeeInput(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                placeholder="e.g. 0.1"
                            />
                        </div>
                        <button onClick={handleUpdateFee} disabled={saving === 'fee'}
                            className="flex items-center gap-2 px-4 py-2 mt-5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
                            <Save size={14} /> {saving === 'fee' ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Deposit Methods */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Deposit Methods
                </h2>
                <div className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-4">
                    {(['USDT', 'BTC', 'ETH'] as const).map(asset => (
                        <div key={asset} className="flex flex-col md:flex-row md:items-end gap-4 border-b border-white/5 last:border-0 pb-4 last:pb-0">
                            <div className="flex-1">
                                <label className="text-xs text-slate-500 mb-1.5 block">
                                    {asset} Deposit Address
                                </label>
                                <input
                                    type="text"
                                    value={depositAddresses[asset]}
                                    onChange={e => setDepositAddresses(prev => ({ ...prev, [asset]: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                    placeholder={`Enter ${asset} deposit address`}
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    This address is shown to users on the wallet deposit screen.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={depositEnabled[asset]}
                                        onChange={e =>
                                            setDepositEnabled(prev => ({ ...prev, [asset]: e.target.checked }))
                                        }
                                        className="rounded border-white/20 bg-transparent"
                                    />
                                    Enable {asset} deposits
                                </label>
                                <button
                                    onClick={() => handleSaveDepositConfig(asset)}
                                    disabled={saving === `deposit-${asset}`}
                                    className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                                >
                                    <Save size={12} /> {saving === `deposit-${asset}` ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Per-Symbol Spreads */}
            <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Per-Symbol Spreads</h2>
                <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trading Pair</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Spread (%)</th>
                                <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SYMBOLS.map(sym => (
                                <tr key={sym} className="border-b border-white/[0.04] last:border-0">
                                    <td className="px-4 py-3 text-xs font-medium text-white">{sym}</td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number" step="0.01" min="0" max="10"
                                            value={spreadInputs[sym] || ''}
                                            onChange={e => setSpreadInputs(prev => ({ ...prev, [sym]: e.target.value }))}
                                            placeholder="e.g. 0.2"
                                            className="w-28 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleUpdateSpread(sym)} disabled={saving === `spread-${sym}`}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded transition-colors disabled:opacity-50">
                                            <Save size={11} /> {saving === `spread-${sym}` ? 'Saving…' : 'Update'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Kill Switch Confirm Modal */}
            {confirmKS && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" onClick={() => { setConfirmKS(null); setKsReason('') }} />
                    <div className="relative bg-[#1a1f2e] border border-red-500/20 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-white font-semibold">{confirmKS.label}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{confirmKS.description}</p>
                        <div className="mb-4">
                            <label className="text-xs text-slate-500 mb-1.5 block">Reason for this action</label>
                            <input value={ksReason} onChange={e => setKsReason(e.target.value)}
                                placeholder="Describe why you are doing this…"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/30"
                            />
                        </div>
                        <p className="text-xs text-slate-600 mb-4">
                            Type <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">CONFIRM</span> to proceed
                        </p>
                        {/* Embedded confirm */}
                        <ConfirmModal
                            isOpen={true}
                            onClose={() => { setConfirmKS(null); setKsReason('') }}
                            onConfirm={confirmKS.action}
                            title=""
                            message=""
                            confirmText={confirmKS.label}
                            variant={confirmKS.variant}
                            requireTyped="CONFIRM"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
