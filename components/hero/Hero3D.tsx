"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Calendar, MessageSquare, TrendingUp, CheckCircle, Clock, Bot } from "lucide-react";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate rotation (inverted for natural feel)
    const rotateX = (y / rect.height) * -10; // Max -5 to 5 deg
    const rotateY = (x / rect.width) * 10;   // Max -5 to 5 deg

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient Splines/Blobs (Amie Style) */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '10s' }} />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Typography */}
            <div className="flex flex-col items-start text-left z-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-gray-100 backdrop-blur-sm mb-6">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-gray-600">New: AI Auto-Scheduling</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl font-semibold tracking-[-0.04em] text-[#151515] leading-[1.1] mb-8">
                    Property management <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                      that feels like magic.
                    </span>
                </h1>
                
                <p className="text-xl text-gray-500 font-medium max-w-lg mb-10 leading-relaxed">
                    LeaseAI replaces your busy work with intelligent automation. 
                    From leads to leases, everything flows.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/signup" className="btn-primary px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 shadow-xl shadow-black/5 hover:scale-105 transition-transform">
                        Start Free Trial
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                    <Link href="/demo" className="px-8 py-4 rounded-full text-lg font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center">
                        View Demo
                    </Link>
                </div>
                
                <div className="mt-10 flex items-center gap-4 text-sm font-medium text-gray-400">
                   <div className="flex -space-x-2">
                       {[1,2,3,4].map(i => (
                           <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] overflow-hidden`}>
                               <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                           </div>
                       ))}
                   </div>
                   <span>Trusted by 500+ modern teams</span>
                </div>
            </div>

            {/* Right: Frosted Glass Stack (The "Wow" Element) */}
            <div 
                ref={containerRef}
                className="relative h-[600px] w-full flex items-center justify-center perspective-2000"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div 
                    className="relative w-full h-full flex items-center justify-center"
                    style={{
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    {/* Layer 1 (Back): Calendar (Tilt -30px Z) */}
                    <div className="glass-panel w-72 h-80 rounded-[32px] absolute top-10 right-12 p-6 transition-all duration-700 hover:translate-z-10"
                         style={{ transform: 'translateZ(-40px) translateX(20px)' }}
                    >
                         <div className="flex justify-between items-center mb-6">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schedule</span>
                        </div>
                        <div className="space-y-4">
                             {[1, 2].map(i => (
                                 <div key={i} className="flex gap-4 items-start p-3 rounded-2xl bg-white/50 border border-white/50">
                                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                         0{9 + i}
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-gray-800">Viewing: Unit 4B</p>
                                         <p className="text-xs text-gray-400">Sarah Jenkins • {9 + i}:00 AM</p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Layer 2 (Middle): Revenue (Tilt 0 Z) */}
                    <div className="glass-panel w-80 h-72 rounded-[32px] absolute bottom-20 left-4 p-6 transition-all duration-700 z-10"
                         style={{ transform: 'translateZ(0px)' }}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="p-2 bg-green-50 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+12.5%</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                        <h3 className="text-4xl font-semibold tracking-tight text-gray-900 mb-6">$124,500</h3>
                        
                         {/* Mini Bar Chart */}
                        <div className="h-16 flex items-end gap-2">
                             {[40, 60, 45, 80, 55, 90].map((h, i) => (
                                 <div key={i} className="flex-1 bg-indigo-500/10 rounded-md relative overflow-hidden group">
                                     <div 
                                        className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-md transition-all duration-1000" 
                                        style={{ height: `${h}%` }}
                                     />
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Layer 3 (Front, Floating): Chat/AI (Tilt +50px Z) */}
                    <div className="glass-panel w-[340px] rounded-[32px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 z-20 shadow-2xl shadow-indigo-500/10 animate-float-slow"
                         style={{ transform: 'translateZ(50px)' }}
                    >
                         <div className="flex items-center gap-4 mb-5">
                             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                     <Bot className="w-6 h-6 text-indigo-600" />
                                 </div>
                             </div>
                             <div>
                                 <p className="font-bold text-gray-900">LeaseAI Agent</p>
                                 <p className="text-xs text-green-500 flex items-center gap-1">
                                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                     Active now
                                 </p>
                             </div>
                         </div>
                         
                         <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 leading-relaxed mb-4 relative">
                             <div className="absolute top-4 -left-2 w-4 h-4 bg-gray-50 transform rotate-45"></div>
                             "I've verified the income documents for <strong>Unit 104</strong>. The applicant is qualified. Should I send the lease agreement?"
                         </div>
                         
                         <div className="flex gap-3">
                             <button className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold shadow-lg shadow-black/20 hover:scale-105 transition-transform">
                                 Yes, send it
                             </button>
                             <button className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                 Review info
                             </button>
                         </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-20 right-0 w-12 h-12 glass-matte rounded-full flex items-center justify-center animate-bounce z-30" style={{ animationDuration: '3s' }}>
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>

                </div>
            </div>
        </div>

        {/* CSS for custom float animation */}
        <style jsx>{`
            .perspective-2000 { perspective: 2000px; }
            @keyframes float-slow {
                0%, 100% { transform: translate(-50%, -50%) translateZ(50px) translateY(0); }
                50% { transform: translate(-50%, -50%) translateZ(50px) translateY(-15px); }
            }
            .animate-float-slow {
                animation: float-slow 6s ease-in-out infinite;
            }
        `}</style>
    </section>
  );
}
