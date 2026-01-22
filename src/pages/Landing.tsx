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
      <Hero />
      <Stats />
      <Services />
      <News />
      <Footer />
    </div>
  )
}

