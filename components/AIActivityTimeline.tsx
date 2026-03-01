'use client';

import React from 'react';
import { Bot, Sparkles, CheckCircle2, Calendar, User, MessageSquare, AlertCircle, TrendingUp, Search, ShieldCheck } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  type: 'reply' | 'qualification' | 'scheduling' | 'verification' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  leadName: string;
}

interface AIActivityTimelineProps {
  events: ActivityEvent[];
  loading?: boolean;
}

const EVENT_ICONS: Record<string, any> = {
  reply: MessageSquare,
  qualification: Sparkles,
  scheduling: Calendar,
  verification: ShieldCheck,
  alert: AlertCircle,
};

const EVENT_COLORS: Record<string, string> = {
  reply: 'text-black bg-gray-100',
  qualification: 'text-black bg-gray-100',
  scheduling: 'text-black bg-gray-100',
  verification: 'text-black bg-gray-100',
  alert: 'text-white bg-black',
};

export default function AIActivityTimeline({ events, loading }: AIActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-100 rounded w-1/2" />
              <div className="h-2 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 pb-5 border-b border-black/[0.03] flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">AI Agent Activity</h3>
        <TrendingUp className="w-3 h-3 text-gray-300" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        {events.map((event, idx) => {
          const Icon = EVENT_ICONS[event.type] || MessageSquare;
          const colorClass = EVENT_COLORS[event.type] || 'text-gray-500 bg-gray-50';
          
          return (
            <div key={event.id} className="relative flex gap-4 transition-all duration-300 hover:translate-x-1">
              {/* Vertical Line */}
              {idx !== events.length - 1 && (
                <div className="absolute left-[13px] top-8 bottom-[-24px] w-[1px] bg-black/[0.03]" />
              )}
              
              {/* Icon Container */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border border-white/60 shadow-sm backdrop-blur-sm ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                    {event.timestamp}
                  </span>
                </div>
                
                <p className="text-[13px] font-bold text-black leading-tight mb-1">
                  {event.title}
                </p>
                
                <p className="text-[11px] text-gray-500 leading-normal font-medium">
                  {event.description}
                  <span className="font-bold text-black opacity-60 ml-1.5">· {event.leadName}</span>
                </p>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No recent automated actions</p>
          </div>
        )}
      </div>
      
      {/* Mini AI Stats / Footer */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
          <span>Efficiency</span>
          <span className="text-green-500">+12%</span>
        </div>
      </div>
    </div>
  );
}
