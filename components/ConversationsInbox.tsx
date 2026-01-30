'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, X, Send, Clock, MessageSquare, Trash2, CheckSquare, Bot, Sparkles, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { refreshInboxBadge } from '../lib/inbox-badge';

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

const SOURCE_ICONS: Record<string, string> = {
  zillow: '🏠',
  airbnb: '🏡',
  facebook: '📘',
  email: '📧',
  sms: '📱',
  whatsapp: '💬',
  craigslist: '📝',
  manual: '✋',
};

const SOURCE_NAMES: Record<string, string> = {
  zillow: 'Zillow',
  airbnb: 'Airbnb',
  facebook: 'Facebook',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  craigslist: 'Craigslist',
  manual: 'Manual',
};

export default function ConversationsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false); // ← AI generation state
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true); // Auto-sync enabled by default
  
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

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, [selectedSource]);

  // Load last sync time and live mode from localStorage
  useEffect(() => {
    const savedSyncTime = localStorage.getItem('lastGmailSync');
    if (savedSyncTime) {
      setLastSyncTime(savedSyncTime);
    }
    
    const savedLiveMode = localStorage.getItem('gmailLiveMode');
    if (savedLiveMode !== null) {
      setIsLive(savedLiveMode === 'true');
    }
  }, []);

  // Save live mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('gmailLiveMode', String(isLive));
  }, [isLive]);

  // Auto-sync every 5 minutes when Live mode is enabled
  useEffect(() => {
    if (!isLive) return;

    // Set up interval for auto-sync
    const syncInterval = setInterval(() => {
      console.log('🔄 Auto-syncing Gmail...');
      handleSyncGmail();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup on unmount
    return () => {
      clearInterval(syncInterval);
    };
  }, [isLive]); // Re-run if isLive changes

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [replyText]);

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

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conversation) => {
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
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-black mb-2">Inbox</h2>
          <p className="text-lg text-gray-600">
            {selectionMode ? (
              `${selectedConversations.size} selected`
            ) : (
              totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''} in ${conversations.filter(c => c.unread_count > 0).length} conversation${conversations.filter(c => c.unread_count > 0).length > 1 ? 's' : ''}` : 'All caught up!'
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {selectionMode ? (
            <>
              {selectedConversations.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete ({selectedConversations.size})
                </button>
              )}
              <button
                onClick={toggleSelectionMode}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {lastSyncTime && (
                  <span className="text-sm text-gray-500">
                    Last synced {getLastSyncText()}
                  </span>
                )}
                <button
                  onClick={handleSyncGmail}
                  disabled={syncing}
                  title={syncing ? 'Syncing...' : 'Sync Gmail'}
                  className="bg-white text-black w-10 h-10 rounded-md font-medium hover:bg-gray-50 transition-all flex items-center justify-center disabled:opacity-50 border border-gray-300 shadow-sm"
                >
                  <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-4 py-2.5 rounded-md font-medium transition-all border shadow-sm ${
                  isLive
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title={isLive ? 'Auto-sync enabled (every 5 min)' : 'Auto-sync disabled'}
              >
                <span className="text-sm">{isLive ? 'Live' : 'Manual'}</span>
              </button>
              {conversations.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className="bg-white text-gray-700 px-5 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-all flex items-center gap-2 border border-gray-300 shadow-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-sm">Select</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Today's Showings Widget */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-black mb-1">Today's Showings</h3>
            <p className="text-sm text-gray-500">January 22, 2026</p>
          </div>
          <Link href="/dashboard?tab=calendar">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-all">
              View All →
            </button>
          </Link>
        </div>

        {/* Showings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              time: '2:00 PM',
              property: '123 Main St, Apt 4B',
              tenant: 'John Smith',
              status: 'confirmed',
            },
            {
              id: 2,
              time: '4:30 PM',
              property: '456 Oak Avenue',
              tenant: 'Sarah Johnson',
              status: 'pending',
            },
            {
              id: 3,
              time: '6:00 PM',
              property: '789 Pine Street',
              tenant: 'Michael Brown',
              status: 'confirmed',
            },
          ].map((showing) => (
            <div
              key={showing.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl font-bold text-black">{showing.time}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  showing.status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {showing.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">{showing.property}</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{showing.tenant}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State - Alternative */}
        {/* Uncomment if no showings today:
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">No showings scheduled for today</p>
        </div>
        */}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations by name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Source Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedSource('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            selectedSource === 'all'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Sources
        </button>
        {Object.entries(SOURCE_NAMES).map(([key, name]) => (
          <button
            key={key}
            onClick={() => setSelectedSource(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedSource === key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{SOURCE_ICONS[key]}</span>
            {name}
          </button>
        ))}
      </div>

      {/* Two-column layout: Conversations List + Chat Panel */}
      <div className={`grid gap-6 transition-all ${selectedConversation ? 'grid-cols-[400px_1fr]' : 'grid-cols-1'}`}>
        {/* Conversations List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-black rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-black mb-2">No conversations yet</h4>
            <p className="text-gray-600">
              Sync your Gmail to automatically import leads from emails
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-black mb-2">No conversations found</h4>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or clear the search to see all conversations.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.tenant_id}
                onClick={(e) => {
                  if (selectionMode) {
                    e.stopPropagation();
                    toggleConversationSelection(conversation.tenant_id);
                  } else {
                    openConversation(conversation);
                  }
                }}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-all ${
                  conversation.unread_count > 0 ? 'bg-blue-50/30' : ''
                } ${
                  selectionMode && selectedConversations.has(conversation.tenant_id) ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedConversations.has(conversation.tenant_id)}
                      onChange={() => toggleConversationSelection(conversation.tenant_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 mt-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xl relative">
                    {conversation.tenant?.avatar ? (
                      <img src={conversation.tenant.avatar} alt={conversation.tenant.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      conversation.tenant?.name?.charAt(0).toUpperCase()
                    )}
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="font-semibold text-black flex items-center gap-2">
                          {conversation.tenant?.name || 'Unknown'}
                        </h4>
                        {conversation.property && (
                          <p className="text-sm text-gray-500">
                            Re: {conversation.property.address}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(conversation.last_message_time).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium flex items-center gap-1">
                          <span>{SOURCE_ICONS[conversation.source]}</span>
                          {SOURCE_NAMES[conversation.source]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conversation.last_sender_type === 'landlord' && (
                        <span className="text-sm text-gray-500">You:</span>
                      )}
                      <p className={`text-sm flex-1 line-clamp-1 ${
                        conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {conversation.last_message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {conversation.total_messages} message{conversation.total_messages > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Conversation Thread Panel (Right Side) */}
        {selectedConversation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-160px)] sticky top-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                  {selectedConversation.tenant?.avatar ? (
                    <img src={selectedConversation.tenant.avatar} alt={selectedConversation.tenant.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedConversation.tenant?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-black truncate">{selectedConversation.tenant?.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{SOURCE_ICONS[selectedConversation.source]}</span>
                    <span>{SOURCE_NAMES[selectedConversation.source]}</span>
                    {selectedConversation.tenant?.email && (
                      <>
                        <span>•</span>
                        <span className="truncate">{selectedConversation.tenant.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setConversationMessages([]);
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'landlord' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-lg ${
                      message.sender_type === 'landlord'
                        ? message.is_ai_response
                          ? 'bg-gray-100 border border-gray-200' // ← AI: светло-серый
                          : 'bg-black text-white' // ← Ручной ответ: черный
                        : 'bg-white shadow-sm border border-gray-200' // ← Клиент: белый
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5 gap-4">
                      <div className="flex items-center gap-1.5">
                        {/* ← Простой текст вместо иконки */}
                        <span className={`font-medium text-xs ${
                          message.sender_type === 'landlord' 
                            ? message.is_ai_response 
                              ? 'text-gray-500' 
                              : 'text-gray-400'
                            : 'text-gray-600'
                        }`}>
                          {message.is_ai_response ? 'AI Draft' : message.sender_name}
                        </span>
                      </div>
                      <span className={`text-xs ${
                        message.sender_type === 'landlord' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      message.sender_type === 'landlord' 
                        ? message.is_ai_response 
                          ? 'text-gray-700' 
                          : 'text-white'
                        : 'text-gray-800'
                    }`}>
                      {message.message_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input - Messenger Style */}
            <div className="p-6 border-t border-gray-300 bg-white space-y-3">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Message"
                  rows={1}
                  className="flex-1 px-0 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:outline-none focus:border-black text-gray-900 placeholder:text-gray-400 text-base resize-none overflow-y-auto min-h-[40px] max-h-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="w-10 h-10 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  title={sending ? 'Sending...' : 'Send'}
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* ← AI Draft Generator */}
              <button
                onClick={handleGenerateAIResponse}
                disabled={generatingAI || conversationMessages.filter(m => m.sender_type === 'tenant').length === 0}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm border border-gray-200"
              >
                {generatingAI ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                    <span>Generating draft...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-gray-500" />
                    <span>Generate AI Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-black text-center mb-3">
              Delete Conversations?
            </h3>
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to delete {selectedConversations.size} conversation{selectedConversations.size > 1 ? 's' : ''}? 
              <br />
              <span className="text-red-600 font-semibold">This action cannot be undone.</span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
            toastType === 'success' 
              ? 'bg-black text-white' 
              : 'bg-red-600 text-white'
          }`}>
            <span className="text-sm font-medium">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-auto hover:opacity-80 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
