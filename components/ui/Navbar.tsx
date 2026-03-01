"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed left-0 right-0 z-[100] px-4 md:px-6 transition-all duration-500 ease-out ${scrolled ? 'top-4' : 'top-6 md:top-8'}`}>
      <div className="max-w-5xl mx-auto">
        <div className={`
             glass-matte rounded-full px-6 py-3 md:px-8 md:py-3.5
             flex justify-between items-center
             transition-all duration-300
             ${scrolled ? 'shadow-lg shadow-black/5' : ''}
        `}>
          
          {/* Logo */}
          <div className="flex items-center gap-10">
            <Link href="/" className="text-xl font-bold text-[#151515] tracking-tight">
              LeaseAI
            </Link>
            
            {/* Desktop Links */}
            <div className="hidden md:flex gap-8">
              {['Features', 'Pricing', 'Company'].map(item => (
                <Link 
                    key={item} 
                    href={`#${item.toLowerCase()}`} 
                    className="text-[14px] font-medium text-gray-500 hover:text-black transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link 
                href="/login" 
                className="hidden md:block text-[14px] font-medium text-[#151515] hover:opacity-70 transition-opacity"
            >
              Log in
            </Link>
            <Link 
                href="/signup" 
                className="bg-[#151515] text-white px-5 py-2.5 rounded-full text-[14px] font-semibold hover:scale-105 transition-transform shadow-lg shadow-black/10"
            >
              Get Started
            </Link>
            
            {/* Mobile Menu Toggle (simplified) */}
            <button className="md:hidden text-[#151515]">
                <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
