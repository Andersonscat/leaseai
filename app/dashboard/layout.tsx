"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Inbox, Home, BarChart3, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-white cursor-pointer">LeaseAI</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/billing">
              <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-semibold text-sm transition-all">
                Upgrade
              </button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6 sticky top-[73px] self-start">
          <nav className="space-y-2">
            <Link href="/dashboard?tab=inbox">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                pathname === "/dashboard" && !pathname.includes("/property")
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Inbox className="w-5 h-5" />
                <span>Inbox</span>
              </div>
            </Link>
            
            <Link href="/dashboard?tab=properties">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                pathname.includes("/property") || (pathname === "/dashboard")
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Home className="w-5 h-5" />
                <span>Properties</span>
              </div>
            </Link>
            
            <Link href="/dashboard?tab=analytics">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all">
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </div>
            </Link>
            
            <Link href="/billing">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all">
                <CreditCard className="w-5 h-5" />
                <span>Billing</span>
              </div>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
