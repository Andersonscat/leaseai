"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Inbox, Home, BarChart3, CreditCard, Sparkles, FileText, Users, Settings, LogOut, User as UserIcon, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BADGE_REFRESH_EVENT } from "@/lib/inbox-badge";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "properties";
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    loadUser();
  }, [supabase]);

  // Load unread messages count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('sender_type', 'tenant') // Only count messages from clients
          .eq('is_read', false);
        
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };
    
    loadUnreadCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    
    // Listen for manual refresh events (when user opens conversation)
    const handleRefresh = () => loadUnreadCount();
    window.addEventListener(BADGE_REFRESH_EVENT, handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener(BADGE_REFRESH_EVENT, handleRefresh);
    };
  }, [user, supabase]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Check if we're on the contract editor page
  const isContractEditor = pathname.includes('/contract/');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // If we're on contract editor, render without sidebar but WITH AI chat
  if (isContractEditor) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header - Same as dashboard */}
        <header className="bg-black sticky top-0 z-50">
          <div className="container mx-auto px-6 py-5 flex justify-between items-center">
            <Link href="/dashboard">
              <h1 className="text-3xl font-bold text-white cursor-pointer">LeaseAI</h1>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all"
                title="AI Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <Link href="/billing">
                <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-semibold text-sm transition-all">
                  Upgrade
                </button>
              </Link>
              <div className="scale-125 flex items-center justify-center relative">
                <div 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-700 transition-all" 
                  title={user?.email || 'User'}
                >
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">{user?.user_metadata?.full_name || 'User'}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                      
                      {/* Log Out */}
                      <div 
                        onClick={handleLogout}
                        className="px-4 py-3 hover:bg-red-50 cursor-pointer flex items-center gap-3 text-red-600 font-medium transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Log Out</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - No sidebar, no left margin */}
        <main 
          className="transition-all duration-300"
          style={{ marginRight: showAIChat ? `${chatWidth}px` : '0' }}
        >
          {children}
        </main>

        {/* AI Chat Panel - Resizable */}
        <aside 
          className={`fixed right-0 top-[81px] h-[calc(100vh-81px)] bg-white border-l border-gray-200 z-40 flex flex-col transition-transform duration-300 ${
            showAIChat ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: `${chatWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 cursor-ew-resize hover:bg-blue-500 transition-colors z-50"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute left-0 top-0 bottom-0 w-4 -translate-x-1.5" />
          </div>

          {/* Header */}
          <div className="p-6 border-b border-gray-100 pl-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-black">AI Assistant</h2>
              <button
                onClick={() => setShowAIChat(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 pl-8">
            {/* AI Welcome Message */}
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                  <p className="text-gray-800 text-base mb-2">
                    Hi! I can help you with your contract:
                  </p>
                  <ul className="space-y-1 text-base text-gray-600">
                    <li>• Suggest legal clauses</li>
                    <li>• Review contract terms</li>
                    <li>• Answer legal questions</li>
                    <li>• Check for missing sections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white pl-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about the contract..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-3xl font-bold text-white cursor-pointer">LeaseAI</h1>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all"
              title="AI Assistant"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <Link href="/billing">
              <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-semibold text-sm transition-all">
                Upgrade
              </button>
            </Link>
            <div className="scale-125 flex items-center justify-center relative">
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-700 transition-all" 
                title={user?.email || 'User'}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  
                  {/* Menu */}
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">{user?.user_metadata?.full_name || 'User'}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                    
                    {/* Log Out */}
                    <div 
                      onClick={handleLogout}
                      className="px-4 py-3 hover:bg-red-50 cursor-pointer flex items-center gap-3 text-red-600 font-medium transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-[81px] w-64 h-[calc(100vh-81px)] bg-white border-r border-gray-200 overflow-y-auto z-40">
        <div className="flex flex-col h-full">
          {/* Main Navigation */}
          <nav className="space-y-2 p-6 flex-1">
            <Link href="/dashboard?tab=inbox">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all relative ${
                activeTab === "inbox" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Inbox className="w-5 h-5" />
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
            

            <Link href="/dashboard?tab=tenants">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === "tenants" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Users className="w-5 h-5" />
                <span>Tenants</span>
              </div>
            </Link>
            
            <Link href="/dashboard?tab=calendar">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === "calendar" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </div>
            </Link>

            <Link href="/dashboard?tab=contracts">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === "contracts" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <FileText className="w-5 h-5" />
                <span>Contracts</span>
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

          {/* Settings at Bottom */}
          <div className="p-6 pt-0 space-y-2">
            <Link href="/dashboard?tab=profile">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === "profile" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black"
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <UserIcon className="w-5 h-5" />
                <span>Profile</span>
              </div>
            </Link>

            <Link href="/dashboard?tab=settings">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === "settings" && pathname === "/dashboard"
                  ? "bg-gray-100 text-black"
                  : "hover:bg-gray-50 text-gray-700"
              }`}>
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all hover:bg-red-50 text-red-600 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="ml-64 transition-all duration-300"
        style={{ marginRight: showAIChat ? `${chatWidth}px` : '0' }}
      >
        {children}
      </main>

      {/* AI Chat Panel - Resizable */}
      <aside 
        className={`fixed right-0 top-[81px] h-[calc(100vh-81px)] bg-white border-l border-gray-200 z-40 flex flex-col transition-transform duration-300 ${
          showAIChat ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${chatWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 cursor-ew-resize hover:bg-blue-500 transition-colors z-50"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-4 -translate-x-1.5" />
        </div>

        {/* Header */}
        <div className="p-6 border-b border-gray-100 pl-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">AI Assistant</h2>
            <button
              onClick={() => setShowAIChat(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 pl-8">
          {/* AI Welcome Message */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-gray-800 text-base mb-2">
                  Hi! I'm your AI assistant. I can help you with:
                </p>
                <ul className="space-y-1 text-base text-gray-600">
                  <li>• Drafting messages to tenants</li>
                  <li>• Analyzing property performance</li>
                  <li>• Answering real estate questions</li>
                  <li>• Managing your listings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white pl-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask AI anything..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen"><div className="w-64 bg-white border-r border-gray-200" /></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
