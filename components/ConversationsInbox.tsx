'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mail, X, Send, Clock, MessageSquare, Trash2, CheckSquare, 
  Bot, Sparkles, RefreshCw, Search, Home, Phone, 
  MessageCircle, FileText, Globe, User, Filter, AlertCircle,
  MoreVertical, ChevronRight, Hash, Inbox, Flag, Layout, ChevronDown,
  PanelLeftClose, PanelLeftOpen, ChevronsLeft, ChevronsRight,
  DollarSign, Calendar, ChevronUp, MapPin, ExternalLink,
  Star, CornerUpLeft
} from 'lucide-react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';
import { refreshInboxBadge } from '../lib/inbox-badge';
import { SOURCE_ICONS, SOURCE_NAMES } from "@/lib/sources";
import AIThinkingPanel, { ThinkingStep } from './AIThinkingPanel';
import ActiveLeadsTable from './ActiveLeadsTable';
import AIActivityTimeline, { ActivityEvent } from './AIActivityTimeline';
import { createSupabaseClient } from '@/lib/supabase';
import Avatar from './Avatar';

interface Conversation {
  tenant_id: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    auto_reply_enabled: boolean;
    ai_summary?: string;
    budget_max?: number;
    move_in_date?: string;
    lead_priority?: 'hot' | 'warm' | 'cold';
    pet_details?: string;
    qualification_status?: string;
    lead_score?: number;
    lead_quality?: string;
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
  sender_type: 'tenant' | 'landlord' | 'ai_reasoning';
  sender_name: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
  is_ai_response?: boolean; 
  thoughts?: ThinkingStep[]; // For persistent reasoning
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActions, setShowActions] = useState(true); // Action Required Collapsible State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const searchParams = useSearchParams();
  const urlSource = searchParams.get('source') || 'all';

  const [selectedSource, setSelectedSource] = useState(urlSource);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([
    { id: '1', label: 'Context Analysis', status: 'pending', iconType: 'analyze', description: "Analyzing the client's intent and previous conversation history to understand the exact requirements..." },
    { id: '2', label: 'Knowledge Retrieval', status: 'pending', iconType: 'search', description: "Accessing the property database to find available listings that match the client's criteria and price range..." },
    { id: '3', label: 'Strategic Reasoning', status: 'pending', iconType: 'reason', description: "Evaluating property matches, calculating availability dates, and identifying the best recommendation..." },
    { id: '4', label: 'Drafting Response', status: 'pending', iconType: 'draft', description: "Synthesizing all information into a professional, personalized response for the client..." }
  ]);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [showAIOverview, setShowAIOverview] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'attention' | 'hot' | 'viewings'>('all');

  // Activity Events State (Mock for now)
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([
    {
      id: 'act-1',
      type: 'scheduling',
      title: 'Viewing Scheduled',
      description: 'AI matched availability for a tour request.',
      timestamp: '11:33 AM',
      leadName: 'John Doe'
    },
    {
      id: 'act-2',
      type: 'qualification',
      title: 'Lead Qualified',
      description: 'AI verified income and pet requirements.',
      timestamp: '11:32 AM',
      leadName: 'King Jones'
    },
    {
      id: 'act-3',
      type: 'reply',
      title: 'Auto-reply Sent',
      description: 'AI answered question about utility bills.',
      timestamp: '11:30 AM',
      leadName: 'Stephen Morden'
    }
  ]);

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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (conversationMessages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [conversationMessages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Show button if we are more than 300px away from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollButton(!isAtBottom);
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    try {
      // First check if Gmail is configured
      const statusResponse = await fetch('/api/gmail/status');
      const statusData = await statusResponse.json();

      if (!statusData.status?.configured) {
        showToastNotification(
          'Gmail not configured. Add credentials to .env.local (see GMAIL_QUICK_SETUP.md)',
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
          showToastNotification(`Synced! ${data.created} new lead${data.created > 1 ? 's' : ''} from ${data.synced} emails`);
        } else {
          showToastNotification(`No new leads (checked ${data.synced} emails)`);
        }

        fetchConversations(false);

        // Refresh inbox badge in sidebar
        refreshInboxBadge();
      } else {
        const errorMsg = data.error?.includes('No access') || data.error?.includes('refresh token')
          ? 'Gmail OAuth not set up. See GMAIL_QUICK_SETUP.md'
          : `Error: ${data.error}`;
        showToastNotification(errorMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Failed to sync Gmail:', error);
      showToastNotification('Failed to sync Gmail. Check console for details.', 'error');
    } finally {
      setSyncing(false);
    }
  };
  const handleRefreshAnalysis = async () => {
    if (!selectedConversation) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.tenant_id}/analyze`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ AI Analysis Error Data:', data);
        throw new Error(data.error || 'Analysis failed');
      }
      
      if (data.success) {
        showToastNotification('AI Analysis complete! Client data updated.', 'success');
        
        // Update local selectedConversation state manually to avoid full re-fetch
        setSelectedConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tenant: {
              ...prev.tenant!,
              ...data.updatedData
            }
          };
        });

        // Also fetch conversations in background to update the list sidebar
        fetchConversations(false);
      }
    } catch (err) {
      console.error('❌ AI Analysis failed:', err);
      showToastNotification('Failed to re-analyze conversation', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetchers
  const fetchConversations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsRefreshing(true);
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
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchActions = async (showLoading = true) => {
    if (showLoading) setLoadingActions(true);
    try {
      const response = await fetch('/api/inbox/actions');
      const data = await response.json();
      setActions(data.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      if (showLoading) setLoadingActions(false);
    }
  };

  // Load conversations and actions
  // Sync selectedSource with URL
  useEffect(() => {
    setSelectedSource(urlSource);
  }, [urlSource]);

  useEffect(() => {
    // Small delay so Supabase session cookie is available before the first fetch
    const timer = setTimeout(() => {
      fetchConversations(true);
      fetchActions(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedSource]);

  // Refresh inbox when user brings browser tab back into focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible — refreshing inbox...');
        fetchConversations(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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
    }, 60 * 1000); // 60 seconds (fast polling for dev, webhook handles prod)

    const pollInterval = setInterval(() => {
      console.log('🕒 Polling for updates (background)...');
      fetchConversations(false);
      fetchActions(false);
    }, 30 * 1000); // 30 seconds

    return () => {
      clearInterval(syncInterval);
      clearInterval(pollInterval);
    };
  }, [selectedSource]);

  // 🔴 Supabase Realtime — instantly update inbox when a new message arrives
  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel('inbox-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          console.log('📨 Realtime: new message — refreshing inbox...');
          fetchConversations(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSource]);


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 800);
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [replyText]);

  // AUTO-SCROLL to bottom when AI is thinking or new messages arrive
  useEffect(() => {
    if (generatingAI || conversationMessages.length > 0) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  }, [generatingAI, thinkingSteps, conversationMessages]);


  const [loadingMessages, setLoadingMessages] = useState(false);

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setConversationMessages([]); // Clear stale messages immediately
    setLoadingMessages(true);

    // Optimistically update local unread counts
    setConversations(prev => prev.map(c => 
      c.tenant_id === conversation.tenant_id ? { ...c, unread_count: 0 } : c
    ));
    // Trigger global UI unread count refresh early
    if (conversation.unread_count && conversation.unread_count > 0) {
      refreshInboxBadge();
    }

    // FAST PATH: Use messages already loaded in conversation list (sorted ascending for chat view)
    if (conversation.messages && conversation.messages.length > 0) {
      const sorted = [...conversation.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setConversationMessages(sorted);
      setLoadingMessages(false);
    }

    // BACKGROUND: Also call detail API to mark messages as read + get full data
    try {
      const response = await fetch(`/api/conversations/${conversation.tenant_id}`);
      console.log(`📬 GET /api/conversations/${conversation.tenant_id} → status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`❌ API returned ${response.status} for tenant ${conversation.tenant_id}`);
        // Don't show error if we already have messages from fast path
        if (!conversation.messages?.length) {
          showToastNotification(`Failed to load messages (HTTP ${response.status})`, 'error');
        }
        return;
      }
      
      const data = await response.json();
      console.log(`📬 Messages from detail API: ${data.messages?.length ?? 0}`);
      
      if (data.messages && data.messages.length > 0) {
        setConversationMessages(data.messages); // Update with full data (includes tenant/property joins)
      }

      // Refresh inbox badge in sidebar
      refreshInboxBadge();
      // Refresh conversations to update unread count
      fetchConversations(false);
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleToggleAI = async () => {
    if (!selectedConversation) return;

    const newValue = !selectedConversation.tenant?.auto_reply_enabled;
    
    // Optimistic update
    const updatedConv: Conversation = {
      ...selectedConversation,
      tenant: {
        ...(selectedConversation.tenant || {
          id: selectedConversation.tenant_id,
          name: 'Unknown',
          email: '',
          phone: '',
          avatar: '',
          auto_reply_enabled: false
        }),
        auto_reply_enabled: newValue
      }
    };
    setSelectedConversation(updatedConv);
    setConversations(prev => prev.map(c => 
      c.tenant_id === selectedConversation.tenant_id ? updatedConv : c
    ));

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.tenant_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_reply_enabled: newValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update AI settings');
      }
      
      showToastNotification(`AI Assistant ${newValue ? 'enabled' : 'disabled'} for this chat`);
    } catch (error) {
      console.error('Error toggling AI:', error);
      showToastNotification('Failed to update AI settings', 'error');
      // Rollback
      fetchConversations(false);
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
        fetchConversations(false); // Refresh in background to update last message
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
    
    // Reset steps to pending
    setThinkingSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const })));

    const updateStep = (id: string, status: ThinkingStep['status'], description?: string) => {
      setThinkingSteps(prev => prev.map(s => 
        s.id === id ? { ...s, status, ...(description ? { description } : {}) } : s
      ));
    };

    try {
      // Start API call early since we need the thoughts
      const apiPromise = fetch(`/api/conversations/${selectedConversation.tenant_id}/auto-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientMessage: lastClientMessage.message_text
        }),
      });

      // Step 1: Analyze
      updateStep('1', 'active');
      await new Promise(r => setTimeout(r, 1000));
      
      const response = await apiPromise;
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        throw new Error(errorData.error);
      }
      
      const data = await response.json();
      const thoughts = data.thoughts || {};

      // Sequential Step Simulation based on typing length
      // Step 1 Finish
      const analyzeText = thoughts.analyze || '';
      updateStep('1', 'active', analyzeText);
      await new Promise(r => setTimeout(r, analyzeText.length * 20 + 800)); // typing time + pause
      updateStep('1', 'completed', analyzeText);

      // Step 2: Search
      const searchText = thoughts.search || `Checking inventory...`;
      updateStep('2', 'active', searchText);
      await new Promise(r => setTimeout(r, searchText.length * 20 + 800));
      updateStep('2', 'completed', searchText);

      // Step 3: Reason
      const reasonText = thoughts.reason || '';
      updateStep('3', 'active', reasonText);
      await new Promise(r => setTimeout(r, reasonText.length * 20 + 800));
      updateStep('3', 'completed', reasonText);

      // Step 4: Draft
      const draftText = thoughts.draft || '';
      updateStep('4', 'active', draftText);
      await new Promise(r => setTimeout(r, draftText.length * 20 + 600));
      updateStep('4', 'completed', draftText);

      await new Promise(r => setTimeout(r, 500));
      setReplyText(data.aiResponse);

      // PERSIST REASONING: Add to database
      const finalThoughts = [...thinkingSteps];
      // Final update of the steps with real descriptions from backend
      finalThoughts[0].status = 'completed';
      finalThoughts[0].description = analyzeText;
      finalThoughts[1].status = 'completed';
      finalThoughts[1].description = searchText;
      finalThoughts[2].status = 'completed';
      finalThoughts[2].description = reasonText;
      finalThoughts[3].status = 'completed';
      finalThoughts[3].description = draftText;

      const reasoningMsg = {
        sender_type: 'ai_reasoning',
        message: 'Reasoning process:',
        thoughts: finalThoughts
      };

      // PERSIST TO DATABASE
      await fetch(`/api/conversations/${selectedConversation.tenant_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reasoningMsg),
      });

      // Refresh messages to show the persisted reasoning
      const res = await fetch(`/api/conversations/${selectedConversation.tenant_id}`);
      const refreshedData = await res.json();
      setConversationMessages(refreshedData.messages || []);
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setGeneratingAI(false);
    }
  };


  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedConversations(new Set());
  };

  const toggleSelection = (tenantId: string) => {
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
      fetchConversations(false);
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
    // 1. Smart Filter
    if (activeFilter === 'attention' && conversation.unread_count === 0) return false;
    if (activeFilter === 'hot' && conversation.tenant?.lead_priority !== 'hot' && (conversation.tenant?.lead_score || 0) < 80) return false;
    if (activeFilter === 'viewings' && conversation.tenant?.qualification_status !== 'Tour Scheduled') return false;

    // 2. Source Filter
    if (selectedSource !== 'all' && conversation.source !== selectedSource) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      return (
        conversation.tenant?.name?.toLowerCase().includes(searchLower) ||
        conversation.tenant?.email?.toLowerCase().includes(searchLower) ||
        conversation.tenant?.phone?.toLowerCase().includes(searchLower) ||
        conversation.property?.address?.toLowerCase().includes(searchLower) ||
        conversation.last_message?.toLowerCase().includes(searchLower)
      );
    }

    return true;
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

  // Helper to format date for headers (e.g., "Monday, Feb 3")
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper to render message text with Markdown support (links, bold)
  const renderMessageText = (text: string) => {
    if (!text) return null;

    // Split by Markdown links [text](url)
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    
    return parts.map((part, i) => {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a 
            key={i} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()} // Prevent bubble click events
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      
      // Handle bold text **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((boldPart, j) => {
        const boldMatch = boldPart.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          return <strong key={`${i}-${j}`} className="font-bold text-gray-900">{boldMatch[1]}</strong>;
        }
        return <span key={`${i}-${j}`}>{boldPart}</span>;
      });
    });
  };

  // Helper to format time for messages (e.g., "2:00 PM")
  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Map conversations to Leads format for the table
  const tableLeads = filteredConversations.map(conv => ({
    id: conv.tenant_id,
    name: conv.tenant?.name || 'Unknown',
    avatar: conv.tenant?.avatar,
    source: conv.source,
    propertyAddress: conv.property?.address || 'Unknown Property',
    propertyUnit: '402',
    pipelineStage: conv.tenant?.qualification_status || 'New Lead',
    status: conv.tenant?.qualification_status || 'New Lead',
    leadScore: conv.tenant?.lead_score || 0,
    leadQuality: conv.tenant?.lead_quality || 'cold',
    lastAction: getLastSyncText() || 'Just now',
    updatedAt: conv.last_message_time || new Date().toISOString(),
    nextStep: conv.unread_count > 0 ? 'Reply Needed' : 'Wait for response'
  }));

  return (
    <div className="h-screen flex flex-col bg-premium-mesh overflow-hidden relative">
      {/* Masked Grid Background (Aligned with Landing Page) */}
      <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none" 
           style={{ 
              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(circle at center, black 10%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 95%)'
           }}>
      </div>

      {/* Main Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden px-3 pb-3 gap-3 relative z-10 bg-gray-50/50">
        
        {/* PANE 1: LEADS LIST (LEFT) - Shrinks third */}
        <div className="w-[380px] min-w-[320px] flex-shrink-[2] flex flex-col bg-white overflow-hidden rounded-2xl border border-gray-200/60 shadow-sm">
          {/* Dashboard Header - Compact */}
          <div className="px-6 py-5 flex items-center justify-between shrink-0 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-gray-400" />
              Inbox
            </h2>

            {/* Bulk Actions Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectionMode(!selectionMode)}
                className={`p-2 rounded-lg transition-all text-xs font-medium ${
                  selectionMode 
                    ? 'bg-black text-white' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={selectionMode ? 'Exit selection mode' : 'Select multiple'}
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={async () => {
                  setIsSyncingManual(true);
                  try {
                    const response = await fetch('/api/gmail/sync', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                      setToastMessage(`Synced ${result.created || 0} new leads`);
                      setToastType('success');
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                      fetchConversations();
                    } else {
                      throw new Error(result.error || 'Sync failed');
                    }
                  } catch (error) {
                    setToastMessage('Sync failed');
                    setToastType('error');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  } finally {
                    setIsSyncingManual(false);
                  }
                }}
                disabled={isSyncingManual}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingManual ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filters Bar - Enhanced with Counters */}
          <div className="px-4 py-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All', icon: null, count: totalUnread, activeClass: 'bg-black text-white shadow-sm' },
                { id: 'attention', label: 'Urgent', icon: AlertCircle, count: conversations.filter(c => c.unread_count > 0).length, color: 'text-orange-500', activeClass: 'bg-orange-500 text-white shadow-sm' },
                { id: 'hot', label: 'Hot', icon: Sparkles, count: conversations.filter(c => c.tenant?.lead_priority === 'hot' || (c.tenant?.lead_score || 0) >= 80).length, color: 'text-indigo-500', activeClass: 'bg-indigo-600 text-white shadow-sm' },
                { id: 'viewings', label: 'Tours', icon: Calendar, count: conversations.filter(c => c.tenant?.qualification_status === 'Tour Scheduled').length, color: 'text-emerald-500', activeClass: 'bg-emerald-600 text-white shadow-sm' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${activeFilter === f.id ? f.activeClass : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                >
                  {f.icon && <f.icon className={`w-3.5 h-3.5 ${activeFilter === f.id ? 'text-white' : f.color}`} />}
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      activeFilter === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Leads List - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide relative">
            <ActiveLeadsTable 
              leads={tableLeads}
              loading={loading}
              selectionMode={selectionMode}
              selectedLeads={selectedConversations}
              onToggleSelection={toggleSelection}
              compact={true} // New prop for compact layout
              onLeadClick={(lead) => {
                const conv = conversations.find(c => c.tenant_id === lead.id);
                if (conv) openConversation(conv);
              }} 
            />

            {/* Selection Multi-Action Footer */}
            {selectionMode && selectedConversations.size > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest">{selectedConversations.size}</span>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PANE 2: CHAT THREAD (CENTER) - Never shrinks */}
        <div className="flex-1 min-w-[500px] flex-shrink-0 flex flex-col bg-white overflow-hidden relative rounded-2xl border border-gray-200/60 shadow-sm">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="h-20 px-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <Avatar 
                    name={selectedConversation.tenant?.name || 'Lead'} 
                    src={selectedConversation.tenant?.avatar} 
                    size="md" 
                    className="rounded-xl shadow-sm border border-gray-100"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight leading-none mb-1">
                      {selectedConversation.tenant?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-none">
                        {selectedConversation.tenant?.email || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900"
                    title="Close Chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Thread - Structured Gmail Style */}
              <div className="flex-1 overflow-y-auto scrollbar-hide bg-white relative">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-16 text-gray-400">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mb-4" />
                      <p className="text-sm font-medium">Loading messages...</p>
                    </div>
                  ) : conversationMessages.length === 0 && !generatingAI ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-16 text-gray-400">
                      <Mail className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.5} />
                      <p className="text-sm font-medium">No messages yet</p>
                      <p className="text-xs mt-1 opacity-70">Messages will appear here once synced</p>
                    </div>
                  ) : (
                    conversationMessages.map((message, idx) => {
                      const isReasoning = message.sender_type === 'ai_reasoning';
                      const isMine = message.sender_type === 'landlord';
                      const senderName = isMine ? 'You' : (selectedConversation.tenant?.name || 'Lead');
                      const timestamp = message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : '';
                      let cleanText = message.message_text || '';
                      let propertiesData: any[] | null = null;
                      
                      if (cleanText.includes('---PROPERTIES_JSON---')) {
                        const parts = cleanText.split('---PROPERTIES_JSON---');
                        cleanText = parts[0].trim();
                        try {
                           const jsonStr = parts[1].split('---END_PROPERTIES_JSON---')[0].trim();
                           propertiesData = JSON.parse(jsonStr);
                        } catch (e) {}
                      }

                      return (
                          <div key={message.id || idx} className="group transition-colors hover:bg-black/[0.01]">
                            {isReasoning ? (
                              <div className="px-8 py-4 border-b border-black/[0.03] bg-indigo-50/10">
                                 <AIThinkingPanel steps={message.thoughts || []} isStatic={true} />
                              </div>
                            ) : (
                              <div className="px-8 py-6 border-b border-black/[0.03]">
                                 {/* Message Header */}
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                       <Avatar 
                                          name={senderName} 
                                          src={isMine ? undefined : selectedConversation.tenant?.avatar} 
                                          size="sm" 
                                          className="rounded-full shadow-sm ring-1 ring-black/[0.05]"
                                       />
                                       <div className="flex items-baseline gap-2">
                                          <span className="text-sm font-bold text-gray-900">{senderName}</span>
                                          <span className="text-[11px] font-medium text-gray-400">
                                            {isMine ? 'to lead' : `to me`}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="text-[11px] font-medium text-gray-400">{timestamp}</span>
                                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-900 transition-colors">
                                             <Star className="w-3.5 h-3.5" />
                                          </button>
                                          <button className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-900 transition-colors">
                                             <CornerUpLeft className="w-3.5 h-3.5" />
                                          </button>
                                          <button className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-900 transition-colors">
                                             <MoreVertical className="w-3.5 h-3.5" />
                                          </button>
                                       </div>
                                    </div>
                                 </div>

                                 <div className="pl-[44px]">
                                    <div className="text-[14px] leading-relaxed text-gray-800 font-medium max-w-[720px] whitespace-pre-wrap">
                                       {cleanText ? cleanText.split(/\n\s*\n/).map((para, paraIdx) => (
                                          <p key={paraIdx} className={paraIdx > 0 ? 'mt-4' : ''}>
                                             {renderMessageText(para)}
                                          </p>
                                       )) : <span className="text-gray-400 italic text-sm">(empty message)</span>}
                                    </div>
                                    
                                    {/* Render Properties if inserted by AI */}
                                    {propertiesData && propertiesData.length > 0 && (
                                       <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[720px]">
                                         {propertiesData.map((prop, pIdx) => (
                                            <Link 
                                              href={`/dashboard/property/${prop.id}`} 
                                              key={pIdx}
                                              className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden bg-white hover:border-gray-300 hover:shadow-md transition-all group"
                                            >
                                              <div className="relative h-40 bg-gray-100">
                                                <img 
                                                  src={prop.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'} 
                                                  alt={prop.address} 
                                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                              </div>
                                              <div className="p-4 flex flex-col gap-1">
                                                <div className="flex items-start justify-between">
                                                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                                                    ${Number(prop.price).toLocaleString()}
                                                    {prop.type === 'rent' && <span className="text-sm font-normal text-gray-500 ml-1 tracking-normal">/ mo</span>}
                                                  </h3>
                                                </div>
                                                <div className="text-gray-500 text-xs mb-1">Fees may apply</div>
                                                <div className="flex items-center gap-1.5 text-gray-900 text-sm mb-1">
                                                  <span className="font-bold">{prop.beds}</span> <span className="font-normal text-gray-500">bd</span>
                                                  <span className="text-gray-300">|</span>
                                                  <span className="font-bold">{prop.baths}</span> <span className="font-normal text-gray-500">ba</span>
                                                  {prop.sqft && (
                                                    <>
                                                      <span className="text-gray-300">|</span>
                                                      <span className="font-bold">{prop.sqft}</span> <span className="font-normal text-gray-500">sqft</span>
                                                    </>
                                                  )}
                                                </div>
                                                <div className="text-gray-700 text-sm truncate font-normal">
                                                  {prop.address}{prop.city ? `, ${prop.city}` : ''}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                  {prop.type === 'rent' ? 'For rent' : 'For sale'}
                                                </div>
                                              </div>
                                            </Link>
                                         ))}
                                       </div>
                                    )}
                                 </div>
                              </div>
                            )}
                          </div>
                      );
                    })
                  )}
                  {generatingAI && (
                     <div className="px-8 py-6 border-b border-black/[0.03]">
                        <AIThinkingPanel steps={thinkingSteps} />
                     </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-8 border-t border-black/[0.03] bg-white/10 backdrop-blur-md">
                  <div className="glass-matte rounded-[24px] p-2 border border-white/60 focus-within:border-black/10 transition-all flex items-end gap-2 shadow-sm">
                     <textarea
                       ref={textareaRef}
                       value={replyText}
                       onChange={(e) => setReplyText(e.target.value)}
                       placeholder="Message to lead..."
                       rows={1}
                       className="flex-1 p-3 bg-transparent border-0 focus:ring-0 text-sm font-medium min-h-[48px] resize-none text-black placeholder:text-gray-400"
                     />
                     <div className="pb-1 pr-1">
                        <button 
                          onClick={handleReply}
                          className="h-10 px-6 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-wider hover:scale-[1.02] transition-all active:scale-95 shadow-lg shadow-black/10"
                        >
                          Send
                        </button>
                     </div>
                  </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
              {/* Minimalist Icon */}
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
                <MessageSquare className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-sm text-gray-400 max-w-[280px]">
                Choose a lead from the list to view their messages
              </p>
            </div>
          )}
        </div>

        {/* PANE 3: AI ACTIVITY LOG - Shrinks second (before Inbox) */}
        <div className="w-[340px] min-w-[220px] flex-shrink-[3] bg-white flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 shadow-sm">
          <AIActivityTimeline events={activityEvents} />
        </div>
      </div>



      {/* MODALS & TOASTS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2 tracking-tight">Delete Chats?</h3>
            <p className="text-gray-400 text-center mb-8 text-xs font-medium leading-relaxed">
              Are you sure? This will remove {selectedConversations.size} conversation{selectedConversations.size > 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-4 px-6 bg-red-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
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
