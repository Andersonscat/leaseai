'use client';

import React from 'react';
import { Bot, User, Clock, CheckCircle2, AlertCircle, MessageSquare, MapPin, Star, ChevronRight, Phone, Mail, CheckSquare } from 'lucide-react';
import Avatar from './Avatar';
import { SOURCE_ICONS } from '@/lib/sources';

interface Lead {
  id: string;
  name: string;
  avatar?: string;
  source: string;
  propertyAddress: string;
  propertyUnit?: string;
  status: string;
  pipelineStage: string;
  leadScore: number;
  leadQuality: string;
  lastAction: string;
  nextStep?: string;
  updatedAt: string;
}

interface ActiveLeadsTableProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  loading?: boolean;
  selectionMode?: boolean;
  selectedLeads?: Set<string>;
  onToggleSelection?: (leadId: string) => void;
  compact?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  'New': 'bg-indigo-50 border-indigo-100 text-indigo-700',
  'New Lead': 'bg-indigo-50 border-indigo-100 text-indigo-700',
  'Contacted': 'bg-sky-50 border-sky-100 text-sky-700',
  'Qualifying': 'bg-amber-50 border-amber-100 text-amber-700',
  'Qualified': 'bg-amber-50 border-amber-100 text-amber-700',
  'Tour Scheduled': 'bg-emerald-50 border-emerald-100 text-emerald-700',
  'Application Received': 'bg-purple-50 border-purple-100 text-purple-700',
  'Approved': 'bg-emerald-500 border-emerald-600 text-white shadow-sm',
};

const QUALITY_COLORS: Record<string, string> = {
  'hot': 'text-red-500',
  'warm': 'text-orange-500',
  'cold': 'text-blue-400',
};

export default function ActiveLeadsTable({ 
  leads, 
  onLeadClick, 
  loading,
  selectionMode,
  selectedLeads,
  onToggleSelection,
  compact
}: ActiveLeadsTableProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-hide">
      <table className="w-full border-separate border-spacing-y-2 px-6">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400/80">
            {selectionMode && <th className="w-10 px-4"></th>}
            <th className="text-left py-2 px-4 font-black">Lead Name</th>
            {!compact && <th className="text-left py-2 px-4 font-black">Property</th>}
            <th className="text-left py-2 px-4 font-black">Status</th>
            {!compact && <th className="text-left py-2 px-4 font-black">Last Action</th>}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const SourceIcon = SOURCE_ICONS[lead.source] || MessageSquare;
            const stageClass = STAGE_COLORS[lead.pipelineStage] || 'bg-gray-100 text-gray-500 border-gray-200';
            
            return (
    <tr
      key={lead.id}
      onClick={() => selectionMode ? onToggleSelection?.(lead.id) : onLeadClick(lead)}
      className={`group cursor-pointer transition-all duration-300 border-b border-black/[0.02] ${selectionMode && selectedLeads?.has(lead.id) ? 'bg-black/[0.03]' : 'hover:bg-black/[0.03]'}`}
    >
      {selectionMode && (
        <td className="py-3 px-4">
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedLeads?.has(lead.id) ? 'bg-black border-black scale-110 shadow-lg' : 'bg-transparent border-black/10'}`}
          >
            {selectedLeads?.has(lead.id) && <CheckSquare className="w-2.5 h-2.5 text-white" />}
          </div>
        </td>
      )}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {/* Source Icon Badge */}
          <div className="relative">
            <Avatar 
              src={lead.avatar} 
              name={lead.name} 
              size="md" 
              className="rounded-xl shadow-sm border border-white/50"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
              <SourceIcon className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-bold text-gray-900 truncate leading-tight">{lead.name}</h4>
              {lead.leadScore >= 80 && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Hot lead" />
              )}
            </div>
            
            {compact ? (
              <p className="text-xs text-gray-500 truncate leading-tight">
                {lead.propertyAddress || 'Interested in properties'}
              </p>
            ) : (
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{lead.source}</p>
            )}
          </div>
        </div>
      </td>
      {!compact && (
        <td className="py-4 px-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{lead.propertyAddress}</p>
            <p className="text-[10px] font-medium text-gray-400 capitalize">{lead.propertyUnit ? `Unit ${lead.propertyUnit}` : 'Unknown Property'}</p>
          </div>
        </td>
      )}
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm ${stageClass}`}
        >
          {lead.pipelineStage}
        </span>
      </td>
      {!compact && (
        <td className="py-4 px-4 text-right">
          <div className="inline-flex flex-col items-end">
            <p className="text-sm font-bold text-gray-900 leading-tight">{lead.nextStep}</p>
            <p className="text-[10px] font-medium text-gray-400">{lead.lastAction}</p>
          </div>
        </td>
      )}
      <td className="py-4 px-4 text-right">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all ml-auto" />
      </td>
    </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
