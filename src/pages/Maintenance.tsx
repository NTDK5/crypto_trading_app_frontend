import React, { useEffect } from 'react'
import { Wrench, ShieldCheck, Clock, RefreshCw } from 'lucide-react'

const Maintenance = () => {
    const [countdown, setCountdown] = React.useState(60)

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    window.location.reload()
                    return 60
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4 font-sans selection:bg-cyan-500/30">
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Animated Icon Container */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-3xl blur-2xl animate-pulse" />
                    <div className="relative bg-black/40 border border-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl">
                        <Wrench className="w-16 h-16 text-cyan-400 animate-bounce" />
                    </div>
                </div>

                {/* Messaging */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                        System Under <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Maintenance</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                        We're currently performing scheduled upgrades to enhance your trading experience. We'll be back shortly.
                    </p>
                </div>

                {/* Reassurance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-white font-bold mb-1">Funds are Safe</h3>
                        <p className="text-slate-500 text-sm">Your assets remain fully secured and untouched in cold storage during this period.</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-white font-bold mb-1">Estimated Time</h3>
                        <p className="text-slate-500 text-sm">Maintenance usually lasts between 30-60 minutes. Thank you for your patience.</p>
                    </div>
                </div>

                {/* Loader/Refresh status */}
                <div className="flex flex-col items-center space-y-3 pt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-medium text-slate-400">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Auto-checking status in {countdown}s</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold underline underline-offset-4 decoration-cyan-400/30 transition-colors"
                    >
                        Check manually
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Maintenance
