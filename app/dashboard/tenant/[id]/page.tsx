"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign,
  Sparkles, Dog, Bed, Users, Star, Clock, CheckCircle,
  MessageSquare, Home, TrendingUp, AlertCircle, ExternalLink
} from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const [tenant, setTenant] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tenantRes, convRes] = await Promise.all([
          fetch(`/api/tenants/${tenantId}`),
          fetch(`/api/conversations/${tenantId}`),
        ]);
        const tenantData = await tenantRes.json();
        const convData = await convRes.json();
        setTenant(tenantData.tenant);
        setMessages((convData.messages || []).sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ));
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) fetchData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Tenant not found</h2>
          <Link href="/dashboard?tab=tenants">
            <button className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
              Back to Tenants
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isLead = tenant.status === 'Pending' || tenant.qualification_status;

  const statusColor = {
    Current: "green", Pending: "yellow", "Late Payment": "red", Archived: "gray"
  }[tenant.status as string] || "gray";

  const priorityColor = {
    hot: "red", warm: "orange", cold: "blue"
  }[tenant.lead_priority as string] || "gray";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Back */}
        <Link href="/dashboard?tab=tenants" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-medium transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Tenants
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar src={tenant.avatar} name={tenant.name} size="xl" />
              <div>
                <h1 className="text-2xl font-bold text-black mb-2">{tenant.name}</h1>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge color={statusColor}>{tenant.status}</Badge>
                  {tenant.lead_priority && (
                    <Badge color={priorityColor}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {tenant.lead_priority} lead
                    </Badge>
                  )}
                  {tenant.lead_score != null && (
                    <Badge color="indigo">
                      <Star className="w-3 h-3 mr-1" />
                      Score {tenant.lead_score}/10
                    </Badge>
                  )}
                  {tenant.qualification_status && (
                    <Badge color="purple">{tenant.qualification_status}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  {tenant.email && (
                    <a href={`mailto:${tenant.email}`} className="flex items-center gap-1.5 hover:text-black transition-colors">
                      <Mail className="w-3.5 h-3.5" />{tenant.email}
                    </a>
                  )}
                  {tenant.phone && (
                    <a href={`tel:${tenant.phone}`} className="flex items-center gap-1.5 hover:text-black transition-colors">
                      <Phone className="w-3.5 h-3.5" />{tenant.phone}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    Added {new Date(tenant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {tenant.email && (
                <a href={`mailto:${tenant.email}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              <Link href={`/dashboard?tab=inbox`}>
                <button className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" /> Open Chat
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Personal Information
            </h2>
            <div className="space-y-0">
              <InfoRow label="Full Name" value={tenant.name} icon={Users} />
              <InfoRow label="Email" value={tenant.email} icon={Mail} />
              <InfoRow label="Phone" value={tenant.phone || '—'} icon={Phone} />
              <InfoRow label="Current Address" value={tenant.current_address || tenant.address || '—'} icon={MapPin} />
              {tenant.notes && (
                <div className="pt-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{tenant.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Requirements (Lead mode) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-400" />
              Property Requirements
            </h2>
            <div className="space-y-0">
              {tenant.budget_max ? (
                <InfoRow label="Budget (Max)" value={`$${tenant.budget_max.toLocaleString()}/mo`} icon={DollarSign} />
              ) : (
                <InfoRow label="Budget" value="Not specified" icon={DollarSign} />
              )}
              <InfoRow label="Move-In Date" value={tenant.move_in_date
                ? new Date(tenant.move_in_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'} icon={Calendar} />
              <InfoRow label="Bedrooms" value={tenant.bedrooms_needed ? `${tenant.bedrooms_needed} bed` : '—'} icon={Bed} />
              <InfoRow label="Preferred Area" value={tenant.preferred_location || tenant.address_city || '—'} icon={MapPin} />
              {tenant.pet_details && (
                <div className="py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Dog className="w-4 h-4 text-gray-400" />
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pets</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 ml-6">{tenant.pet_details}</p>
                </div>
              )}
              <InfoRow label="Lease Duration" value={tenant.lease_duration || '—'} icon={Calendar} />
              {tenant.special_requirements && (
                <div className="pt-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Requirements</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{tenant.special_requirements}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights — only for leads */}
        {(tenant.ai_summary || tenant.qualification_status) && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-6">
            <h2 className="text-base font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Lead Assessment
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {tenant.lead_score != null && (
                <div className="bg-white rounded-xl p-4 border border-indigo-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Lead Score</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-indigo-600">{tenant.lead_score}</span>
                    <span className="text-gray-400 text-sm mb-1">/10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(tenant.lead_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {tenant.lead_quality && (
                <div className="bg-white rounded-xl p-4 border border-indigo-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Lead Quality</p>
                  <p className="text-xl font-black text-gray-900 capitalize">{tenant.lead_quality}</p>
                </div>
              )}
              {tenant.qualification_status && (
                <div className="bg-white rounded-xl p-4 border border-indigo-100">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Pipeline Stage</p>
                  <p className="text-sm font-bold text-gray-900">{tenant.qualification_status}</p>
                </div>
              )}
            </div>
            {tenant.ai_summary && (
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{tenant.ai_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Conversation History
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">{messages.length}</span>
              </h2>
              <Link href={`/dashboard?tab=inbox`}
                className="text-xs font-semibold text-gray-400 hover:text-black transition-colors flex items-center gap-1">
                Open in Inbox <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {messages.filter(m => m.sender_type !== 'ai_reasoning').map((msg: any) => (
                <div key={msg.id} className={`px-6 py-4 ${msg.sender_type === 'landlord' ? 'bg-gray-50/50' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      msg.sender_type === 'landlord' ? 'text-gray-500' : 'text-indigo-600'
                    }`}>
                      {msg.sender_type === 'landlord' ? (msg.is_ai_response ? 'AI Reply' : 'You') : tenant.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {msg.message_text || <span className="text-gray-400 italic">empty</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
