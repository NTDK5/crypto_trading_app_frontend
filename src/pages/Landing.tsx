import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Zap, Globe, BarChart3, Clock, Users, DollarSign, ArrowRight, Newspaper } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Landing() {
  const [stats, setStats] = useState({
    activeUsers: '50K+',
    totalTrades: '1M+',
    dailyVolume: '$10M+',
    successRate: '98%'
  })

  const [news, setNews] = useState([
    {
      id: 1,
      title: 'Bitcoin Reaches New Heights',
      excerpt: 'Bitcoin surges past $45,000 as institutional adoption continues to grow.',
      date: '2 hours ago',
      category: 'Market News'
    },
    {
      id: 2,
      title: 'Ethereum 2.0 Staking Update',
      excerpt: 'More validators join the network as ETH staking rewards remain attractive.',
      date: '5 hours ago',
      category: 'Technology'
    },
    {
      id: 3,
      title: 'DeFi Market Growth',
      excerpt: 'Total value locked in DeFi protocols reaches new all-time high.',
      date: '1 day ago',
      category: 'DeFi'
    }
  ])

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Execution',
      description: 'Execute trades in milliseconds with our advanced trading engine and low-latency infrastructure.'
    },
    {
      icon: Shield,
      title: 'Secure & Regulated',
      description: 'Bank-level security with 2FA, cold storage, and regulatory compliance to protect your assets.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time market data, advanced charts, and AI-powered insights to make informed decisions.'
    },
    {
      icon: Globe,
      title: 'Global Market Access',
      description: 'Trade 100+ cryptocurrencies across global markets 24/7 from anywhere in the world.'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock customer support team ready to assist you whenever you need help.'
    },
    {
      icon: DollarSign,
      title: 'Low Fees',
      description: 'Competitive trading fees starting from 0.1% with discounts for high-volume traders.'
    }
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header with blur background */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-900/80 border-b border-dark-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                KitX Trading
              </span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Glowing Background */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-primary-800/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Trade Crypto with
            <span className="block bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
              Confidence & Speed
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            Join thousands of traders using KitX Trading platform. Advanced tools, 
            secure infrastructure, and lightning-fast execution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg shadow-primary-500/50"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/app/dashboard" 
              className="border-2 border-primary-600 text-primary-400 hover:bg-primary-600/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-dark-800/50 border-y border-dark-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.activeUsers}</div>
              <div className="text-gray-400 flex items-center justify-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Active Users</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.totalTrades}</div>
              <div className="text-gray-400 flex items-center justify-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Total Trades</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.dailyVolume}</div>
              <div className="text-gray-400 flex items-center justify-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Daily Volume</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">{stats.successRate}</div>
              <div className="text-gray-400 flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose KitX Trading? Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">KitX Trading</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of cryptocurrency trading with our cutting-edge platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-8 hover:border-primary-500/50 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 px-6 bg-dark-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Latest <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">News</span>
              </h2>
              <p className="text-gray-400">Stay updated with the latest crypto market news</p>
            </div>
            <Newspaper className="w-12 h-12 text-primary-400 hidden md:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <div 
                key={item.id}
                className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500/50 transition-all transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary-900/30 via-primary-800/30 to-primary-900/30 rounded-2xl border border-primary-700/30 p-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join KitX Trading today and experience the best cryptocurrency trading platform
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-primary-500/50"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-700 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                KitX Trading
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 KitX Trading. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
