"use client";

import React from "react";

interface AvatarProps {
  src?: string;
  name?: string;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const COLORS = [
  "#4285f4", // Blue
  "#db4437", // Red
  "#f4b400", // Yellow
  "#0f9d58", // Green
  "#ab47bc", // Purple
  "#e91e63", // Pink
  "#00acc1", // Cyan
  "#ff7043", // Orange
  "#00897b", // Teal
  "#3f51b5", // Indigo
];

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-base",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function Avatar({ src, name, email, size = "md", className = "" }: AvatarProps) {
  const initials = React.useMemo(() => {
    if (name) {
      const parts = name.split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  }, [name, email]);

  const bgColor = React.useMemo(() => {
    const identifier = name || email || "fallback";
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = (hash << 5) - hash + identifier.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
  }, [name, email]);

  if (src && src.trim() !== "" && !src.includes("ui-avatars.com")) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${SIZES[size]} rounded-full object-cover shrink-0 ${className}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
      style={{ backgroundColor: bgColor }}
      title={name || email}
    >
      {initials}
    </div>
  );
}
