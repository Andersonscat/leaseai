'use client';

import { useState, useEffect } from 'react';
import {
  User, ClipboardList, Calendar, MapPin, Clock, CheckCircle2,
  UserCheck, AlertTriangle, Sparkles, RefreshCw, ExternalLink,
  Bot, DollarSign, Home, Dog, Users as UsersIcon, Mail, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationProp {
  tenant_id: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    auto_reply_enabled: boolean;
    notes?: string;
    ai_summary?: string;
    budget_max?: number;
    move_in_date?: string;
    has_pets?: boolean;
    lead_priority?: 'hot' | 'warm' | 'cold';
    pet_details?: string | Record<string, any>;
    qualification_status?: string;
    lead_score?: number;
    lead_quality?: string;
    bedrooms?: number;
    bathrooms?: number;
    num_occupants?: number;
    lease_duration?: string;
    furnishing?: string;
    property_type?: string;
    must_haves?: string[];
    deal_breakers?: string[];
    required_amenities?: string[];
    preferred_neighborhoods?: string[];
    needs_parking?: boolean;
  };
  property?: {
    id: string;
    address: string;
    price: string;
  };
  source: string;
}

interface InboxContextPanelProps {
  selectedConversation: ConversationProp | null;
}

const PRIORITY_STYLES: Record<string, { label: string; dot: string; bg: string }> = {
  hot:  { label: 'Hot Lead',  dot: 'bg-red-500',    bg: 'bg-red-50 text-red-700 border-red-200' },
  warm: { label: 'Warm Lead', dot: 'bg-orange-400', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  cold: { label: 'Cold Lead', dot: 'bg-blue-400',   bg: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function FieldRow({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
  const hasValue = value != null && value !== '' && value !== 0;
  return (
    <div className={`flex items-start justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
      hasValue ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-dashed border-gray-200'
    }`}>
      <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`text-[10px] font-semibold break-words max-w-[55%] text-right ${
        hasValue ? 'text-gray-800' : 'text-gray-300 italic'
      }`}>
        {hasValue ? String(value) : 'Unknown'}
      </span>
    </div>
  );
}

export default function InboxContextPanel({ selectedConversation }: InboxContextPanelProps) {
  const [appointment, setAppointment] = useState<any>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    if (!selectedConversation) {
      setAppointment(null);
      return;
    }

    const fetchAppointment = async () => {
      setLoadingAppointment(true);
      try {
        const res = await fetch('/api/appointments');
        const data = await res.json();
        const upcoming = data.upcoming || [];
        const match = upcoming.find(
          (a: any) => a.tenant_id === selectedConversation.tenant_id
        );
        setAppointment(match || null);
      } catch {
        setAppointment(null);
      } finally {
        setLoadingAppointment(false);
      }
    };

    fetchAppointment();
  }, [selectedConversation?.tenant_id]);

  const handleReanalyze = async () => {
    if (!selectedConversation?.tenant_id || reanalyzing) return;
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.tenant_id}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error('Analyze failed');
      window.location.reload();
    } catch (err) {
      console.error('Reanalyze error:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Agent Activity</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Bot className="w-8 h-8 text-gray-200 mb-3" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Select a conversation
          </p>
          <p className="text-[10px] text-gray-300 mt-1 text-center">
            Lead context will appear here
          </p>
        </div>
      </div>
    );
  }

  const tenant = selectedConversation.tenant;
  const property = selectedConversation.property;
  const summaryText = tenant?.ai_summary || tenant?.notes;
  const priority = tenant?.lead_priority || (tenant?.lead_quality as 'hot' | 'warm' | 'cold' | undefined);
  const priorityStyle = priority ? PRIORITY_STYLES[priority] : null;
  const score = tenant?.lead_score;
  const scoreColor = (score ?? 0) >= 80 ? 'text-green-600' : (score ?? 0) >= 50 ? 'text-orange-500' : 'text-gray-400';
  const barColor = (score ?? 0) >= 80 ? 'bg-green-500' : (score ?? 0) >= 50 ? 'bg-orange-400' : 'bg-gray-300';

  const budgetDisplay = tenant?.budget_max
    ? `$${tenant.budget_max.toLocaleString()}/mo`
    : null;

  const moveInDisplay = tenant?.move_in_date
    ? new Date(tenant.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const petDisplay = (() => {
    if (tenant?.pet_details) {
      if (typeof tenant.pet_details === 'string') return tenant.pet_details;
      const pd = tenant.pet_details as Record<string, any>;
      if (pd.has_pets === false) return 'No pets';
      const parts: string[] = [];
      if (pd.type) parts.push(pd.type);
      if (pd.breed) parts.push(pd.breed);
      if (pd.weight) parts.push(`${pd.weight} lbs`);
      return parts.length > 0 ? parts.join(', ') : 'Has pets';
    }
    if (tenant?.has_pets === false) return 'No pets';
    if (tenant?.has_pets === true) return 'Has pets';
    return undefined;
  })();

  const leaseDurationDisplay = tenant?.lease_duration
    ? tenant.lease_duration.replace(/_/g, ' ')
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Agent Activity</span>
        </div>
        {score != null && score > 0 && (
          <span className={`text-[11px] font-black tabular-nums ${scoreColor}`}>
            {score}%
          </span>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">

        {/* Reanalyze Button */}
        <button
          onClick={handleReanalyze}
          disabled={reanalyzing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${reanalyzing ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-semibold text-gray-600">
            {reanalyzing ? 'Reanalyzing...' : 'Reanalyze Conversation'}
          </span>
        </button>

        {/* Guest Card */}
        <AnimatePresence>
          {summaryText && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Guest Card</p>
                {priorityStyle && (
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${priorityStyle.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                    {priorityStyle.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed">{summaryText}</p>
              {tenant.qualification_status && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-600">{tenant.qualification_status}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead Score Bar */}
        {score != null && score > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Score</span>
              <span className={`text-[10px] font-black tabular-nums ${scoreColor}`}>{score}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
            {tenant?.lead_quality && (
              <p className="text-[9px] text-gray-400 mt-1 capitalize">{tenant.lead_quality} quality</p>
            )}
          </div>
        )}

        {/* Best Match (Property) */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>Property Match</span>
            {property && <Sparkles className="w-3 h-3 text-yellow-500" />}
          </p>
          {property ? (
            <motion.a
              href={`/dashboard/property/${property.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="block bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                  <p className="text-[11px] font-bold text-gray-800 truncate">{property.address}</p>
                </div>
                {property.price && (
                  <p className="text-[10px] font-semibold text-gray-600 ml-[18px]">
                    {property.price}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 ml-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                  <span className="text-[9px] text-gray-400">View property</span>
                </div>
              </div>
            </motion.a>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 px-3 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl">
              <Home className="w-4 h-4 text-gray-300 mb-1.5" />
              <p className="text-[10px] text-gray-400 text-center">No property linked</p>
            </div>
          )}
        </div>

        {/* Pending Checks */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Pending Checks
          </p>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            <p className="text-[10px] text-gray-400">No pending checks</p>
          </div>
        </div>

        {/* Human Handoff */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Human Handoff
          </p>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            <p className="text-[10px] text-gray-400">AI handling — no handoff needed</p>
          </div>
        </div>

        {/* Appointment */}
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
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">Property</p>
                    <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                      {appointment.properties?.address || property?.address || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">Date & Time</p>
                    <p className="text-[11px] font-semibold text-gray-800 leading-tight">
                      {(() => {
                        try {
                          const d = new Date(appointment.start_time);
                          return d.toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                          });
                        } catch { return appointment.start_time; }
                      })()}
                    </p>
                  </div>
                </div>
                {appointment.google_event_link && (
                  <a
                    href={appointment.google_event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                    <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700">View in Google Calendar</span>
                  </a>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="appointment-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-4 px-3 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl"
              >
                <Calendar className="w-4 h-4 text-gray-300 mb-1.5" />
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  No appointment yet
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tenant Profile */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <User className="w-3 h-3" />
            Tenant Profile
          </p>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <FieldRow label="Name" value={tenant?.name} icon={<User className="w-2.5 h-2.5" />} />
            <FieldRow label="Email" value={tenant?.email} icon={<Mail className="w-2.5 h-2.5" />} />
            <FieldRow label="Phone" value={tenant?.phone} icon={<Phone className="w-2.5 h-2.5" />} />
            <FieldRow label="Occupants" value={tenant?.num_occupants} icon={<UsersIcon className="w-2.5 h-2.5" />} />
            <FieldRow label="Pets" value={petDisplay} icon={<Dog className="w-2.5 h-2.5" />} />
            <FieldRow label="Source" value={selectedConversation.source} icon={<Sparkles className="w-2.5 h-2.5" />} />
          </motion.div>
        </div>

        {/* Property Requirements */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            Property Requirements
          </p>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <FieldRow label="Budget" value={budgetDisplay} icon={<DollarSign className="w-2.5 h-2.5" />} />
            <FieldRow label="Move-in" value={moveInDisplay} icon={<Calendar className="w-2.5 h-2.5" />} />
            <FieldRow label="Bedrooms" value={tenant?.bedrooms} icon={<Home className="w-2.5 h-2.5" />} />
            <FieldRow label="Bathrooms" value={tenant?.bathrooms} icon={<Home className="w-2.5 h-2.5" />} />
            <FieldRow label="Lease" value={leaseDurationDisplay} icon={<Clock className="w-2.5 h-2.5" />} />
            <FieldRow label="Furnishing" value={tenant?.furnishing} icon={<Home className="w-2.5 h-2.5" />} />
            <FieldRow label="Property Type" value={tenant?.property_type} icon={<Home className="w-2.5 h-2.5" />} />
            <FieldRow label="Parking" value={tenant?.needs_parking ? 'Required' : tenant?.needs_parking === false ? 'Not needed' : undefined} icon={<MapPin className="w-2.5 h-2.5" />} />
          </motion.div>
        </div>

        {/* Preferred Neighborhoods */}
        {Array.isArray(tenant?.preferred_neighborhoods) && tenant.preferred_neighborhoods.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Preferred Neighborhoods
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tenant.preferred_neighborhoods.map((n, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Must-Haves */}
        {Array.isArray(tenant?.must_haves) && tenant.must_haves.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Must-Haves
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tenant.must_haves.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-green-50 text-green-700 border border-green-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deal Breakers */}
        {Array.isArray(tenant?.deal_breakers) && tenant.deal_breakers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Deal Breakers
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tenant.deal_breakers.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-red-50 text-red-700 border border-red-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Required Amenities */}
        {Array.isArray(tenant?.required_amenities) && tenant.required_amenities.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Required Amenities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tenant.required_amenities.map((item, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
