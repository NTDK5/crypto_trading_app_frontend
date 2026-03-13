import { Shield, Zap, BarChart3, Wallet, Lock, Globe } from 'lucide-react'

interface Service {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

const services: Service[] = [
  {
    icon: <Zap className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'Lightning Fast Trading',
    description: 'Execute trades in milliseconds with our high-performance trading engine and low-latency infrastructure.',
    gradient: 'from-yellow-500/20 to-orange-500/20'
  },
  {
    icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'Bank-Grade Security',
    description: 'Multi-layer security with cold storage, 2FA, and advanced encryption to protect your assets.',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    icon: <BarChart3 className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'Advanced Analytics',
    description: 'Real-time charts, technical indicators, and market insights to make informed trading decisions.',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    icon: <Wallet className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'Multi-Currency Wallet',
    description: 'Store, send, and receive hundreds of cryptocurrencies in one secure, easy-to-use wallet.',
    gradient: 'from-purple-500/20 to-pink-500/20'
  },
  {
    icon: <Lock className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'DeFi Integration',
    description: 'Access decentralized finance protocols, staking, and yield farming directly from the platform.',
    gradient: 'from-indigo-500/20 to-purple-500/20'
  },
  {
    icon: <Globe className="w-6 h-6 md:w-8 md:h-8" />,
    title: 'Global Access',
    description: 'Trade 24/7 from anywhere in the world with support for multiple languages and currencies.',
    gradient: 'from-cyan-500/20 to-blue-500/20'
  },
]

export default function Services() {
  return (
    <section className="py-20 px-6 bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Our Services
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Everything you need to succeed in the crypto market, all in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-3 overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>

              <div className="relative z-10">
                <div className="inline-flex p-3 md:p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    {service.icon}
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 md:mb-4 group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {service.description}
                </p>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-cyan-500/0 group-hover:border-cyan-500/50 rounded-tr-2xl transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

