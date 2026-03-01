"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Mail, Calendar, ChevronRight, ArrowUpRight, ShieldCheck, Zap, Bot } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import HeroTechnical from "@/components/hero/HeroTechnical";
import BoxoSections from "@/components/landing/BoxoSections";
import ScrollReveal from "@/components/ui/ScrollReveal";
import InteractiveWorkflow from "@/components/landing/InteractiveWorkflow";
import LogoMarquee from "@/components/ui/LogoMarquee";
import SuperAppSection from "@/components/landing/SuperAppSection";
import FAQSection from "@/components/landing/FAQSection";

export default function Home() {
  // Silent, instant scroll to top on load
  useEffect(() => {
    // 1. Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // 2. Clear lingering hash (like #pricing) without reload
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 3. Instantly jump to top
    window.scrollTo(0, 0);

    // 4. Contingency: double-check after small render delay
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 antialiased overflow-x-hidden">
      <Navbar />
      
      <HeroTechnical />
      
      {/* Wall of Love Marquee */}
      <LogoMarquee />



      <ScrollReveal animation="fade-up" delay={0.2}>
      <section id="features" className="py-48 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h3 className="text-[56px] font-semibold text-black tracking-tight leading-none mb-6">Built for performance.</h3>
            <p className="text-xl text-body-premium max-w-xl font-medium">A unified operating system for real estate professionals who demand speed and precision.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px] md:auto-rows-[320px]">
            
            {/* Box 1: AI Inbox (Large) */}
            <div className="md:col-span-8 md:row-span-2 bento-card p-12 overflow-hidden group">
               <div className="relative z-20 h-full flex flex-col justify-between">
                  <div className="max-w-md">
                     <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-8 shadow-xl">
                        <Mail className="w-6 h-6" />
                     </div>
                     <h3 className="text-[44px] font-semibold tracking-[-0.04em] text-black leading-none mb-6">
                        Unified Smart <br /> Inbox.
                     </h3>
                     <p className="text-body-premium text-lg font-medium leading-relaxed">
                        Pull leads from Zillow, Airbnb, and your website into one high-energy workspace. AI prioritizes the hottest leads for you instantly, so you never miss a deal.
                     </p>
                  </div>
                  <div className="flex gap-4">
                     <span className="px-5 py-2.5 rounded-full bg-white text-[#151515] font-semibold text-[10px] uppercase tracking-widest border border-black/10 shadow-sm">Zillow Sync</span>
                     <span className="px-5 py-2.5 rounded-full bg-white text-[#151515] font-semibold text-[10px] uppercase tracking-widest border border-black/10 shadow-sm">Auto-Reply</span>
                     <span className="px-5 py-2.5 rounded-full bg-white text-[#151515] font-semibold text-[10px] uppercase tracking-widest border border-black/10 shadow-sm">Gmail</span>
                  </div>
               </div>
               {/* Decorative Element */}
               <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl rounded-full" />
            </div>

            {/* Box 2: Qualification (Vertical) - FIXED VISIBILITY */}
            <div className="md:col-span-4 md:row-span-2 bento-card bento-card-dark p-10 shadow-2xl shadow-black/5 group">
               <div className="h-full flex flex-col justify-between relative z-20">
                  <div>
                     <div className="w-12 h-12 rounded-2xl bg-[#151515] flex items-center justify-center mb-8">
                        <ShieldCheck className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-3xl font-semibold tracking-tight mb-6 text-white">Autonomous <br /> Qualification.</h3>
                     <p className="text-body-dark text-lg font-medium leading-relaxed">
                        Our AI conducts initial screening, checks IDs, and verifies income history before you even open your eyes.
                     </p>
                  </div>
                  <div className="pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between group-hover:translate-x-2 transition-transform cursor-pointer">
                       <span className="font-semibold text-white">See Verification Flow</span>
                       <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Box 3: Calendar (Small) */}
            <div className="md:col-span-4 bento-card p-8 flex flex-col justify-between hover:bg-indigo-50/50">
               <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#151515]" />
                  </div>
                  <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
               </div>
               <div>
                  <h4 className="text-xl font-semibold mb-2 text-black">Auto-Scheduling</h4>
                  <p className="text-sm text-body-premium font-medium">Viewings booked directly into your Google Calendar with smart buffer detection.</p>
               </div>
            </div>

            {/* Box 4: Analytics (Wide) */}
            <div className="md:col-span-8 bento-card p-8 flex items-center gap-10 bg-white">
               <div className="flex-1 flex flex-col justify-between h-full">
                  <h4 className="text-2xl font-semibold tracking-tight text-black">Real-time Conversions.</h4>
                  <p className="text-sm text-body-premium font-medium">Track your team's ROI and response times with millisecond precision across all channels.</p>
                  <div className="flex gap-2 items-center text-[#151515] font-semibold text-sm">
                    <span>Open Analytics Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
               </div>
               <div className="hidden sm:block w-48 h-full bg-black/5 rounded-2xl p-4">
                  <div className="w-full h-full border-b-2 border-l-2 border-black/10 flex items-end gap-1 px-2">
                     {[40, 70, 45, 90, 60, 85].map((h, i) => (
                       <div key={i} className="flex-1 bg-[#151515]/20 rounded-t-sm transition-all hover:bg-[#151515]" style={{ height: `${h}%` }} />
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Replicated Design Sections */}
      <BoxoSections />

      {/* Super App Section */}
      <ScrollReveal animation="fade-up" delay={0.2}>
        <SuperAppSection />
      </ScrollReveal>

      {/* NEW: Trusted By Section */}
      {/* NEW: Trusted By Section - REMOVED */}

       {/* NEW: Workflow Section */}
       <section className="py-32 px-6 bg-white text-[#151515] relative overflow-hidden">
         <ScrollReveal>
         <div className="max-w-7xl mx-auto relative z-10">
           <div className="text-center mb-16">
               <h3 className="text-[56px] font-semibold tracking-tight leading-none mb-6">From lead to lease <br /><span className="opacity-30">in 60 seconds.</span></h3>
               <p className="text-xl text-body-premium font-medium max-w-2xl mx-auto">Our autonomous workflow handles the heavy lifting so you can focus on scale, not administration.</p>
           </div>
           
           <InteractiveWorkflow />
         </div>
         </ScrollReveal>
       </section>

      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
             <p className="text-[#151515] font-semibold uppercase tracking-widest text-xs mb-4">Reviews</p>
             <h3 className="text-[56px] font-semibold text-black tracking-tight">What the leaders say.</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             <TestimonialCard 
               quote="LeaseAI saved our team 40+ hours a week in administration. It's not a tool, it's a team member." 
               author="Alex Rivera" 
               role="VP of Operations, SkyLine Properties" 
             />
             <TestimonialCard 
               quote="The lead qualification is eerily accurate. Our conversion rate jump was immediate and massive." 
               author="Sarah Chen" 
               role="Independent Broker" 
             />
             <TestimonialCard 
               quote="Finally, an AI that actually understands the nuance of real estate conversations. Revolutionary." 
               author="Marcus Vane" 
               role="CEO, Vane & Co" 
             />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <ScrollReveal animation="fade-up" delay={0.2}>
        <FAQSection />
      </ScrollReveal>

      {/* Pricing: The Cleanest Tier */}
      <section id="pricing" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-[56px] font-semibold text-black leading-none tracking-tight mb-8">One plan. <br /><span className="text-black/40">Total control.</span></h3>
            <p className="text-lg text-body-premium font-medium mb-10 max-w-sm">Everything you need to scale your property portfolio without the overhead.</p>
            <div className="space-y-4">
               {['Unlimited Leads', 'Custom AI Brains', 'White-label Support', 'API Access'].map(f => (
                 <div key={f} className="flex items-center gap-3 font-semibold text-[15px] text-black">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px]">✓</div>
                    {f}
                 </div>
               ))}
            </div>
          </div>
          
          <div className="bento-card bg-white p-12 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rotate-45 translate-x-16 -translate-y-16" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex justify-between items-start mb-10">
                  <div className="px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-semibold uppercase tracking-widest">Growth</div>
                  <Bot className="w-8 h-8 text-black/10 group-hover:text-[#151515] transition-colors" />
               </div>
               <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-[80px] font-semibold text-black tracking-tighter">$29</span>
                  <span className="text-xl text-body-premium font-semibold">/ Month</span>
               </div>
               <Link href="/signup" className="w-full py-5 rounded-full btn-primary text-center font-semibold text-lg shadow-xl shadow-black/20 mb-4">
                  Deploy to your portfolio
               </Link>
               <p className="text-center text-[13px] text-body-premium font-semibold tracking-wide uppercase">Start 14-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Ultimate Minimalist */}
      <footer className="py-32 px-6 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-sm">
             <h4 className="text-3xl font-black tracking-[-0.08em] mb-8 text-black">LeaseAI</h4>
             <p className="text-black/70 font-medium leading-relaxed mb-8">Building the next logical step in real estate management. Efficient. Autonomous. Precise.</p>
             <div className="flex gap-4">
                {['TW', 'LI', 'IG'].map(s => <div key={s} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-black text-xs hover:bg-black hover:text-white transition-all cursor-pointer text-black">{s}</div>)}
             </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
             <div>
                <h5 className="font-black uppercase text-[11px] tracking-widest mb-8 text-black/80">Product</h5>
                <ul className="space-y-4 text-[15px] font-semibold text-black/60">
                  <li className="hover:text-black cursor-pointer">Bento OS</li>
                  <li className="hover:text-black cursor-pointer">Pricing</li>
                  <li className="hover:text-black cursor-pointer">Changelog</li>
                </ul>
             </div>
             <div>
                <h5 className="font-black uppercase text-[11px] tracking-widest mb-8 text-black/80">Resources</h5>
                <ul className="space-y-4 text-[15px] font-semibold text-black/60">
                  <li className="hover:text-black cursor-pointer">Documentation</li>
                  <li className="hover:text-black cursor-pointer">API Keys</li>
                  <li className="hover:text-black cursor-pointer">Legal</li>
                </ul>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-black/5 flex justify-between items-center text-[13px] font-bold text-black/50 uppercase tracking-widest">
           <p>© 2026 LeaseAI Corp.</p>
           <p>Engineered for Speed</p>
        </div>
      </footer>

    </div>
  );
}

function WorkflowStep({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-8 group">
      <div className="text-[#151515] font-black text-2xl tracking-tighter opacity-10 group-hover:opacity-30 transition-opacity whitespace-nowrap">{number}</div>
      <div>
        <h4 className="text-xl font-semibold mb-2 text-[#151515]">{title}</h4>
        <p className="text-body-premium font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bento-card p-10 flex flex-col justify-between h-full bg-white border-black/5">
       <div className="mb-8">
          <div className="flex gap-1 mb-6 text-black/20">
             {[...Array(5)].map((_, i) => <Zap key={i} className="w-4 h-4 fill-current" />)}
          </div>
          <p className="text-xl font-medium text-[#151515] tracking-tight leading-relaxed italic">"{quote}"</p>
       </div>
       <div className="flex items-center gap-4 pt-8 border-t border-black/5">
          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center font-black text-[#151515] text-xs">{author.split(' ').map(n => n[0]).join('')}</div>
          <div>
             <p className="font-semibold text-[#151515]">{author}</p>
             <p className="text-[11px] font-semibold text-body-premium uppercase tracking-widest">{role}</p>
          </div>
       </div>
    </div>
  );
}