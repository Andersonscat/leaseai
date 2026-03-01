"use client";

import React from "react";
import { Mail, Calendar, Home, MapPin } from "lucide-react";

export default function BeamGraph() {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-transparent">
      {/* Central Hub */}
      <div className="relative z-30 w-24 h-24 bg-[#121212] rounded-[24px] flex items-center justify-center shadow-2xl ring-4 ring-black/5 z-20">
         <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-[24px]" />
         <span className="relative z-10 text-2xl font-bold text-white tracking-tighter">L</span>
         {/* Pulse Ring */}
         <div className="absolute -inset-12 border border-black/5 rounded-full z-0 opacity-50" />
         <div className="absolute -inset-24 border border-black/5 rounded-full z-0 opacity-30" />
      </div>

      {/* Satellites & Beams */}
      <Satellite angle={-135} distance={140} icon={<Home className="w-5 h-5 text-blue-600"/>} label="Zillow" delay={0} />
      <Satellite angle={-45} distance={140} icon={<MapPin className="w-5 h-5 text-red-500"/>} label="Airbnb" delay={1} />
      <Satellite angle={45} distance={140} icon={<Mail className="w-5 h-5 text-red-600"/>} label="Gmail" delay={2} />
      <Satellite angle={135} distance={140} icon={<Calendar className="w-5 h-5 text-green-600"/>} label="GCal" delay={3} />
    </div>
  );
}

function Satellite({ angle, distance, icon, label, delay }: any) {
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;

    return (
        <>
            {/* Beam Line */}
            <div 
                className="absolute left-1/2 top-1/2 h-[2px] bg-black/5 origin-left z-10"
                style={{ 
                    width: distance - 48, // Subtract half of center hub width
                    transform: `rotate(${angle}deg)`,
                }}
            >
                {/* Moving Particle */}
                <div 
                    className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent animate-beam-flow"
                    style={{ animationDelay: `${delay * 0.5}s` }}
                />
            </div>

            {/* Satellite Node */}
            <div 
                className="absolute z-20 flex flex-col items-center gap-3 transition-transform hover:scale-110 duration-300"
                style={{ transform: `translate(${x}px, ${y}px)` }}
            >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center">
                    {icon}
                </div>
                <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-black/5 text-xs font-semibold text-gray-600 shadow-sm">
                    {label}
                </div>
            </div>
        </>
    );
}
