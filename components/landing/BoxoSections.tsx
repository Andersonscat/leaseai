import Link from "next/link";
import { ChevronRight } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";
import BeamGraph from "@/components/landing/BeamGraph";

export default function BoxoSections() {
  return (
    <div className="bg-transparent text-black antialiased overflow-x-hidden">
      
      {/* 1. Explore Endless Possibilities */}
      <section className="py-40 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-[48px] md:text-[64px] font-semibold tracking-[-0.05em] leading-[0.95] mb-6">
            Maximize your portfolio <br /> potential
          </h2>
          <p className="text-body-premium text-lg md:text-xl font-medium max-w-2xl mx-auto">
            LeaseAI handles the entire operations cycle, from lead capture to lease signing. A single platform that works for you 24/7.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <SpotlightLink 
            icon="/metallic_lightning.png"
            title="Launch properties swiftly"
            description="Sync your listings from Zillow and Airbnb in minutes. Our AI starts qualifying leads immediately, keeping you ahead of the market."
          />
          <SpotlightLink 
            icon="/metallic_coin.png"
            title="Drive higher occupancy"
            description="Our autonomous response system ensures no lead is missed. Increase conversion rates and maximize your rental income."
          />
          <SpotlightLink 
            icon="/metallic_sparkle.png"
            title="Boost tenant satisfaction"
            description="Provide an instant, professional communication channel for your tenants. Build trust through speed and reliability."
          />
          <SpotlightLink 
            icon="/metallic_star.png"
            title="Streamlined management"
            description="Automate viewings and document checks. Enable a seamless onboarding experience with integrated background checks."
          />
        </div>

        <div className="flex justify-center">
          <Link href="/signup" className="btn-primary px-8 py-3.5 rounded-full text-[15px] font-semibold shadow-xl shadow-black/10">
            Build your AI Team
          </Link>
        </div>
      </section>

      {/* 2. Single Integration */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[48px] md:text-[64px] font-semibold tracking-[-0.05em] leading-[0.95] mb-6">
              Connect once, manage <br /> everywhere
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="max-w-md">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 leading-tight">
                Integrate your sources, centralize your growth
              </h3>
              <p className="text-body-premium text-lg font-medium leading-relaxed">
                LeaseAI connects with Zillow, Airbnb, Gmail, and Google Calendar. Gain a unified view of your entire business without multiple logins.
              </p>
            </div>
            
            <div className="relative">
                <BeamGraph />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Super App Hero */}
      <section className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-[72px] md:text-[120px] font-semibold tracking-[-0.06em] leading-[0.85] mb-12">
            Your real estate, <br /> supercharged with AI
          </h2>
          <p className="text-body-premium text-2xl md:text-3xl font-medium max-w-3xl mb-16 leading-tight">
            Automate lead qualification, viewing scheduling, and document checks — all within one powerful OS.
          </p>
          <Link href="/signup" className="inline-flex btn-primary px-10 py-4.5 rounded-full text-lg font-semibold shadow-2xl shadow-black/20">
            Get Started Free
          </Link>
        </div>
      </section>


    </div>
  );
}

function SpotlightLink({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <SpotlightCard className="p-10 flex flex-col items-start bg-white">
      <div className="w-24 h-24 mb-10 flex items-center justify-center">
        <img src={icon} alt={title} className="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight mb-4">{title}</h3>
      <p className="text-body-premium font-medium leading-relaxed">{description}</p>
    </SpotlightCard>
  );
}
