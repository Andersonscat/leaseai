"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { Inbox, Home, BarChart3, CreditCard, Sparkles, FileText, Users, Settings, LogOut, User as UserIcon, Calendar, MessageSquare, Briefcase, Palette, HelpCircle, ChevronRight, PanelLeftClose, PanelLeftOpen, MoreVertical, Megaphone, PanelRightOpen, PanelRightClose } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BADGE_REFRESH_EVENT } from "@/lib/inbox-badge";
import { SOURCE_ICONS, SOURCE_NAMES, SMART_FILTERS } from "@/lib/sources";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
          <div className="w-full px-12 py-5 flex justify-between items-center">
            <Link href="/dashboard">
              <h1 className="text-3xl font-bold text-white cursor-pointer px-0">LeaseAI</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/billing">
                <button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded font-semibold text-sm transition-all shadow-lg shadow-white/5 active:scale-95">
                  Upgrade
                </button>
              </Link>
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all"
                title="AI Assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
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
      {/* Header */}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white text-gray-900 border-r border-gray-200 z-50 transition-all duration-300 flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-80'}`}>
          {/* Brand Header */}
          <div className="h-[72px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
             <div 
               onClick={() => isSidebarCollapsed ? setIsSidebarCollapsed(false) : router.push('/dashboard')}
               className={`flex items-center gap-3 group overflow-hidden cursor-pointer relative ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}
             >
                <div className={`w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0 transition-all ${isSidebarCollapsed ? 'group-hover:bg-gray-900' : ''}`}>
                  {isSidebarCollapsed ? (
                    <>
                      <span className="text-white font-black text-lg group-hover:hidden">L</span>
                      <PanelLeftOpen className="w-5 h-5 text-white hidden group-hover:block" />
                    </>
                  ) : (
                    <span className="text-white font-black text-lg">L</span>
                  )}
                </div>
                
                {!isSidebarCollapsed && (
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 animate-in fade-in duration-200">
                    LeaseAI
                  </h1>
                )}

                {/* ChatGPT-style Tooltip */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    Open sidebar
                  </div>
                )}
             </div>
             
             {/* Collapse Button (Only visible when expanded) */}
             {!isSidebarCollapsed && (
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsSidebarCollapsed(!isSidebarCollapsed);
                 }}
                 className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                 title="Collapse Sidebar"
               >
                  <PanelLeftClose className="w-5 h-5" />
               </button>
             )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">

             {[
               { tab: 'inbox', icon: Inbox, label: 'Inbox', badge: unreadCount },
               { tab: 'properties', icon: Home, label: 'Properties' },
               { tab: 'tenants', icon: Users, label: 'Tenants' },
               { tab: 'calendar', icon: Calendar, label: 'Calendar' },
               { tab: 'management', icon: Briefcase, label: 'Management' },
               { tab: 'contracts', icon: FileText, label: 'Contracts' },
               { tab: 'promote', icon: Megaphone, label: 'Promote' },
               { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
             ].map((item) => (
                <Link key={item.tab} href={`/dashboard?tab=${item.tab}`}>
                  <div 
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all group relative ${
                      activeTab === item.tab 
                        ? "bg-black text-white font-bold shadow-md shadow-black/5" 
                        : "text-gray-500 hover:text-black hover:bg-gray-100 font-semibold"
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                     <item.icon className={`w-[22px] h-[22px] flex-shrink-0 ${activeTab === item.tab ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
                     {!isSidebarCollapsed && <span className="text-base tracking-tight">{item.label}</span>}
                     
                     {/* Unread Badge for Inbox */}
                     {item.badge !== undefined && item.badge > 0 && (
                        <span className={`bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm ${
                           isSidebarCollapsed ? 'absolute top-2 right-2 border-white border-2' : 'ml-auto'
                        }`}>
                           {item.badge > 99 ? '99+' : item.badge}
                        </span>
                     )}
                  </div>
                </Link>
             ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-gray-100 bg-white space-y-1">
              {/* AI Button Removed from here */}

             {/* User Profile (ChatGPT Style) */}
             <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm border border-white ring-2 ring-gray-100">
                    {user?.email?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-hidden">
                       <p className="text-base font-bold text-gray-900 truncate">{user?.user_metadata?.full_name || 'User Name'}</p>
                       <p className="text-sm text-gray-500 truncate">Pro Plan</p>
                    </div>
                  )}
                  {!isSidebarCollapsed && (
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Popover Menu */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowUserMenu(false)} />
                    <div className={`absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] p-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isSidebarCollapsed ? 'w-56 left-full ml-2 bottom-0' : ''}`}>
                      <Link href="/billing" onClick={() => setShowUserMenu(false)}>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors">
                           <CreditCard className="w-4 h-4 text-gray-500" />
                           <span className="text-base font-medium">Billing</span>
                        </div>
                      </Link>
                      <Link href="/dashboard?tab=settings" onClick={() => setShowUserMenu(false)}>
                        <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors">
                           <Settings className="w-4 h-4 text-gray-500" />
                           <span className="text-base font-medium">Settings</span>
                        </div>
                      </Link>
                      
                      <div className="h-px bg-gray-100 my-1 mx-2" />

                      <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors">
                           <HelpCircle className="w-4 h-4 text-gray-500" />
                           <span className="text-base font-medium">Help</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-red-600 hover:text-red-700 cursor-pointer transition-colors text-left"
                      >
                           <LogOut className="w-4 h-4" />
                           <span className="text-base font-medium">Log out</span>
                      </button>
                    </div>
                  </>
                )}
             </div>
          </div>
      </aside>

      {/* Main Content */}
      {/* Main Content */}
      {/* Main Content */}
      <main 
        className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}
        style={{ marginRight: showAIChat ? `${chatWidth}px` : '0' }}
      >
        {children}
      </main>

      {/* AI Trigger - Right edge, aligned with sidebar header */}
      {!showAIChat && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed top-6 right-4 z-50 w-9 h-9 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
          title="Open AI Assistant"
        >
          <PanelRightClose className="w-5 h-5" />
        </button>
      )}

      {/* AI Chat Panel - Resizable */}
      <aside 
        className={`fixed right-0 top-0 h-screen bg-white border-l border-gray-200 z-40 flex flex-col transition-transform duration-300 ${
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
