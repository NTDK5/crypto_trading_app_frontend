import { useState, useEffect } from 'react'
import { adminService } from '../services/adminService'
import { Save, AlertOctagon, Play, Pause } from 'lucide-react'

export default function AdminSettings() {
    const [config, setConfig] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [tradingPaused, setTradingPaused] = useState(false)

    const fetchConfig = async () => {
        setLoading(true)
        try {
            const data = await adminService.getSystemConfig()
            // Transform array of configs to object for easier handling if needed
            // Assuming API returns array of { key, value }
            const configMap = data.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value
                return acc
            }, {})
            setConfig(configMap)
            setTradingPaused(configMap['SPOT_TRADING_ENABLED'] === 'false')
        } catch (error) {
            console.error('Failed to fetch config:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    const handleTradingToggle = async () => {
        const action = tradingPaused ? 'resume' : 'pause'
        if (!window.confirm(`Are you sure you want to ${action} trading globally?`)) return

        try {
            if (tradingPaused) {
                await adminService.resumeTrading()
            } else {
                await adminService.pauseTrading()
            }
            fetchConfig() // Refresh state
        } catch (error) {
            console.error('Failed to toggle trading:', error)
            alert('Failed to update trading status')
        }
    }

    // Placeholder for fee updates - assumes keys exist
    const handleUpdateConfig = async (key: string, value: string) => {
        try {
            await adminService.updateSystemConfig(key, value)
            alert('Configuration updated')
            fetchConfig()
        } catch (error) {
            console.error('Failed to update config:', error)
            alert('Failed to update configuration')
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">System Settings</h1>

            {/* Critical Actions */}
            <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center">
                    <AlertOctagon className="w-5 h-5 mr-2" />
                    Emergency Controls
                </h2>

                <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div>
                        <h3 className="font-medium text-white">Spot Trading Status</h3>
                        <p className="text-sm text-gray-400">
                            {tradingPaused
                                ? 'Trading is currently PAUSED. Users cannot place new orders.'
                                : 'Trading is ACTIVE. Users can place orders normally.'}
                        </p>
                    </div>
                    <button
                        onClick={handleTradingToggle}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center transition-colors ${tradingPaused
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {tradingPaused ? (
                            <>
                                <Play className="w-4 h-4 mr-2" /> Resume Trading
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4 mr-2" /> Pause Trading
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Fees Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Fee Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigInput
                        label="Maker Fee (%)"
                        configKey="MAKER_FEE"
                        currentValue={config['MAKER_FEE'] || '0.1'}
                        onSave={handleUpdateConfig}
                    />
                    <ConfigInput
                        label="Taker Fee (%)"
                        configKey="TAKER_FEE"
                        currentValue={config['TAKER_FEE'] || '0.1'}
                        onSave={handleUpdateConfig}
                    />
                    <ConfigInput
                        label="Withdrawal Fee (USDT)"
                        configKey="WITHDRAWAL_FEE_USDT"
                        currentValue={config['WITHDRAWAL_FEE_USDT'] || '1.0'}
                        onSave={handleUpdateConfig}
                    />
                </div>
            </div>
        </div>
    )
}

function ConfigInput({ label, configKey, currentValue, onSave }: { label: string, configKey: string, currentValue: string, onSave: (k: string, v: string) => void }) {
    const [value, setValue] = useState(currentValue)
    const [dirty, setDirty] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
        setDirty(e.target.value !== currentValue)
    }

    const handleSave = () => {
        onSave(configKey, value)
        setDirty(false)
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="flex">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                    onClick={handleSave}
                    disabled={!dirty}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
