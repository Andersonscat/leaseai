'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, RefreshCw, Bot, User, Sparkles,
  Calendar, ClipboardList, ChevronDown, Trash2, Beaker, Zap, Tag,
  MapPin, Clock, ExternalLink, CheckCircle2, UserCheck, AlertTriangle, PhoneCall
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
    escalation_reason?: string;
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
      { key: 'budget.budget_stated', label: 'Budget (stated)' },
      { key: 'budget.budget_usd', label: 'Budget (USD)' },
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
      { key: 'housing.bedrooms_min', label: 'Bedrooms' },
      { key: 'housing.bathrooms_min', label: 'Bathrooms' },
      { key: 'housing.furnished', label: 'Furnished' },
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
                    {hasValue ? formatValue(value, valKey) : 'Unknown'}
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
                  'decision_maker',           // Internal
                  'max_monthly_rent',         // Replaced by budget_stated + budget_usd
                  'budget_stated',            // Shown in core fields
                  'budget_usd',               // Shown in core fields
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
  book_calendar: { label: 'Booked Viewing',    className: 'bg-green-50 text-green-700 border-green-200' },
  send_listing:  { label: 'Sent Listing',      className: 'bg-blue-50 text-blue-700 border-blue-200' },
  escalate:      { label: '🔴 Human Handoff',  className: 'bg-red-50 text-red-700 border-red-200' },
  reply:         { label: 'Replied',           className: 'bg-gray-50 text-gray-600 border-gray-200' },
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
      const prevCategory = next[category] || {};
      const merged: Record<string, any> = { ...prevCategory };
      for (const [key, val] of Object.entries(fields)) {
        if (Array.isArray(val) && Array.isArray(prevCategory[key])) {
          // Accumulate arrays (desired_features, deal_breakers, property_types, etc.)
          merged[key] = Array.from(new Set([...prevCategory[key], ...val]));
        } else {
          merged[key] = val;
        }
      }
      next[category] = merged;
    }
  }
  return next;
}

/** Format a value for display in the sidebar */
function formatValue(v: any, fieldKey?: string): string {
  if (fieldKey === 'budget_usd' && typeof v === 'number') {
    return `$${v.toLocaleString()} USD`;
  }
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
  const [pendingChecks, setPendingChecks] = useState<{ property_address: string; question: string }[]>([]);
  const [guestCard, setGuestCard] = useState<{ client: string; interests: string; concerns: string; next_step: string } | null>(null);
  const [replayThinking, setReplayThinking] = useState<{ text: string; msgIdx: number } | null>(null);
  const [replayDisplayed, setReplayDisplayed] = useState('');
  const [lastTiming, setLastTiming] = useState<{ aiMs: number; totalMs: number } | null>(null);
  const [propertyMeta, setPropertyMeta] = useState<{ address: string; price: number; beds: number; images: string[] }[]>([]);
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({});
  const [handoff, setHandoff] = useState<{
    triggered: boolean;
    reason: string;
    timestamp: string;
    agentNotification?: {
      sentAt: string;
      channel: string;
      recipient: string;
      subject: string;
      preview: string;
    };
  } | null>(null);
  const [appointment, setAppointment] = useState<{
    property: string;
    time: string;
    calendarLink: string;
    status: 'scheduled' | 'pending';
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);


  // Replay real thought_process with typewriter after response arrives
  useEffect(() => {
    if (!replayThinking) return;
    let i = 0;
    let rafId: number;
    let lastTime = 0;
    const CHARS_PER_MS = 0.22;

    // Auto-expand reasoning panel for this message
    setExpandedReasoning(replayThinking.msgIdx);

    const tick = (now: number) => {
      if (!lastTime) lastTime = now;
      const elapsed = now - lastTime;
      lastTime = now;
      i = Math.min(i + elapsed * CHARS_PER_MS, replayThinking.text.length);
      setReplayDisplayed(replayThinking.text.slice(0, Math.floor(i)));
      if (i < replayThinking.text.length) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Auto-collapse after 4 seconds when done
        setTimeout(() => {
          setExpandedReasoning(null);
          setReplayThinking(null);
          setReplayDisplayed('');
        }, 4000);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [replayThinking]);


  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    // After handoff: show user message but no AI reply
    if (handoff?.triggered) {
      setMessages(prev => [...prev, { role: 'user', content: messageText }]);
      setInput('');
      return;
    }

    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);

    try {
      const res = await fetch('/api/debug/sandbox/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, conversationHistory, tenantData: clientRequirements, handoffTriggered: handoff?.triggered ?? false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (data.reply !== null && data.reply !== undefined) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          analysis: data.analysis,
          simulatedBooking: data.simulatedBooking,
        }]);
      }

      setConversationHistory(data.conversationHistory);

      if (data.analysis?.extractedData && typeof data.analysis.extractedData === 'object') {
        setClientRequirements(prev => mergeRequirements(prev, data.analysis.extractedData));
      }

      if (data.analysis?.propertyMatches) {
        setPropertyMatches(data.analysis.propertyMatches);
      }

      if (data.analysis?.pending_checks) {
        setPendingChecks(prev => {
          const incoming: { property_address: string; question: string }[] = data.analysis.pending_checks;
          const merged = [...prev];
          for (const item of incoming) {
            const exists = merged.some(p => p.property_address === item.property_address && p.question === item.question);
            if (!exists) merged.push(item);
          }
          return merged;
        });
      }

      if (data.analysis?.summary) {
        const s = data.analysis.summary;
        if (typeof s === 'object' && s.client) {
          setGuestCard(s);
        } else if (typeof s === 'string' && s.trim()) {
          // Fallback: AI returned a plain string — show it as next_step
          setGuestCard({ client: '', interests: '', concerns: '', next_step: s });
        }
      }

      if (data.timing) {
        setLastTiming(data.timing);
      }

      if (data.propertyMeta) {
        setPropertyMeta(data.propertyMeta);
      }

      if (data.handoff) {
        setHandoff(data.handoff);
        // Inject a system event into the chat to show the handoff happened
        if (data.handoff.triggered) {
          setMessages(prev => [...prev, {
            role: 'system' as any,
            content: '__HANDOFF__',
            handoffData: data.handoff,
          } as any]);
        }
      }

      if (data.simulatedBooking) {
        setAppointment({
          property: data.simulatedBooking.property,
          time: data.simulatedBooking.time,
          calendarLink: data.simulatedBooking.calendarLink,
          status: 'scheduled',
        });
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
    setMessages([]); setConversationHistory([]); setClientRequirements({}); setPropertyMatches([]); setPropertyMeta([]); setAppointment(null); setHandoff(null); setInput(''); setExpandedReasoning(null);
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
                // System event: handoff notification banner
                if ((msg as any).role === 'system' && msg.content === '__HANDOFF__') {
                  const hd = (msg as any).handoffData;
                  return (
                    <div key={idx} className="flex justify-center my-2">
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-sm w-full space-y-2 shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <p className="text-[11px] font-bold text-red-700">Handed off to human agent</p>
                        </div>
                        {/* Reason */}
                        <p className="text-[10px] text-red-600 leading-relaxed">{hd?.reason}</p>
                        {/* Notification sent */}
                        {hd?.agentNotification && (
                          <div className="flex items-center gap-2 pt-1 border-t border-red-100">
                            <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                            <p className="text-[9px] text-blue-600">
                              Email sent to <span className="font-semibold">{hd.agentNotification.recipient}</span>
                            </p>
                          </div>
                        )}
                        <p className="text-[9px] text-red-400 text-center">AI is now silent — human agent will respond</p>
                      </div>
                    </div>
                  );
                }

                let cleanText = msg.content;
                let propertiesData: any[] | null = null;
                let photosData: { url: string; address: string }[] | null = null;

                if (cleanText.includes('---PHOTOS_JSON---')) {
                  const parts = cleanText.split('---PHOTOS_JSON---');
                  cleanText = parts[0].trim();
                  try {
                    const jsonStr = parts[1].split('---END_PHOTOS_JSON---')[0].trim();
                    photosData = JSON.parse(jsonStr);
                  } catch (e) {}
                } else if (cleanText.includes('---PROPERTIES_JSON---')) {
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

                      {/* Photo Grid — shown when client explicitly requests photos */}
                      {photosData && photosData.length > 0 && (
                        <div className="mt-2 w-full">
                          <div className="grid grid-cols-2 gap-1.5">
                            {photosData.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo.url, '_blank')}
                              >
                                <img
                                  src={photo.url}
                                  alt={`Photo ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                />
                                {pIdx === 0 && (
                                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 rounded text-[9px] text-white font-medium">
                                    {photosData!.length} photos
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1.5 text-center">Tap any photo to view full size</p>
                        </div>
                      )}

                      {/* Property Cards */}
                      {propertiesData && propertiesData.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          {propertiesData.map((prop, pIdx) => {
                            const cardKey = `${idx}-${pIdx}`;
                            const images: string[] = prop.images ?? (prop.image ? [prop.image] : []);
                            const currentImg = carouselIdx[cardKey] ?? 0;
                            const hasMultiple = images.length > 1;
                            return (
                              <div
                                key={pIdx}
                                className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden bg-white hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer"
                                onClick={() => prop.id && window.open(`/dashboard/property/${prop.id}`, '_blank')}
                              >
                                {/* Photo carousel */}
                                <div className="relative h-36 bg-gray-100 overflow-hidden">
                                  {images.length > 0 ? (
                                    <>
                                      <img
                                        key={currentImg}
                                        src={images[currentImg]}
                                        alt={prop.address}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                      {/* Photo counter */}
                                      {hasMultiple && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                          {images.map((_, i) => (
                                            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentImg ? 'bg-white' : 'bg-white/50'}`} />
                                          ))}
                                        </div>
                                      )}
                                      {/* Prev / Next */}
                                      {hasMultiple && (
                                        <>
                                          <button
                                            onClick={e => { e.stopPropagation(); setCarouselIdx(prev => ({ ...prev, [cardKey]: (currentImg - 1 + images.length) % images.length })); }}
                                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                                          >
                                            <ChevronDown className="w-3 h-3 rotate-90" />
                                          </button>
                                          <button
                                            onClick={e => { e.stopPropagation(); setCarouselIdx(prev => ({ ...prev, [cardKey]: (currentImg + 1) % images.length })); }}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                                          >
                                            <ChevronDown className="w-3 h-3 -rotate-90" />
                                          </button>
                                        </>
                                      )}
                                      {/* Photo count badge */}
                                      {hasMultiple && (
                                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 rounded text-[9px] text-white font-medium">
                                          {currentImg + 1}/{images.length}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                      <MapPin className="w-6 h-6 text-gray-300" />
                                      <span className="text-[10px] text-gray-400">No photo in database</span>
                                    </div>
                                  )}
                                  {/* Open link icon */}
                                  {prop.id && (
                                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-6 h-6 bg-black/50 rounded flex items-center justify-center">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 flex flex-col gap-1">
                                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                    ${Number(prop.price).toLocaleString()}
                                    {prop.type === 'rent' && <span className="text-xs font-normal text-gray-500 ml-1 tracking-normal">/ mo</span>}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-gray-900 text-xs mt-0.5 mb-1">
                                    <span className="font-bold">{prop.beds}</span> <span className="font-normal text-gray-500">bd</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-bold">{prop.baths || 1}</span> <span className="font-normal text-gray-500">ba</span>
                                    {prop.sqft && (<><span className="text-gray-300">|</span><span className="font-bold">{prop.sqft}</span> <span className="font-normal text-gray-500">sqft</span></>)}
                                  </div>
                                  <div className="text-gray-700 text-xs truncate">{prop.address}{prop.city ? `, ${prop.city}` : ''}</div>
                                </div>
                              </div>
                            );
                          })}
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="w-full max-w-full overflow-hidden"
                      >
                        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 max-h-52 overflow-y-auto">
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-800">
                            <div className="w-2 h-2 rounded-full bg-red-500/70" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
                            <div className="w-2 h-2 rounded-full bg-green-500/70" />
                            <span className="text-[9px] text-gray-500 ml-1 font-mono">AI Reasoning</span>
                          </div>
                          <p className="text-[10px] font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
                            {replayThinking?.msgIdx === idx ? replayDisplayed : msg.analysis.thought_process}
                            {replayThinking?.msgIdx === idx && replayDisplayed.length < (msg.analysis.thought_process?.length ?? 0) && (
                              <span className="inline-block w-0.5 h-3 bg-green-400 ml-0.5 animate-pulse align-middle" />
                            )}
                          </p>
                        </div>
                      </motion.div>
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

                    {/* Escalation Badge */}
                  </div>
                </div>
              );
              })}

              {/* Spinner — while waiting for response */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-2xl rounded-tl-sm bg-white"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </motion.div>
                    <span className="text-[11px] text-gray-400">Thinking</span>
                    <span className="flex gap-0.5">
                      {[0,1,2].map(d => (
                        <span key={d} className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </span>
                  </motion.div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            {handoff?.triggered && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-red-50 border border-red-200 rounded-lg">
                <PhoneCall className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-600 font-medium">Human agent assigned — AI is silent. Your messages are being received.</p>
              </div>
            )}
            <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-3 focus-within:border-gray-400 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={handoff?.triggered ? 'Write to human agent...' : 'Write as a prospective tenant... (Enter to send)'}
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
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <p className="text-center text-[10px] text-gray-400">
                Sandbox mode — no real emails sent, no calendar bookings, no data stored
              </p>
              <p className="text-center text-[10px] text-gray-400">
                🏠 Equal Housing Opportunity &nbsp;·&nbsp; AI-assisted leasing agent
              </p>
            </div>
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

          {/* Guest Card — AI-generated conversation summary */}
          {guestCard && (
            <div className="px-4 py-3 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Guest Card</p>
                <button
                  onClick={() => {
                    const text = `CLIENT: ${guestCard.client}\nINTERESTS: ${guestCard.interests}\nCONCERNS: ${guestCard.concerns}\nNEXT STEP: ${guestCard.next_step}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: '👤', label: 'Client', value: guestCard.client },
                  { icon: '🏠', label: 'Interests', value: guestCard.interests },
                  { icon: '💬', label: 'Concerns', value: guestCard.concerns },
                  { icon: '➡️', label: 'Next Step', value: guestCard.next_step },
                ].filter(({ value }) => value && value !== '...').map(({ icon, label, value }) => (
                  <div key={label}>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{icon} {label}</p>
                    <p className="text-[10px] text-gray-700 leading-snug">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Timing */}
          {lastTiming && (
            <div className="px-4 py-2 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Response time</span>
                <span className={`text-[10px] font-black tabular-nums ${
                  lastTiming.totalMs < 3000 ? 'text-green-600' :
                  lastTiming.totalMs < 7000 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {(lastTiming.totalMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((lastTiming.totalMs / 15000) * 100, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      lastTiming.totalMs < 3000 ? 'bg-green-500' :
                      lastTiming.totalMs < 7000 ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-400">AI: {(lastTiming.aiMs / 1000).toFixed(1)}s</span>
                <span className="text-[9px] text-gray-400">Total: {(lastTiming.totalMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}

          <div className="p-4 space-y-5">
            {/* Best Matches */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Best Matches</span>
                {propertyMatches.length > 0 && <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />}
              </p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    // Before any AI response: show top-3 from propertyMeta as skeleton
                    const PLACEHOLDERS = propertyMeta.slice(0, 3).map(m => ({
                      address: m.address, score: 0, reason: ''
                    }));

                    // After AI responds: show top-3 scored matches only
                    const base = propertyMatches.length > 0
                      ? [...propertyMatches].sort((a, b) => b.score - a.score).slice(0, 3)
                      : PLACEHOLDERS.slice(0, 3);

                    // Merge with metadata
                    return base.map((p) => {
                      const meta = propertyMeta.find(m =>
                        m.address.toLowerCase().includes(p.address.split(',')[0].toLowerCase())
                      );
                      const scoreColor =
                        p.score >= 80 ? 'text-green-600' :
                        p.score >= 50 ? 'text-orange-500' :
                        p.score >  0  ? 'text-red-500' : 'text-gray-300';
                      const barColor =
                        p.score >= 80 ? 'bg-green-500' :
                        p.score >= 50 ? 'bg-orange-400' : 'bg-red-400';
                      const dotColor =
                        p.score >= 80 ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]' :
                        p.score >= 50 ? 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.7)]' :
                        p.score >  0  ? 'bg-red-400' : 'bg-gray-200';

                      return (
                        <motion.div
                          key={p.address}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          {/* Thumbnail — right panel shows first image only */}
                          {meta?.images?.[0] && (
                            <div className="relative h-20 bg-gray-100 overflow-hidden">
                              <img
                                src={meta.images[0]}
                                alt={p.address}
                                className="w-full h-full object-cover"
                                onError={e => {
                                  const el = e.target as HTMLImageElement;
                                  el.style.display = 'none';
                                  el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>';
                                }}
                              />
                              <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black backdrop-blur-sm ${
                                p.score >= 80 ? 'bg-green-500/90 text-white' :
                                p.score >= 50 ? 'bg-orange-400/90 text-white' :
                                p.score >  0  ? 'bg-red-400/90 text-white' :
                                'bg-black/40 text-white'
                              }`}>
                                {p.score > 0 ? `${p.score}%` : '--'}
                              </div>
                            </div>
                          )}

                          <div className="p-2.5">
                            {/* Address row */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                              <p className="text-[10px] font-bold text-gray-800 truncate">{p.address.split(',')[0]}</p>
                              {!meta?.images?.[0] && (
                                <span className={`ml-auto text-[10px] font-black shrink-0 ${scoreColor}`}>
                                  {p.score > 0 ? `${p.score}%` : '--'}
                                </span>
                              )}
                            </div>

                            {/* Price + beds */}
                            {meta && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-semibold text-gray-700">
                                  ${meta.price.toLocaleString()}<span className="font-normal text-gray-400">/mo</span>
                                </span>
                                <span className="text-gray-300">·</span>
                                <span className="text-[10px] text-gray-500">{meta.beds} bd</span>
                              </div>
                            )}

                            {/* Reason */}
                            {p.reason && p.score > 0 && (
                              <p className="text-[9px] text-gray-400 italic line-clamp-2 leading-relaxed">
                                {p.reason}
                              </p>
                            )}

                            {/* Score bar */}
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${p.score}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full ${p.score > 0 ? barColor : 'bg-gray-200'}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </AnimatePresence>
              </div>
            </div>

            {/* Pending Landlord Checks */}
            {pendingChecks.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Pending Checks
                </p>
                <div className="space-y-1.5">
                  {pendingChecks.map((item, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                      <p className="text-[10px] font-medium text-amber-800 leading-snug">{item.question}</p>
                      <p className="text-[9px] text-amber-500 mt-0.5 truncate">{item.property_address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Handoff Section */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Human Handoff
              </p>
              <AnimatePresence mode="wait">
                {handoff ? (
                  <motion.div
                    key="handoff-active"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {/* Status header */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[11px] font-bold text-red-700">Escalated to human agent</span>
                        <span className="ml-auto text-[9px] text-red-400">
                          {new Date(handoff.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-red-700 leading-relaxed">{handoff.reason}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Timeline</p>

                      {/* Step 1 — AI detected */}
                      <div className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-2 h-2 text-red-500" />
                          </div>
                          <div className="w-px flex-1 bg-gray-200 my-0.5" />
                        </div>
                        <div className="pb-3">
                          <p className="text-[10px] font-semibold text-gray-700">AI detected escalation trigger</p>
                          <p className="text-[9px] text-gray-400">{new Date(handoff.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                      </div>

                      {/* Step 2 — AI silenced */}
                      <div className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          </div>
                          <div className="w-px flex-1 bg-gray-200 my-0.5" />
                        </div>
                        <div className="pb-3">
                          <p className="text-[10px] font-semibold text-gray-700">AI stopped responding</p>
                          <p className="text-[9px] text-gray-400">Conversation handed off</p>
                        </div>
                      </div>

                      {/* Step 3 — Notification sent */}
                      {handoff.agentNotification && (
                        <div className="flex gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                            <div className="w-px flex-1 bg-gray-200 my-0.5" />
                          </div>
                          <div className="pb-3">
                            <p className="text-[10px] font-semibold text-gray-700">Agent notified via email</p>
                            <p className="text-[9px] text-gray-400">{handoff.agentNotification.recipient}</p>
                          </div>
                        </div>
                      )}

                      {/* Step 4 — Waiting */}
                      <div className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400">Waiting for agent to take over...</p>
                        </div>
                      </div>
                    </div>

                    {/* Simulated email preview */}
                    {handoff.agentNotification && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5">
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Simulated email sent</p>
                        <div className="space-y-1">
                          <div className="flex gap-1.5">
                            <span className="text-[9px] text-blue-400 w-8 shrink-0">To:</span>
                            <span className="text-[9px] text-blue-700 font-medium">{handoff.agentNotification.recipient}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-[9px] text-blue-400 w-8 shrink-0">Subj:</span>
                            <span className="text-[9px] text-blue-700 font-medium leading-tight">{handoff.agentNotification.subject}</span>
                          </div>
                          <p className="text-[9px] text-blue-600 leading-relaxed pt-1 border-t border-blue-100">
                            {handoff.agentNotification.preview}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Take Over button */}
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold rounded-lg transition-colors">
                      <PhoneCall className="w-3 h-3" />
                      Take Over (Sandbox)
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="handoff-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <p className="text-[10px] text-gray-400">AI handling — no handoff needed</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Appointment Section */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Appointment
              </p>
              <AnimatePresence mode="wait">
                {appointment ? (
                  <motion.div
                    key="appointment-card"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-white border border-green-100 rounded-xl p-3 space-y-2.5 shadow-sm"
                  >
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Scheduled
                      </span>
                      <span className="text-[9px] text-gray-400 italic">Simulated</span>
                    </div>

                    {/* Property */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Property</p>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">{appointment.property || '—'}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start gap-2">
                      <Clock className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Date & Time</p>
                        <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                          {appointment.time
                            ? (() => {
                                try {
                                  const d = new Date(appointment.time);
                                  return d.toLocaleString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: 'numeric', minute: '2-digit', hour12: true
                                  });
                                } catch { return appointment.time; }
                              })()
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-start gap-2">
                      <Zap className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Duration</p>
                        <p className="text-[11px] font-semibold text-gray-800">30 minutes</p>
                      </div>
                    </div>

                    {/* Calendar Link */}
                    <a
                      href={appointment.calendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                    >
                      <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                      <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700">View in Google Calendar</span>
                    </a>
                  </motion.div>
                ) : (
                  <motion.div
                    key="appointment-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-5 px-3 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl"
                  >
                    <Calendar className="w-5 h-5 text-gray-300 mb-2" />
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                      No appointment yet.<br />Viewing will appear here once booked.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Currency mismatch warning */}
            {clientRequirements.budget?.budget_currency && clientRequirements.budget.budget_currency !== 'USD' && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-amber-700">Currency: {clientRequirements.budget.budget_currency}</p>
                  <p className="text-[10px] text-amber-600">
                    Stated: {clientRequirements.budget.budget_stated ?? '—'} → ~${(clientRequirements.budget.budget_usd ?? 0).toLocaleString()} USD
                  </p>
                </div>
              </div>
            )}

            {/* Client Requirements — grouped by category */}
            <div className="space-y-6">
              {renderCategoryGroup('Tenant Profile', <User className="w-3 h-3" />, TENANT_CATEGORIES, clientRequirements)}
              {renderCategoryGroup('Property Requirements', <ClipboardList className="w-3 h-3" />, PROPERTY_REQ_CATEGORIES, clientRequirements)}

              {/* Desired Features */}
              {(clientRequirements.amenities?.desired_features?.length > 0 || clientRequirements.amenities?.deal_breakers?.length > 0) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Desired Features
                  </p>

                  {clientRequirements.amenities?.desired_features?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(clientRequirements.amenities.desired_features as string[]).map((key: string) => (
                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          ✓ {key.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {clientRequirements.amenities?.deal_breakers?.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        Deal Breakers
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(clientRequirements.amenities.deal_breakers as string[]).map((key: string) => (
                          <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            ✗ {key.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
