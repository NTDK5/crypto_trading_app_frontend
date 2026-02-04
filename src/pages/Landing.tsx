import LandingHeader from '../components/LandingHeader'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import Services from '../components/Services'
import News from '../components/News'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeader />
      {/* Top padding so content clears the fixed landing header on all screen sizes */}
      <main className="pt-24 md:pt-28 lg:pt-24">
        <Hero />
        <Stats />
        <Services />
        <News />
        <Footer />
      </main>
    </div>
  )
}

