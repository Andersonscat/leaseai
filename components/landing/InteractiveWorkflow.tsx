"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Lead Capture",
    description: "LeaseAI instantly pulls lead data from any source (Zillow, Airbnb, Website) and initiates the conversation in milliseconds."
  },
  {
    id: 2,
    title: "Dynamic Qualification",
    description: "Our AI screens tenants based on your specific criteria, verifying income, ID, and rental history before you ever get involved."
  },
  {
    id: 3,
    title: "Auto-Booking",
    description: "Qualified leads are automatically scheduled for viewings directly into your calendar. We handle the coordination, you handle the closing."
  }
];

export default function InteractiveWorkflow() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="grid md:grid-cols-2 gap-16 items-start">
        {/* Left: Interactive List with Connector Line */}
        <div className="space-y-0 relative">
          {/* Continuous Line */}
          <div className="absolute left-[27px] top-6 bottom-6 w-[2px] bg-black/5 z-0" />
          
          {steps.map((step) => (
            <div 
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className="relative z-10 pl-4 py-4 group cursor-pointer"
            >
              <div className="flex items-start gap-6">
                {/* Number Circle */}
                <div className={`
                  w-14 h-14 rounded-full border-2 flex items-center justify-center text-sm font-bold bg-white transition-all duration-500
                  ${activeStep === step.id 
                    ? "border-black text-black scale-110 shadow-[0_0_30px_rgba(0,0,0,0.1)]" 
                    : "border-black/5 text-black/30 group-hover:border-black/20 group-hover:scale-105"}
                `}>
                  0{step.id}
                </div>
                
                {/* Content Card */}
                <div className={`
                  flex-1 p-6 rounded-2xl border transition-all duration-500
                  ${activeStep === step.id 
                    ? "bg-white/80 backdrop-blur-md border-black/10 shadow-lg translate-x-2" 
                    : "bg-transparent border-transparent opacity-60 group-hover:opacity-100"}
                `}>
                  <h4 className={`text-xl font-semibold mb-2 ${activeStep === step.id ? "text-black" : "text-black/60"}`}>
                    {step.title}
                  </h4>
                  <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${activeStep === step.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                       <p className="text-body-premium text-base font-medium leading-relaxed">
                         {step.description}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Dynamic Visual with Glassmorphism */}
        <div className="aspect-square bg-white rounded-[40px] border border-black/5 p-8 shadow-2xl transition-all duration-500 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03),transparent_70%)]" />
            
             {/* Visual for Step 1 */}
             <div className={`absolute transition-all duration-700 w-full px-8 flex flex-col items-center ${activeStep === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
                <div className="w-24 h-24 bg-gradient-to-br from-[#151515] to-[#333] rounded-3xl flex items-center justify-center mb-8 shadow-2xl skew-y-3">
                   <div className="text-4xl">🧲</div>
                </div>
                <div className="w-full bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-premium-fade delay-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">AB</div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-black/10 rounded-full mb-2" />
                    <div className="h-2 w-16 bg-black/5 rounded-full" />
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">New Lead</div>
                </div>
             </div>

             {/* Visual for Step 2 */}
             <div className={`absolute transition-all duration-700 w-full px-8 flex flex-col items-center ${activeStep === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
                <div className="w-full bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl p-6 shadow-2xl space-y-4">
                   <div className="flex items-center justify-between border-b border-black/5 pb-4">
                      <span className="font-semibold">Qualification Score</span>
                      <span className="text-2xl font-bold text-green-600">98/100</span>
                   </div>
                   <div className="space-y-3">
                     {[
                       { label: "Credit Score > 750", check: true },
                       { label: "Income Verified 3x", check: true },
                       { label: "No Eviction History", check: true }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-semibold text-sm">{item.label}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>

             {/* Visual for Step 3 */}
             <div className={`absolute transition-all duration-700 w-full px-8 flex flex-col items-center ${activeStep === 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
                <div className="w-full bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl p-6 shadow-2xl text-center">
                   <div className="flex justify-between items-center mb-6">
                      <p className="text-xs uppercase tracking-widest text-black/40 font-bold">Google Calendar</p>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                   </div>
                   <h4 className="text-3xl font-bold text-black mb-2">Tue, 14 Nov</h4>
                   <p className="text-lg font-semibold text-black/60 mb-6">2:00 PM - Viewing</p>
                   
                   <div className="flex -space-x-3 justify-center mb-6">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-black flex items-center justify-center text-white text-xs font-bold">AI</div>
                   </div>

                   <div className="w-full bg-[#f0fdf4] rounded-xl py-3 text-sm font-bold text-green-700 border border-green-200 flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-4 h-4" />
                     Viewing Confirmed
                   </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
