'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Activity, BarChart3, Brain, Clock, DollarSign, Mail, RefreshCw, Search, Zap, Circle, AlertCircle } from 'lucide-react';

type Tab = 'traces' | 'health' | 'metrics';

interface AgentTrace {
  id: string;
  trace_id: string;
  tenant_id: string;
  trigger: string;
  prompt_summary: string;
  response_text: string;
  tool_calls: string[];
  model: string;
  latency_ms: number;
  estimated_cost: number;
  guardrail_result: string | null;
  error: string | null;
  created_at: string;
}

interface SystemEvent {
  id: string;
  trace_id: string;
  event_type: string;
  status: string;
  metadata: Record<string, any>;
  latency_ms: number;
  error: string | null;
  created_at: string;
}

interface DailyMetric {
  date: string;
  ai_responses: number;
  ai_errors: number;
  ai_avg_latency_ms: number;
  ai_total_tokens: number;
  ai_estimated_cost: number;
  gmail_syncs: number;
  gmail_errors: number;
  messages_received: number;
  messages_sent: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('traces');
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'error' | 'success'>('all');
  const [selectedTrace, setSelectedTrace] = useState<AgentTrace | null>(null);

  const supabase = createSupabaseClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tracesRes, eventsRes, metricsRes] = await Promise.all([
      supabase.from('agent_traces').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('system_events').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('daily_metrics').select('*').order('date', { ascending: false }).limit(30),
    ]);
    if (tracesRes.data) setTraces(tracesRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (metricsRes.data) setMetrics(metricsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTraces = traces.filter(t => {
    if (filterStatus === 'error' && !t.error) return false;
    if (filterStatus === 'success' && t.error) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.trace_id.toLowerCase().includes(q) || t.response_text?.toLowerCase().includes(q) || t.tool_calls?.some(tc => tc.toLowerCase().includes(q));
    }
    return true;
  });

  const recentTraces = traces.filter(t => Date.now() - new Date(t.created_at).getTime() < 3600000);
  const recentErrors = recentTraces.filter(t => t.error);
  const errorRate = recentTraces.length > 0 ? Math.round((recentErrors.length / recentTraces.length) * 100) : 0;
  const avgLatency = recentTraces.length > 0 ? Math.round(recentTraces.reduce((s, t) => s + (t.latency_ms || 0), 0) / recentTraces.length) : 0;

  const lastGmailSync = events.find(e => e.event_type === 'gmail_sync' || e.event_type === 'gmail_webhook');
  const lastGmailError = events.find(e => e.event_type === 'gmail_sync_error');

  const last7 = metrics.slice(0, 7);
  const totalResponses = last7.reduce((s, m) => s + (m.ai_responses || 0), 0);
  const totalErrors = last7.reduce((s, m) => s + (m.ai_errors || 0), 0);
  const totalCost = last7.reduce((s, m) => s + Number(m.ai_estimated_cost || 0), 0);
  const totalTokens = last7.reduce((s, m) => s + (m.ai_total_tokens || 0), 0);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'traces', label: 'AI Traces', icon: Brain },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen px-6 py-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900 tracking-tight">Observability</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">System health & AI traces</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3.5 text-[13px] text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <t.icon size={14} strokeWidth={tab === t.id ? 2.2 : 1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TRACES ── */}
      {tab === 'traces' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Search by trace ID, response, or tool..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
            <div className="flex bg-gray-100 rounded-xl overflow-hidden p-0.5">
              {(['all', 'error', 'success'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`h-8 px-3 text-[12px] font-medium capitalize rounded-lg transition-all ${
                    filterStatus === f
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* List */}
            <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
              {filteredTraces.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                  <Brain size={24} strokeWidth={1.5} className="mb-2" />
                  <p className="text-[13px]">No traces yet. AI calls will appear here.</p>
                </div>
              )}
              {filteredTraces.map((trace, i) => (
                <button
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`w-full text-left px-4 py-3.5 transition-all ${
                    selectedTrace?.id === trace.id ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                  } ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${trace.error ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      <span className="text-[12px] text-gray-400 font-mono">{trace.trace_id}</span>
                    </div>
                    <span className="text-[11px] text-gray-300">{timeAgo(trace.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Zap size={9} />{trace.trigger}</span>
                    <span>{trace.latency_ms}ms</span>
                    <span>${Number(trace.estimated_cost).toFixed(4)}</span>
                    {trace.tool_calls?.length > 0 && (
                      <span className="text-violet-400">{trace.tool_calls.join(' · ')}</span>
                    )}
                  </div>
                  {trace.error && (
                    <p className="mt-1.5 text-[11px] text-red-400 truncate">{trace.error}</p>
                  )}
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl sticky top-6 self-start">
              {selectedTrace ? (
                <div className="p-5 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Trace</p>
                      <p className="text-[12px] font-mono text-gray-500">{selectedTrace.trace_id}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      selectedTrace.error
                        ? 'bg-red-50 text-red-500'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {selectedTrace.error ? 'error' : 'success'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Model', value: selectedTrace.model },
                      { label: 'Latency', value: `${selectedTrace.latency_ms}ms` },
                      { label: 'Cost', value: `$${Number(selectedTrace.estimated_cost).toFixed(4)}` },
                      { label: 'Guardrail', value: selectedTrace.guardrail_result || '—' },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[11px] text-gray-300 mb-0.5">{item.label}</p>
                        <p className="text-[13px] text-gray-700 font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedTrace.tool_calls?.length > 0 && (
                    <div>
                      <p className="text-[11px] text-gray-300 mb-2">Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTrace.tool_calls.map((tc, i) => (
                          <span key={i} className="text-[11px] bg-violet-50 text-violet-500 px-2 py-0.5 rounded-lg font-mono">{tc}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] text-gray-300 mb-1.5">Prompt</p>
                    <div className="text-[12px] text-gray-500 leading-relaxed max-h-24 overflow-y-auto">
                      {selectedTrace.prompt_summary || '—'}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-gray-300 mb-1.5">Response</p>
                    <div className="text-[12px] text-gray-600 leading-relaxed max-h-40 overflow-y-auto">
                      {selectedTrace.response_text || '—'}
                    </div>
                  </div>

                  {selectedTrace.error && (
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-[11px] text-red-300 mb-1">Error</p>
                      <p className="text-[12px] text-red-500 leading-relaxed">{selectedTrace.error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Brain size={22} strokeWidth={1.5} className="mb-2" />
                  <p className="text-[13px]">Select a trace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HEALTH ── */}
      {tab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-medium text-gray-500">AI Engine</p>
                <div className={`w-2 h-2 rounded-full ${errorRate > 10 ? 'bg-red-400' : errorRate > 5 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
              <p className="text-[32px] font-semibold text-gray-900 tracking-tight">{errorRate}%</p>
              <p className="text-[12px] text-gray-400 mt-1">
                error rate · {recentTraces.length} calls · {avgLatency}ms avg
              </p>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-medium text-gray-500">Gmail Sync</p>
                <div className={`w-2 h-2 rounded-full ${lastGmailSync ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              </div>
              <p className="text-[32px] font-semibold text-gray-900 tracking-tight">
                {lastGmailSync ? 'Active' : 'Idle'}
              </p>
              <p className="text-[12px] text-gray-400 mt-1">
                {lastGmailSync ? `Last: ${timeAgo(lastGmailSync.created_at)}` : 'No events yet'}
              </p>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-medium text-gray-500">System Errors</p>
                <div className={`w-2 h-2 rounded-full ${events.some(e => e.status === 'error') ? 'bg-red-400' : 'bg-gray-200'}`} />
              </div>
              <p className="text-[32px] font-semibold text-gray-900 tracking-tight">
                {events.filter(e => e.status === 'error').length}
              </p>
              <p className="text-[12px] text-gray-400 mt-1">total error events</p>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-medium text-gray-500 mb-3">Recent Events</p>
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Time', 'Event', 'Status', 'Latency', 'Details'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 20).map((event, i) => (
                    <tr key={event.id} className={`hover:bg-gray-50/60 transition-colors ${i > 0 ? 'border-t border-gray-100/80' : ''}`}>
                      <td className="px-4 py-2.5 text-[12px] text-gray-400">{timeAgo(event.created_at)}</td>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-gray-600">{event.event_type}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          event.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-400">{event.latency_ms ? `${event.latency_ms}ms` : '—'}</td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-300 truncate max-w-[200px]">
                        {event.error || (event.metadata ? JSON.stringify(event.metadata).slice(0, 60) : '—')}
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-300 py-12 text-[13px]">No events recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── METRICS ── */}
      {tab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Responses', value: totalResponses.toString(), sub: 'last 7 days' },
              { label: 'Errors', value: totalErrors.toString(), sub: 'last 7 days', accent: totalErrors > 0 ? 'text-red-500' : undefined },
              { label: 'Tokens', value: totalTokens.toLocaleString(), sub: 'total consumed' },
              { label: 'Cost', value: `$${totalCost.toFixed(3)}`, sub: 'estimated' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-gray-200/80 rounded-2xl p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{kpi.label}</p>
                <p className={`text-[28px] font-semibold tracking-tight ${kpi.accent || 'text-gray-900'}`}>{kpi.value}</p>
                <p className="text-[11px] text-gray-300 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {metrics.length > 0 && (
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5">
              <p className="text-[13px] font-medium text-gray-500 mb-5">AI responses · last 14 days</p>
              <div className="flex items-end gap-[3px] h-28">
                {[...metrics].reverse().slice(-14).map(m => {
                  const maxVal = Math.max(...metrics.map(x => x.ai_responses || 1), 1);
                  const pct = ((m.ai_responses || 0) / maxVal) * 100;
                  return (
                    <div key={m.date} className="flex-1 group relative">
                      <div
                        className="w-full bg-gray-900/[0.06] group-hover:bg-gray-900/[0.14] rounded-sm transition-colors"
                        style={{ height: `${Math.max(pct, 3)}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                        {m.ai_responses} · {m.date.slice(5)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-300">
                <span>{[...metrics].reverse().slice(-14)[0]?.date.slice(5)}</span>
                <span>{metrics[0]?.date.slice(5)}</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-[13px] font-medium text-gray-500 mb-3">Daily breakdown</p>
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Responses', 'Errors', 'Avg Latency', 'Tokens', 'Cost', 'Syncs'].map(h => (
                      <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider ${h === 'Date' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => (
                    <tr key={m.date} className={`hover:bg-gray-50/60 transition-colors ${i > 0 ? 'border-t border-gray-100/80' : ''}`}>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-gray-600">{m.date}</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-gray-700 font-medium">{m.ai_responses}</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-red-400">{m.ai_errors || '—'}</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-gray-400">{m.ai_avg_latency_ms}ms</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-gray-400">{(m.ai_total_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-gray-400">${Number(m.ai_estimated_cost || 0).toFixed(4)}</td>
                      <td className="px-4 py-2.5 text-[12px] text-right text-gray-400">{m.gmail_syncs || '—'}</td>
                    </tr>
                  ))}
                  {metrics.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-gray-300 py-12 text-[13px]">No metrics yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
