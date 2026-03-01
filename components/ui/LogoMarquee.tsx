"use client";

import React from "react";

const logos = [
  { name: "Vercel", url: "https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png" },
  { name: "Linear", url: "https://linear.app/demo/linear-logo.svg" },
  { name: "Airbnb", url: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" },
  { name: "Zillow", url: "https://s.zillowstatic.com/pfs/static/z-logo-default.svg" },
  { name: "Notion", url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
];

/* Reusing simple Svg placeholders for a clean, dependency-free look */
const LogoPlaceholders = [
    (props: any) => (
        <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
            <path d="M10,15 L20,5 L30,15 L20,25 Z M40,5 H50 V25 H40 Z M60,5 H80 V10 H65 V12 H75 V17 H65 V25 H60 Z" />
        </svg>
    ), // "Diamond"
    (props: any) => (
        <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
             <circle cx="15" cy="15" r="10" />
             <rect x="35" y="5" width="20" height="20" />
             <path d="M70,25 L80,5 L90,25" stroke="currentColor" strokeWidth="5" />
        </svg>
    ), // "CircleSquare"
    (props: any) => (
        <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
            <path d="M10,15 Q25,5 40,15 T70,15 T100,15" stroke="currentColor" strokeWidth="5" fill="none" />
        </svg>
    ), // "Wave"
    (props: any) => (
        <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
             <rect x="10" y="5" width="20" height="20" rx="5" />
             <rect x="40" y="5" width="20" height="20" rx="5" />
             <rect x="70" y="5" width="20" height="20" rx="5" />
        </svg>
    ), // "Blocks"
    (props: any) => (
        <svg viewBox="0 0 100 30" fill="currentColor" {...props}>
             <path d="M10,25 L20,5 L30,25 M40,25 L40,5 M50,5 L50,25 M60,25 L70,5 L80,25" stroke="currentColor" strokeWidth="3" />
        </svg>
    ), // "Sharp"
];

export default function LogoMarquee() {
  return (
    <div className="w-full py-12 bg-white border-b border-black/[0.03] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-black/40">Trusted by modern teams</p>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-20 px-10">
          {[...LogoPlaceholders, ...LogoPlaceholders, ...LogoPlaceholders].map((Logo, index) => (
            <div key={index} className="h-8 w-32 text-black/20 hover:text-black/80 transition-colors duration-500">
               <Logo className="w-full h-full" />
            </div>
          ))}
        </div>

        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center gap-20 px-10">
          {[...LogoPlaceholders, ...LogoPlaceholders, ...LogoPlaceholders].map((Logo, index) => (
            <div key={`clone-${index}`} className="h-8 w-32 text-black/20 hover:text-black/80 transition-colors duration-500">
               <Logo className="w-full h-full" />
            </div>
          ))}
        </div>
        
        {/* Fadient Edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
      </div>
    </div>
  );
}
