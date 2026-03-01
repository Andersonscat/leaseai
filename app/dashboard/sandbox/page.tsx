'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, RefreshCw, Bot, User, Sparkles,
  Calendar, ClipboardList, ChevronDown, Trash2, Beaker, Zap, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  analysis?: {
    action: string;
    intent: string;
    priority?: string;
    thought_process?: string;
    extractedData?: Record<string, any>;
    summary?: string;
  };
  simulatedBooking?: {
    property: string;
    time: string;
    calendarLink: string;
  } | null;
}

// Client requirements state: keyed by category name → flat fields object
type ClientReqState = Record<string, Record<string, any>>;

const TENANT_CATEGORIES = [
  { 
    key: 'tenant_info', 
    label: 'Tenant Profile', 
    icon: '👤', 
    groups: ['personal', 'budget', 'timeline', 'occupants', 'pets', 'lifestyle'],
    coreFields: [
      { key: 'personal.firstName', label: 'First Name' },
      { key: 'personal.lastName', label: 'Last Name' },
      { key: 'budget.max_monthly_rent', label: 'Budget' },
      { key: 'timeline.move_in_date', label: 'Move-in Date' },
      { key: 'occupants.total_count', label: 'Occupants' },
      { key: 'pets.has_pets', label: 'Pets' }
    ]
  }
];

const PROPERTY_REQ_CATEGORIES = [
  { 
    key: 'property_info', 
    label: 'Property Info', 
    icon: '🏠', 
    groups: ['housing', 'location', 'amenities'],
    coreFields: [
      { key: 'timeline.lease_term_ideal_months', label: 'Lease Duration' },
      { key: 'housing.property_types', label: 'Rent/Buy' },
      { key: 'housing.bedrooms_min', label: 'Bedrooms' }
    ]
  }
];

function renderCategoryGroup(title: string, icon: React.ReactNode, categories: (typeof TENANT_CATEGORIES)[number][], currentData: ClientReqState) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
        {icon}
        {title}
      </p>
      {categories.map(cat => (
        <motion.div 
          key={cat.key}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <span>{cat.icon}</span>{cat.label}
          </p>
          <div className="space-y-1">
            {cat.coreFields.map(field => {
              const [catKey, valKey] = field.key.split('.');
              const value = currentData[catKey]?.[valKey];
              const hasValue = value != null && value !== '' && (!Array.isArray(value) || value.length > 0);

              return (
                <div key={field.key} className={`flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                  hasValue ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-dashed border-gray-200'
                }`}>
                  <span className="text-[10px] text-gray-400 shrink-0">{field.label}</span>
                  <span className={`text-[10px] font-semibold break-words max-w-[60%] text-right ${
                    hasValue ? 'text-gray-800' : 'text-gray-300 italic'
                  }`}>
                    {hasValue ? formatValue(value) : 'Unknown'}
                  </span>
                </div>
              );
            })}
            
            {/* Show other non-core fields if extracted for this group */}
            {cat.groups.map(groupKey => {
              const groupData = currentData[groupKey] || {};
              return Object.entries(groupData).map(([k, v]) => {
                const fullKey = `${groupKey}.${k}`;
                const isCore = cat.coreFields.some(f => f.key === fullKey);
                
                // Exclude internal flags, duplicates, and AI-only fields never shown to user
                const isExcluded = [
                  'client_status', 
                  'adults', 
                  'children', 
                  'wfh', 
                  'lifestyle', 
                  'needs_home_office', 
                  'internet_min_mbps',
                  'thought_process',
                  'move_in_date',            // Already shown in Tenant Profile
                  'move_in_flexibility_days', // Internal
                  'decision_timeline',        // Internal
                  'decision_maker'            // Internal
                ].includes(k);
                
                if (isCore || isExcluded) return null;
                
                const hasValue = v != null && v !== '' && (!Array.isArray(v) || v.length > 0);
                if (!hasValue) return null;

                return (
                  <div key={fullKey} className="flex items-start justify-between gap-2 px-2.5 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <span className="text-[10px] text-gray-400 capitalize shrink-0">{k.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-semibold text-gray-800 break-words max-w-[60%] text-right">
                      {formatValue(v)}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const PRESET_PERSONAS = [
  {
    label: 'Viewing Request',
    emoji: '🏠',
    message: "Hi! I saw your listing on Zillow for 123 Main St. I'd like to schedule a viewing for tomorrow at 3 PM. Budget is around $2,500/month.",
  },
  {
    label: 'Budget-Focused',
    emoji: '💰',
    message: "Looking for a 1-bedroom apartment, max budget $1,800/mo. I have a cat. When can I move in?",
  },
  {
    label: 'Family',
    emoji: '👨‍👩‍👧',
    message: "We're a family of 4 looking for a 3-bedroom. We have two kids and a dog. Budget up to $3,500. We need parking.",
  },
  {
    label: 'Urgent',
    emoji: '🔥',
    message: "I need to move ASAP, ideally in the next 2 weeks. Any availability? I can pay first + last month upfront.",
  },
];

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  book_calendar: { label: 'Booked Viewing', className: 'bg-green-50 text-green-700 border-green-200' },
  send_listing:  { label: 'Sent Listing',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  escalate:      { label: 'Escalated',      className: 'bg-red-50 text-red-700 border-red-200' },
  reply:         { label: 'Replied',        className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const PRIORITY_STYLES: Record<string, { label: string; dot: string }> = {
  hot:  { label: 'Hot Lead',  dot: 'bg-red-500' },
  warm: { label: 'Warm Lead', dot: 'bg-orange-400' },
  cold: { label: 'Cold Lead', dot: 'bg-blue-400' },
};

/** Deep-merge new extracted data into existing client requirements state */
function mergeRequirements(prev: ClientReqState, extracted: Record<string, any>): ClientReqState {
  const next = { ...prev };
  for (const [category, fields] of Object.entries(extracted)) {
    if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
      next[category] = { ...(next[category] || {}), ...fields };
    }
  }
  return next;
}

/** Format a value for display in the sidebar */
function formatValue(v: any): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object' && v !== null) {
    // Flatten simple objects like { required: 'required', must_be_in_unit: true }
    return Object.entries(v)
      .filter(([, val]) => val != null)
      .map(([k, val]) => `${k.replace(/_/g, ' ')}: ${val}`)
      .join(' · ');
  }
  return String(v);
}

export default function SandboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [clientRequirements, setClientRequirements] = useState<ClientReqState>({});
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const [propertyMatches, setPropertyMatches] = useState<{ address: string; score: number; reason: string }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);

    try {
      const res = await fetch('/api/debug/sandbox/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, conversationHistory, tenantData: clientRequirements }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        analysis: data.analysis,
        simulatedBooking: data.simulatedBooking,
      }]);
      setConversationHistory(data.conversationHistory);

      if (data.analysis?.extractedData && typeof data.analysis.extractedData === 'object') {
        setClientRequirements(prev => mergeRequirements(prev, data.analysis.extractedData));
      }

      if (data.analysis?.propertyMatches) {
        setPropertyMatches(data.analysis.propertyMatches);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => {
    setMessages([]); setConversationHistory([]); setClientRequirements({}); setPropertyMatches([]); setInput(''); setExpandedReasoning(null);
  };

  const formatContent = (text: string) =>
    text.split('\n').map((line, i) => {
      const html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1</a>');
      return <p key={i} className={i > 0 ? 'mt-1' : ''} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });

  const hasProfile = Object.keys(clientRequirements).length > 0;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Beaker className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">AI Agent Sandbox</h1>
            <p className="text-xs text-gray-400">No emails sent · No data saved · Real AI responses</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            New Chat
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">

            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-6 h-6 text-gray-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Chat with your AI Agent</h2>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">
                    Simulate a tenant conversation. The AI responds as it does in production.
                  </p>
                </div>

                {/* Preset Cards */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  {PRESET_PERSONAS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p.message)}
                      className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      <div className="text-base mb-1">{p.emoji}</div>
                      <div className="text-xs font-semibold text-gray-800">{p.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{p.message}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-5">
              {messages.map((msg, idx) => {
                let cleanText = msg.content;
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
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === 'user' ? 'bg-black' : 'bg-gray-100 border border-gray-200'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-gray-500" />
                      }
                    </div>

                    <div className={`flex flex-col gap-2 max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-black text-white rounded-tr-sm'
                          : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                      }`}>
                        {msg.role === 'user'
                          ? <p>{cleanText}</p>
                          : <div className="space-y-0.5">{formatContent(cleanText)}</div>
                        }
                      </div>

                      {/* Property Cards */}
                      {propertiesData && propertiesData.length > 0 && (
                         <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                           {propertiesData.map((prop, pIdx) => (
                              <div 
                                key={pIdx}
                                className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden bg-white hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer"
                              >
                                <div className="relative h-32 bg-gray-100">
                                  <img 
                                    src={prop.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500'} 
                                    alt={prop.address} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </div>
                                <div className="p-3 flex flex-col gap-1">
                                  <div className="flex items-start justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                      ${Number(prop.price).toLocaleString()}
                                      {prop.type === 'rent' && <span className="text-xs font-normal text-gray-500 ml-1 tracking-normal">/ mo</span>}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-gray-900 text-xs mt-1 mb-1">
                                    <span className="font-bold">{prop.beds}</span> <span className="font-normal text-gray-500">bd</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-bold">{prop.baths || 1}</span> <span className="font-normal text-gray-500">ba</span>
                                    {prop.sqft && (
                                      <>
                                        <span className="text-gray-300">|</span>
                                        <span className="font-bold">{prop.sqft}</span> <span className="font-normal text-gray-500">sqft</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-gray-700 text-xs truncate font-normal">
                                    {prop.address}{prop.city ? `, ${prop.city}` : ''}
                                  </div>
                                </div>
                              </div>
                           ))}
                         </div>
                      )}

                    {/* Analysis badges */}
                    {msg.analysis && (
                      <div className="flex flex-wrap items-center gap-2">
                        {msg.analysis.action && ACTION_STYLES[msg.analysis.action] && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ACTION_STYLES[msg.analysis.action].className}`}>
                            {ACTION_STYLES[msg.analysis.action].label}
                          </span>
                        )}
                        {msg.analysis.priority && PRIORITY_STYLES[msg.analysis.priority] && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLES[msg.analysis.priority].dot}`} />
                            {PRIORITY_STYLES[msg.analysis.priority].label}
                          </span>
                        )}
                        {msg.analysis.thought_process && (
                          <button
                            onClick={() => setExpandedReasoning(expandedReasoning === idx ? null : idx)}
                            className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            AI Reasoning
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedReasoning === idx ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reasoning Panel */}
                    {expandedReasoning === idx && msg.analysis?.thought_process && (
                      <div className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] font-mono text-gray-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {msg.analysis.thought_process}
                      </div>
                    )}

                    {/* Booking Badge */}
                    {msg.simulatedBooking && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span className="text-xs text-green-700">
                          <strong>Simulated booking</strong> — {msg.simulatedBooking.property}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write as a prospective tenant... (Enter to send)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2 bg-black hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Sandbox mode — no real emails sent, no calendar bookings, no data stored
            </p>
          </div>
        </div>

        {/* Right: Live Context Sidebar */}
        <div className="w-64 border-l border-gray-100 bg-gray-50/50 flex flex-col overflow-y-auto shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Context</span>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Best Matches */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Best Matches</span>
                {propertyMatches.length > 0 && <Sparkles className="w-3 h-3 text-yellow-500" />}
              </p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {(propertyMatches.length > 0 
                    ? [...propertyMatches].sort((a, b) => b.score - a.score)
                    : [
                        { address: '123 Main St', score: 0, reason: 'Pending context...' },
                        { address: '456 Oak Ave', score: 0, reason: 'Pending context...' },
                        { address: '789 Pine St', score: 0, reason: 'Pending context...' },
                      ]
                  ).map((p, i) => (
                    <motion.div 
                      key={p.address}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        layout: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="group relative bg-white border border-gray-100 rounded-xl p-3 transition-all hover:border-gray-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              p.score >= 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                              p.score >= 50 ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 
                              p.score > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                              'bg-gray-300'
                            }`} />
                            <p className="text-xs font-bold text-gray-800 truncate">{p.address}</p>
                          </div>
                          {p.reason && p.score > 0 && (
                            <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed italic">
                              "{p.reason}"
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <span className={`text-xs font-black ${
                            p.score >= 80 ? 'text-green-600' : p.score >= 50 ? 'text-orange-500' : p.score > 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {p.score > 0 ? `${p.score}%` : '--'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Score Bar */}
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${
                            p.score >= 80 ? 'bg-green-500' : p.score >= 50 ? 'bg-orange-400' : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Client Requirements — grouped by category */}
            <div className="space-y-6">
              {renderCategoryGroup('Tenant Profile', <User className="w-3 h-3" />, TENANT_CATEGORIES, clientRequirements)}
              {renderCategoryGroup('Property Requirements', <ClipboardList className="w-3 h-3" />, PROPERTY_REQ_CATEGORIES, clientRequirements)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
