'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mail, X, Send, Clock, MessageSquare, Trash2, CheckSquare, 
  Bot, Sparkles, RefreshCw, Search, Home, Phone, 
  MessageCircle, FileText, Globe, User, Filter, AlertCircle,
  MoreVertical, ChevronRight, Hash, Inbox, Flag, Layout, ChevronDown
} from 'lucide-react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { refreshInboxBadge } from '../lib/inbox-badge';
import { SOURCE_ICONS, SOURCE_NAMES } from "@/lib/sources";

interface Conversation {
  tenant_id: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  property?: {
    id: string;
    address: string;
    price: string;
  };
  last_message: string;
  last_message_time: string;
  last_sender_type: 'tenant' | 'landlord';
  source: string;
  unread_count: number;
  total_messages: number;
  messages: any[];
}

interface Message {
  id: string;
  sender_type: 'tenant' | 'landlord';
  sender_name: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  is_ai_response?: boolean; // ← Добавляем поле для AI-ответов
}

interface ActionCard {
  id: string;
  type: 'showing' | 'new_lead' | 'follow_up';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  buttonText: string;
  link: string;
}

export default function ConversationsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(true); // Action Required Collapsible State
  const searchParams = useSearchParams();
  const urlSource = searchParams.get('source') || 'all';

  const [selectedSource, setSelectedSource] = useState(urlSource);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [actions, setActions] = useState<ActionCard[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  // Selection mode for deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Textarea ref for auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toast notification helper
  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    try {
      // First check if Gmail is configured
      const statusResponse = await fetch('/api/gmail/status');
      const statusData = await statusResponse.json();

      if (!statusData.status?.configured) {
        showToastNotification(
          '⚠️ Gmail not configured. Add credentials to .env.local (see GMAIL_QUICK_SETUP.md)',
          'error'
        );
        console.warn('Gmail OAuth not configured:', statusData.status?.missing);
        setSyncing(false);
        return;
      }

      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Synced! ${data.created} new leads from ${data.synced} emails`);

        // Update last sync time
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('lastGmailSync', now);

        // Show toast notification
        if (data.created > 0) {
          showToastNotification(`✅ Synced! ${data.created} new lead${data.created > 1 ? 's' : ''} from ${data.synced} emails`);
        } else {
          showToastNotification(`✅ No new leads (checked ${data.synced} emails)`);
        }

        fetchConversations();

        // Refresh inbox badge in sidebar
        refreshInboxBadge();
      } else {
        const errorMsg = data.error?.includes('No access') || data.error?.includes('refresh token')
          ? '⚠️ Gmail OAuth not set up. See GMAIL_QUICK_SETUP.md'
          : `❌ Error: ${data.error}`;
        showToastNotification(errorMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Failed to sync Gmail:', error);
      showToastNotification('❌ Failed to sync Gmail. Check console for details.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Fetchers
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const url = selectedSource === 'all'
        ? '/api/conversations'
        : `/api/conversations?source=${selectedSource}`;
      const response = await fetch(url);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    setLoadingActions(true);
    try {
      const response = await fetch('/api/inbox/actions');
      const data = await response.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  // Load conversations and actions
  // Sync selectedSource with URL
  useEffect(() => {
    setSelectedSource(urlSource);
  }, [urlSource]);

  useEffect(() => {
    fetchConversations();
    fetchActions();
  }, [selectedSource]);

  // Load last sync time and live mode from localStorage
  useEffect(() => {
    const savedSyncTime = localStorage.getItem('lastGmailSync');
    if (savedSyncTime) {
      setLastSyncTime(savedSyncTime);
    }
  }, []);

  // Auto-sync every 5 minutes and poll for new messages every 30 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      console.log('🔄 Auto-syncing Gmail...');
      handleSyncGmail();
    }, 5 * 60 * 1000);

    const pollInterval = setInterval(() => {
      console.log('🕒 Polling for updates...');
      fetchConversations();
      fetchActions();
    }, 30 * 1000); // 30 seconds

    return () => {
      clearInterval(syncInterval);
      clearInterval(pollInterval);
    };
  }, [selectedSource]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [replyText]);


  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Fetch full conversation thread
    try {
      const response = await fetch(`/api/conversations/${conversation.tenant_id}`);
      const data = await response.json();
      setConversationMessages(data.messages || []);

      // Refresh conversations to update unread count
      fetchConversations();

      // Refresh inbox badge in sidebar
      refreshInboxBadge();
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    }
  };


  const handleReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.tenant_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationMessages([...conversationMessages, data.message]);
        setReplyText('');
        fetchConversations(); // Refresh to update last message
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  // ← Генерируем AI ответ и ВСТАВЛЯЕМ В ПОЛЕ (не отправляем сразу!)
  const handleGenerateAIResponse = async () => {
    if (!selectedConversation) return;

    // Получаем последнее сообщение от клиента
    const lastClientMessage = conversationMessages
      .filter(msg => msg.sender_type === 'tenant')
      .pop();

    if (!lastClientMessage) {
      alert('Нет сообщений от клиента для ответа');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.tenant_id}/auto-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMessage: lastClientMessage.message_text
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // ← ВСТАВЛЯЕМ В ПОЛЕ ВВОДА вместо автоотправки!
        setReplyText(data.aiResponse);
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      alert('❌ Failed to generate AI response');
    } finally {
      setGeneratingAI(false);
    }
  };


  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedConversations(new Set());
  };

  const toggleConversationSelection = (tenantId: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(tenantId)) {
      newSelected.delete(tenantId);
    } else {
      newSelected.add(tenantId);
    }
    setSelectedConversations(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedConversations.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedConversations).map(tenantId =>
        fetch(`/api/conversations/${tenantId}/delete`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      // ← Убрали alert, просто закрываем модалку и обновляем список
      setShowDeleteConfirm(false);
      setSelectionMode(false);
      setSelectedConversations(new Set());
      setSelectedConversation(null); // ← Закрываем чат если он был открыт
      fetchConversations();
    } catch (error) {
      console.error('Error deleting conversations:', error);
      // ← Можно оставить только console.error, без alert
    } finally {
      setDeleting(false);
    }
  };

  const totalUnread = conversations.reduce((sum: number, conv: Conversation) => sum + conv.unread_count, 0);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conversation: Conversation) => {
    if (!searchQuery.trim()) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      conversation.tenant?.name?.toLowerCase().includes(searchLower) ||
      conversation.tenant?.email?.toLowerCase().includes(searchLower) ||
      conversation.tenant?.phone?.toLowerCase().includes(searchLower) ||
      conversation.property?.address?.toLowerCase().includes(searchLower) ||
      conversation.last_message?.toLowerCase().includes(searchLower)
    );
  });

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSyncTime) return null;

    const now = new Date();
    const syncDate = new Date(lastSyncTime);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return syncDate.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden relative">
      
      {/* HEADER: SEARCH & FILTERS */}
      <div className="border-b border-gray-100 bg-white z-20 shrink-0">
        <div className="p-6 pr-10 space-y-4">
           {/* Search Bar */}
           <div className="bg-white rounded-2xl p-3 flex items-center border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all w-full shadow-sm hover:shadow-md hover:border-blue-300 group cursor-text" onClick={() => document.getElementById('inbox-search')?.focus()}>
             <div className="pl-4 pr-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <Search className="w-5 h-5" />
             </div>
             <input
               id="inbox-search"
               type="text"
               placeholder="Search conversations..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:border-none focus:ring-0 ring-0 text-base font-medium placeholder:text-gray-400 text-black h-full py-1 w-full selection:bg-blue-100 selection:text-blue-900"
               style={{ outline: 'none', boxShadow: 'none' }}
             />
             <div className="pr-2">
               <div className="h-8 px-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-white group-focus-within:shadow-sm group-focus-within:text-blue-500 group-focus-within:border-blue-100 transition-all">
                  <span className="text-xs font-bold flex items-center gap-1">
                    <span className="text-[10px] opacity-50">⌘</span>
                    /
                  </span>
               </div>
             </div>
           </div>

           {/* Source Pills */}
           <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${
                selectedSource === 'all' 
                  ? 'bg-black text-white border-black shadow-black/20' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-900'
              }`}
            >
              All Sources
            </button>
            <div className="w-px h-4 bg-gray-100 mx-2" />
            {Object.entries(SOURCE_NAMES).filter(([k]) => k !== 'all').map(([key, name]) => {
              const Icon = SOURCE_ICONS[key] || MessageSquare;
              const isActive = selectedSource === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSource(key)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-sm ${
                    isActive 
                      ? 'bg-black text-white border-black shadow-black/20' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {name}
                </button>
              );
            })}
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: CONVERSATION LIST */}
        <div className="w-[400px] border-r border-gray-100 flex flex-col bg-white">
          <div className="p-10 border-b border-gray-50 flex items-center justify-between pointer-events-none select-none">
             <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Recent Messages</h3>
             <Filter className="w-3 h-3 text-gray-300" />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-gray-50">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-black/20 animate-spin mx-auto mb-4" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Refreshing...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">No chats found</p>
                <p className="text-xs text-gray-500">Try changing filters</p>
              </div>
            ) : (
              filteredConversations.map((conversation: Conversation) => {
                const SourceIcon = SOURCE_ICONS[conversation.source] || MessageSquare;
                const isActive = selectedConversation?.tenant_id === conversation.tenant_id;
                
                return (
                  <div
                    key={conversation.tenant_id}
                    onClick={() => {
                        if (selectionMode) {
                          toggleConversationSelection(conversation.tenant_id);
                        } else {
                          openConversation(conversation);
                        }
                    }}
                    className={`p-8 cursor-pointer transition-all relative group hover:bg-gray-50 ${
                      isActive ? 'bg-gray-50' : ''
                    } ${conversation.unread_count > 0 ? 'bg-white' : ''}`}
                  >
                    <div className="flex items-start gap-5">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-[20px] bg-gray-100 flex items-center justify-center text-sm font-black text-gray-400 border border-gray-200 overflow-hidden shadow-sm">
                           {conversation.tenant?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-lg bg-white border border-gray-100 shadow-sm">
                           <SourceIcon className="w-4 h-4 text-black" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className={`text-lg font-bold truncate ${conversation.unread_count > 0 ? 'text-black' : 'text-gray-700'}`}>
                            {conversation.tenant?.name || 'Inquiry'}
                          </h4>
                          <span className="text-xs font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider">
                            {new Date(conversation.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-base truncate leading-relaxed ${
                          conversation.unread_count > 0 ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'
                        }`}>
                          {conversation.last_sender_type === 'landlord' && <span className="opacity-60">You: </span>}
                          {conversation.last_message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: CONTENT VIEW (Right) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedConversation ? (
          <>
            {/* Header */}
            <div className="h-20 px-8 border-b border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-black flex items-center justify-center font-black text-white text-sm shadow-lg shadow-black/20">
                  {selectedConversation.tenant?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-black tracking-tight mb-0.5">{selectedConversation.tenant?.name}</h3>
                  <p className="text-[9px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {selectedConversation.source} • Synced
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all font-black text-xs"
                >
                   <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES VIEW */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-gray-50/30">
              {conversationMessages.map((message, idx) => {
                const isMine = message.sender_type === 'landlord';
                return (
                  <div key={message.id} className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`px-6 py-4 rounded-[24px] text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap max-w-[70%] ${
                      isMine 
                        ? 'bg-black text-white rounded-br-sm shadow-black/10' 
                        : 'bg-white text-gray-600 rounded-bl-sm border border-gray-100'
                    }`}>
                      {message.message_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INPUT AREA */}
            <div className="p-8 bg-white border-t border-gray-100">
               <div className="bg-white rounded-[32px] p-2 border border-gray-200 shadow-xl shadow-gray-100/50 flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 p-4 bg-transparent border-0 focus:ring-0 text-sm resize-none min-h-[56px] max-h-[150px] font-bold text-gray-800 placeholder:text-gray-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <div className="pb-1 pr-1 flex gap-2">
                     <button
                       onClick={handleGenerateAIResponse}
                       className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 hover:scale-110 transition-all"
                     >
                        <Sparkles className="w-5 h-5" />
                     </button>
                     <button
                       onClick={handleReply}
                       className="h-12 px-6 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                     >
                       Send
                     </button>
                  </div>
               </div>
            </div>
          </>
          ) : (
            <div className={`flex-1 flex flex-col overflow-hidden bg-white transition-all duration-300 ${showActions ? '' : 'flex-none h-auto'}`}>
               {/* Header */}
               <div 
                 onClick={() => setShowActions(!showActions)}
                 className="h-24 px-10 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 cursor-pointer group hover:bg-gray-50/50 transition-colors"
               >
                  <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                     Action Required
                  </h3>
                   <div className={`w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-gray-300 group-hover:text-black transition-all ${!showActions ? 'rotate-180' : ''}`}>
                     <ChevronDown className="w-5 h-5" />
                   </div>
               </div>

               {/* Collapsible Content */}
               <div className={`transition-all duration-300 overflow-hidden flex flex-col ${showActions ? 'flex-1 opacity-100' : 'h-0 opacity-0'}`}>
                 <div className="flex-1 overflow-y-auto scrollbar-hide p-10">
                    {/* Actions List */}
                    {actions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl">
                         {actions.map((action: ActionCard) => (
                           <div key={action.id} className="p-6 rounded-[28px] border border-gray-100 bg-white hover:border-black hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 rounded-bl-[80px] -mr-6 -mt-6 opacity-50 group-hover:bg-black/5 transition-colors" />
                              
                              <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                   <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full ${
                                     action.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                   }`}>
                                     {action.type.replace('_', ' ')}
                                   </span>
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2 tracking-tight">{action.title}</h4>
                                <p className="text-[11px] text-gray-500 mb-6 font-bold leading-relaxed max-w-sm">{action.subtitle}</p>
                                
                                <Link href={action.link}>
                                   <button className="w-full py-3 bg-black text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest group-hover:scale-[1.02] transition-transform shadow-lg shadow-black/10">
                                      {action.buttonText}
                                   </button>
                                </Link>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-32 opacity-50">
                         <p className="text-xs font-black text-gray-300 uppercase tracking-widest">All caught up</p>
                      </div>
                    )}
                    
                    {/* Secondary Stats */}
                    <div className="mt-20 pt-10 border-t border-gray-50 flex items-center justify-between">
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Live Monitoring
                       </p>
                       <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                          v2.4.0 • System Active
                       </p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS & TOASTS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] max-w-md w-full p-10 shadow-2xl border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-[30px] flex items-center justify-center mx-auto mb-8">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 text-center mb-4 tracking-tight">Delete Chats?</h3>
            <p className="text-gray-400 text-center mb-10 text-sm font-medium leading-relaxed">
              Are you sure? This will remove {selectedConversations.size} conversation{selectedConversations.size > 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:text-gray-900 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-4 px-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-8 right-8 z-[110] animate-in slide-in-from-right-10 duration-500">
          <div className={`px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 ${
            toastType === 'success' ? 'bg-black text-white border border-white/10' : 'bg-red-600 text-white shadow-red-600/20'
          }`}>
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
               toastType === 'success' ? 'bg-white/10' : 'bg-white/20'
             }`}>
                {toastType === 'success' ? <CheckSquare className="w-4 h-4" /> : <X className="w-4 h-4" />}
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">Notification</p>
                <p className="text-sm font-bold">{toastMessage}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
