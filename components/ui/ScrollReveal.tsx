"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming cn utility exists, otherwise I'll use template literals

// Simple utility if cn is not available, but standard shadcn/tailwind projects usually have it.
// If not, I'll assume standard class concatenation.

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // in seconds
  animation?: "fade-up" | "fade-in" | "slide-in";
}

export default function ScrollReveal({ 
  children, 
  className = "", 
  delay = 0,
  animation = "fade-up" 
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const getAnimationClass = () => {
    switch (animation) {
      case "fade-up":
        return isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-10";
      case "fade-in":
        return isVisible 
          ? "opacity-100" 
          : "opacity-0";
      case "slide-in":
        return isVisible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 -translate-x-10";
      default:
        return "";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
