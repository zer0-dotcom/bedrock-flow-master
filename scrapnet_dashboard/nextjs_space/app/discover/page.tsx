import { HeroSection } from './_components/hero-section'
import { IntakeSection } from './_components/intake-section'
import { HowItWorks } from './_components/how-it-works'
import { ChainData } from './_components/chain-data'
import { AvatarNetwork } from './_components/avatar-network'
import { DiscoverFooter } from './_components/footer'

export default function DiscoverPage() {
  return (
    <div className="dark bg-black min-h-screen text-white">
      <HeroSection />
      <IntakeSection />
      <HowItWorks />
      <ChainData />
      <AvatarNetwork />
      <DiscoverFooter />
    </div>
  )
}
