'use client';

import { useState, useEffect } from 'react';
import { Mail, X, Send, Clock, MessageSquare, Trash2, CheckSquare } from 'lucide-react';

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
  
  // Selection mode for deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, [selectedSource]);

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

  const handleSyncGmail = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Synced! ${data.created} new leads from ${data.synced} emails`);
        fetchConversations();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      alert('❌ Failed to sync Gmail');
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
      
      alert(`✅ Deleted ${selectedConversations.size} conversation(s)`);
      setShowDeleteConfirm(false);
      setSelectionMode(false);
      setSelectedConversations(new Set());
      fetchConversations();
    } catch (error) {
      console.error('Error deleting conversations:', error);
      alert('❌ Failed to delete conversations');
    } finally {
      setDeleting(false);
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

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
              <button
                onClick={handleSyncGmail}
                disabled={syncing}
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-5 h-5" />
                {syncing ? 'Syncing...' : 'Sync Gmail'}
              </button>
              {conversations.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                  <CheckSquare className="w-5 h-5" />
                  Select
                </button>
              )}
            </>
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
            <p className="text-gray-600 mb-6">
              Sync your Gmail to automatically import leads from emails
            </p>
            <button
              onClick={handleSyncGmail}
              disabled={syncing}
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {syncing ? 'Syncing...' : 'Sync Gmail'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-160px)] sticky top-4">
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
                    className={`max-w-[70%] rounded-xl px-4 py-3 ${
                      message.sender_type === 'landlord'
                        ? 'bg-black text-white'
                        : 'bg-white shadow-sm border border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1 gap-4">
                      <span className={`font-semibold text-sm ${
                        message.sender_type === 'landlord' ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        {message.sender_name}
                      </span>
                      <span className={`text-xs whitespace-nowrap ${
                        message.sender_type === 'landlord' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={message.sender_type === 'landlord' ? 'text-white' : 'text-gray-700'}>
                      {message.message_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input - Uber Style */}
            <div className="p-6 border-t border-gray-300 bg-white">
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Message"
                  className="flex-1 px-0 py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:outline-none focus:border-black text-gray-900 placeholder:text-gray-400 text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
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
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
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
    </>
  );
}
