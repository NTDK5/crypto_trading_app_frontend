import { Calendar, ArrowRight } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  excerpt: string
  date: string
  category: string
  image: string
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: 'Bitcoin Reaches New All-Time High',
    excerpt: 'Bitcoin has surged past $100,000, marking a historic milestone in the cryptocurrency market.',
    date: '2024-01-15',
    category: 'Market News',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop'
  },
  {
    id: 2,
    title: 'New DeFi Protocol Launches',
    excerpt: 'Revolutionary decentralized finance platform introduces yield farming with unprecedented APY rates.',
    date: '2024-01-12',
    category: 'DeFi',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=400&fit=crop'
  },
  {
    id: 3,
    title: 'Ethereum 2.0 Staking Update',
    excerpt: 'Major improvements to Ethereum staking mechanism reduce barriers and increase accessibility.',
    date: '2024-01-10',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1639322537504-7a8e0e8b5c5d?w=800&h=400&fit=crop'
  },
]

export default function News() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Latest News
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay updated with the latest developments in the crypto world
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map((item) => (
            <article
              key={item.id}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <div 
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundColor: '#1a1a2e'
                  }}
                ></div>
                
                {/* Category badge */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/30">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center text-gray-400 text-sm mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <time dateTime={item.date}>
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </time>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                  {item.excerpt}
                </p>

                <a
                  href="#"
                  className="inline-flex items-center text-cyan-400 font-semibold hover:text-cyan-300 transition-colors group/link"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/30 rounded-2xl transition-all duration-500 pointer-events-none"></div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-flex items-center px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30"
          >
            View All News
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>
    </section>
  )
}

