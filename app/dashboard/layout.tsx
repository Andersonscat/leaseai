"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Inbox, Home, BarChart3, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-white cursor-pointer">LeaseAI</h1>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <Link href="/billing">
              <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-semibold text-sm transition-all">
                Upgrade
              </button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[73px] w-64 h-[calc(100vh-73px)] bg-white border-r border-gray-200 p-6 overflow-y-auto z-40">
        <nav className="space-y-2">
          <Link href="/dashboard?tab=inbox">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "inbox" && pathname === "/dashboard"
                ? "bg-gray-100 text-black" 
                : "hover:bg-gray-50 text-gray-700"
            }`}>
              <Inbox className="w-5 h-5" />
              <span>Inbox</span>
            </div>
          </Link>
          
          <Link href="/dashboard?tab=properties">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              (activeTab === "properties" && pathname === "/dashboard") || pathname.includes("/property")
                ? "bg-gray-100 text-black" 
                : "hover:bg-gray-50 text-gray-700"
            }`}>
              <Home className="w-5 h-5" />
              <span>Properties</span>
            </div>
          </Link>
          
          <Link href="/dashboard?tab=analytics">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "analytics" && pathname === "/dashboard"
                ? "bg-gray-100 text-black"
                : "hover:bg-gray-50 text-gray-700"
            }`}>
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </div>
          </Link>
          
          <Link href="/billing">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              pathname === "/billing"
                ? "bg-gray-100 text-black"
                : "hover:bg-gray-50 text-gray-700"
            }`}>
              <CreditCard className="w-5 h-5" />
              <span>Billing</span>
            </div>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>

      {/* AI Chat Panel - Cursor Style */}
      {showAIChat && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-50"
            onClick={() => setShowAIChat(false)}
          />
          
          {/* Chat Panel */}
          <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-black">AI Assistant</h2>
                    <p className="text-sm text-gray-500">Ask me anything</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* AI Welcome Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                    <p className="text-gray-800">
                      Hi! I'm your AI assistant. I can help you with:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li>• Drafting messages to tenants</li>
                      <li>• Analyzing property performance</li>
                      <li>• Answering real estate questions</li>
                      <li>• Managing your listings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Example: User message (commented for now) */}
              {/* <div className="flex gap-3 justify-end">
                <div className="bg-black text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                  <p>Help me draft a response to Sarah Johnson</p>
                </div>
              </div> */}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask AI anything..."
                  className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
