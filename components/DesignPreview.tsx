'use client';

import React from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  Plus, 
  ChevronRight, 
  MessageSquare, 
  Info,
  MapPin,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Brain,
  Clock,
  ExternalLink,
  Filter,
  MoreVertical,
  Activity,
  FileText,
  User,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function DesignPreview() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 lg:p-8 font-sans text-slate-900 selection:bg-blue-100 italic-none">
      <div className="max-w-[1700px] mx-auto space-y-6">
        
        {/* Breadcrumbs & Actions Area */}
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <History className="w-3.5 h-3.5" />
              <span>Inbox</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-900">Live Stream</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-bold text-slate-500">Syncing Gmail...</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="h-9 px-4 glass-matte border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all text-slate-600">
               <RefreshCw className="w-3.5 h-3.5" />
               Refresh Analysis
             </button>
             <button className="h-9 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black shadow-lg shadow-black/5 active:scale-95 transition-all">
               <Plus className="w-3.5 h-3.5" />
               New Message
             </button>
          </div>
        </div>

        {/* Professional 3-Pane Layout */}
        <div className="grid grid-cols-12 gap-6 h-[800px]">
          
          {/* Pane 1: Feed (3 cols) */}
          <div className="col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-sm">
             <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Recent Activity</h2>
                   <Filter className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-900 transition-colors" />
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search communications..." 
                     className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-slate-300 transition-all"
                   />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
                {[
                  { name: 'Sarah Chen', status: 'Priority Inquiry', prop: 'Unit 402', time: '10:30 AM', active: true, unread: true },
                  { name: 'David Miller', status: 'Viewing Scheduled', prop: 'Unit 205', time: '8:45 AM' },
                  { name: 'Emily Davis', status: 'Drafting Reply', prop: 'Unit 311', time: '07 Feb' },
                  { name: 'Michael Brown', status: 'Lead Qualified', prop: 'Unit 108', time: '06 Feb' },
                  { name: 'Jessica Thompson', status: 'Follow-up needed', prop: 'Unit 402', time: '06 Feb' },
                ].map((item, i) => (
                  <div key={i} className={`p-5 cursor-pointer transition-all relative ${item.active ? 'bg-blue-50/40 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}>
                     <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold tracking-tight ${item.unread ? 'text-slate-900' : 'text-slate-600'}`}>{item.name}</span>
                        <span className="text-[10px] font-black text-slate-300 tracking-tighter uppercase">{item.time}</span>
                     </div>
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          item.status.includes('Priority') ? 'text-red-600 bg-red-50' : 
                          item.status.includes('Lead') ? 'text-emerald-600 bg-emerald-50' :
                          'text-slate-400 bg-slate-100'
                        }`}>
                           {item.status}
                        </span>
                        <span className="text-[9px] font-bold text-slate-300">• {item.prop}</span>
                     </div>
                     <p className="text-[12px] text-slate-500 font-medium line-clamp-1 leading-snug">
                        I've looked at the lease terms and have one question about the utility breakdown...
                     </p>
                  </div>
                ))}
             </div>
          </div>

          {/* Pane 2: Interaction Core (6 cols) */}
          <div className="col-span-6 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-xl">
             {/* Dynamic Header */}
             <div className="h-16 px-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white text-xs ring-4 ring-slate-50">SC</div>
                   <div>
                      <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Sarah Chen</h3>
                      <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">March Move-in • Unit 402</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100 cursor-default">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[9px] font-black text-blue-700 uppercase">LeaseAI: Autonomous Mode</span>
                   </div>
                </div>
             </div>

             {/* Message Interface */}
             <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/20 scrollbar-hide">
                <div className="flex flex-col items-start gap-3 max-w-[85%]">
                   <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-[14px] font-medium leading-[1.6]">
                      Hi! I’m interested in Unit 402 for March 1st. Are there any restrictions on large breed dogs? I have a 25kg Golden Retriever.
                   </div>
                   <div className="flex items-center gap-2 pl-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sarah • 10:30 AM</span>
                   </div>
                </div>

                {/* AI Technical Stepper: Replaces the bubbly UI */}
                <div className="flex justify-center flex-col items-center group">
                   <div className="w-px h-8 bg-slate-200" />
                   <div className="px-6 py-3 border border-slate-200 bg-white rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 group">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                         <Brain className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                         <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">LeaseAI: Logical Assessment</span>
                            <div className="flex gap-1">
                               <div className="w-1 h-1 rounded-full bg-blue-400" />
                               <div className="w-1 h-1 rounded-full bg-blue-200" />
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400">Step 3: Checking Pet Policy Database...</span>
                         </div>
                      </div>
                   </div>
                   <div className="w-px h-8 bg-slate-200" />
                </div>

                <div className="flex flex-col items-end gap-3 ml-auto max-w-[85%]">
                   <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl rounded-tr-none shadow-2xl shadow-black/5 text-[14px] font-medium leading-[1.6]">
                      Hello Sarah! Unit 402 allows pets up to 30kg, so your Golden Retriever is well within our policy. There's a one-time pet fee of $300. Shall I proceed with the application?
                   </div>
                   <div className="flex items-center gap-3 pr-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                         <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                         <span className="text-[9px] font-black text-emerald-600 uppercase">Agent Review Not Required</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right tracking-[0.1em]">AI Assisted • 10:32 AM</span>
                   </div>
                </div>
             </div>

             {/* Functional Composer */}
             <div className="p-8 border-t border-slate-100 bg-white">
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm focus-within:border-slate-400 focus-within:ring-4 ring-slate-950/5 transition-all overflow-hidden group">
                   <textarea 
                     rows={3}
                     placeholder="Type a message or use 'Option + Enter' for AI magic..." 
                     className="w-full bg-transparent border-0 focus:ring-0 text-[14px] font-medium p-6 resize-none placeholder:text-slate-300"
                   />
                   <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button className="h-9 px-4 border border-slate-200 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all shadow-sm">
                           Attach Unit Data
                        </button>
                        <button className="w-9 h-9 border border-slate-200 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                           <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                         <button className="h-9 px-4 text-xs font-black text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 tracking-tight">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Draft
                         </button>
                         <button className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                            Send
                            <Send className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Pane 3: Strategic Overview (3 cols) */}
          <div className="col-span-3 flex flex-col gap-6 scrollbar-hide">
             
             {/* Qualification Scorecard */}
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prospect Quality</h4>
                   <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-5">
                   {[
                     { label: 'Credit (Experian)', val: '742', sub: 'Excellent', color: 'bg-emerald-500' },
                     { label: 'Income Verification', val: 'Verified', sub: '3.5x Rent', color: 'bg-emerald-500' },
                   ].map((metric, i) => (
                     <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-end">
                           <span className="text-[11px] font-bold text-slate-400">{metric.label}</span>
                           <span className="text-xs font-black text-slate-900">{metric.val}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${metric.color} w-[85%]`} />
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase block text-right">{metric.sub}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Object Focus Container */}
             <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-[16/10] bg-slate-100 overflow-hidden relative">
                   <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop" className="w-full h-full object-cover" alt="Unit 402" />
                   <div className="absolute top-4 right-4 h-7 px-3 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-xl ring-1 ring-black/5">
                      Unit 402
                   </div>
                </div>
                <div className="p-5 space-y-4">
                   <div className="flex justify-between items-end">
                      <div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Premier Listing</span>
                         <h5 className="text-xl font-black text-slate-900 tracking-tight leading-none">$1,750</h5>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-bold text-slate-900 block leading-none">Available</span>
                         <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">March 1st</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                         <span className="text-[10px] font-black text-slate-900 tracking-tight">2 Bed / 1 Bath</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                         <span className="text-[10px] font-black text-slate-900 tracking-tight">85 m²</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Pipeline Actions */}
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workflow</h4>
                <div className="space-y-2">
                   <button className="w-full h-12 glass-matte border-slate-200 flex items-center justify-between px-5 group hover:border-slate-900 hover:bg-slate-50 transition-all rounded-xl shadow-sm">
                      <span className="text-[11px] font-black uppercase tracking-widest">Schedule Viewing</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                   </button>
                   <button className="w-full h-12 glass-matte border-slate-200 flex items-center justify-between px-5 group hover:border-slate-900 hover:bg-slate-50 transition-all rounded-xl shadow-sm">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Request ID Scan</span>
                      <Plus className="w-3.5 h-3.5 text-slate-200" />
                   </button>
                </div>
                <button className="w-full h-12 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-black/5">
                   <ExternalLink className="w-3 h-3" />
                   View Full Profile
                </button>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}
