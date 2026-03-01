"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Bot } from "lucide-react";

export default function HeroTechnical() {
  return (
    <section className="relative min-h-screen flex flex-col items-center pt-48 pb-20 px-6 overflow-hidden bg-white">
      {/* 1. Masked Grid Background (Technical Refinement) */}
      <div className="absolute inset-0 z-0 opacity-[0.12]" 
           style={{ 
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 70%)'
           }}>
      </div>

      {/* 2. Beam Light Effect (Linear Style) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150vw] h-full pointer-events-none z-0 opacity-40"
           style={{
             background: 'conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(79, 70, 229, 0.1) 180deg, transparent 195deg)',
             filter: 'blur(100px)'
           }}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto text-center relative z-10 mb-20">
        <div className="animate-premium-fade flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50/50 border border-black/[0.03] mb-8">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Technical Preview</span>
            </div>
            
            <h1 className="text-7xl md:text-[92px] font-bold text-black tracking-[-0.05em] leading-[0.9] mb-10">
                The operating system <br />
                <span className="text-gray-300">for real estate.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-12 font-medium leading-[1.4]">
                LeaseAI handles the hard parts of property management with clinical precision. 
                Automated, autonomous, and built for scale.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <Link href="/signup" className="btn-primary text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2 group">
                Scale your team
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/demo" className="px-10 py-4 rounded-full text-lg font-semibold text-black bg-white border border-gray-100 hover:bg-gray-50 transition-all">
                See it in action
              </Link>
            </div>
        </div>
      </div>

      {/* Hero Asset: High-Fidelity Dashboard Mockup with Refractive Glass */}
      <div className="relative w-full max-w-6xl mx-auto z-10 transition-all duration-1000 animate-premium-fade delay-200">
          <div className="rounded-[24px] overflow-hidden border border-black/[0.06] shadow-[0_100px_180px_-30px_rgba(0,0,0,0.08)] bg-white relative">
              {/* Inner Glow Border */}
              <div className="absolute inset-0 pointer-events-none rounded-[24px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)] z-10" />
              
              {/* Window Header */}
              <div className="h-10 bg-gray-50/50 border-b border-black/[0.03] flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
              
              <div className="p-8 md:p-12">
                  <div className="grid grid-cols-12 gap-10">
                      {/* Dashboard Sidebar-like area */}
                      <div className="col-span-3 space-y-8 border-r border-black/[0.03] pr-10 hidden md:block">
                          <div className="h-10 w-10 bg-black rounded-lg shadow-lg shadow-black/10" />
                          <div className="space-y-4">
                              <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                              <div className="h-1.5 w-4/5 bg-gray-100 rounded-full" />
                              <div className="h-1.5 w-5/6 bg-gray-100 rounded-full" />
                          </div>
                          <div className="pt-20">
                             <div className="h-24 w-full bg-gray-50 rounded-2xl border border-black/[0.02]" />
                          </div>
                      </div>
                      
                      {/* Main Dashboard Content */}
                      <div className="col-span-12 md:col-span-9">
                          <div className="flex justify-between items-center mb-12">
                              <div className="h-6 w-40 bg-black/[0.04] rounded-full" />
                              <div className="flex gap-2">
                                  <div className="w-32 h-9 bg-gray-50 rounded-lg border border-black/[0.03]" />
                                  <div className="w-9 h-9 bg-black rounded-lg" />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 mb-12">
                              {[1, 2, 3].map(i => (
                                  <div key={i} className="h-32 bg-gray-50/40 border border-black/[0.02] rounded-2xl p-6 flex flex-col justify-between">
                                      <div className="h-1.5 w-10 bg-gray-200 rounded-full" />
                                      <div className="h-8 w-20 bg-gray-400/10 rounded-lg" />
                                  </div>
                              ))}
                          </div>
                          
                          <div className="h-64 bg-gray-50/20 border border-black/[0.02] rounded-2xl p-8 relative overflow-hidden">
                              {/* Graph Representation */}
                              <div className="absolute inset-x-12 bottom-12 h-32 flex items-end gap-3 px-4">
                                  {[35, 55, 40, 95, 65, 50, 75, 90, 60, 85, 45, 95].map((h, i) => (
                                      <div key={i} className={`flex-1 rounded-t-lg transition-colors ${i === 3 ? 'bg-indigo-500/15 border-t-2 border-indigo-500/40' : 'bg-black/[0.04]'}`} style={{ height: `${h}%` }} />
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Floating Refractive Glass Card */}
          <div className="absolute -top-16 -right-16 glass-premium p-8 rounded-[32px] shadow-2xl border border-black/[0.05] w-80 animate-float-slow hidden lg:block z-20">
              <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
                      <Bot className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LeaseAI Agent</p>
                      <p className="text-base font-bold text-black">Identity Verified</p>
                  </div>
              </div>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                  AI agent cross-checked background for <strong>Unit 402</strong>. Identity verified (100% confidence).
              </p>
          </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
        }
        .glass-premium {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(24px) saturate(1.8);
            -webkit-backdrop-filter: blur(24px) saturate(1.8);
            box-shadow: 
                inset 0 0 0 1px rgba(255, 255, 255, 0.8),
                0 40px 100px -20px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </section>
  );
}
