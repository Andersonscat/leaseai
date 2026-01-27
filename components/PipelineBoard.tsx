
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { MoreHorizontal, Phone, Mail, Calendar, MapPin, DollarSign } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property_address?: string;
  pipeline_stage: string;
  lead_score?: number;
  notes?: string;
}

const STAGES = [
  { id: 'New Lead', label: 'New Lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Qualified', label: 'Qualified', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Viewing Scheduled', label: 'Viewing', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Application Sent', label: 'Application', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'Lease Signed', label: 'Signed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export default function PipelineBoard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTenantId, setDraggedTenantId] = useState<string | null>(null);

  const supabase = createSupabaseClient();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      // In a real app we would join with properties, etc.
      // For now fetching raw tenants and mapping extracting stage
      // If pipeline_stage doesn't exist yet, we default to 'New Lead'
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Temporary fix until migration is run: fill missing stage
      const processed = (data || []).map((t: any) => ({
        ...t,
        pipeline_stage: t.pipeline_stage || 'New Lead'
      }));

      setTenants(processed);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (tenantId: string, newStage: string) => {
    // Optimistic update
    setTenants(prev => prev.map(t => 
      t.id === tenantId ? { ...t, pipeline_stage: newStage } : t
    ));

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ pipeline_stage: newStage })
        .eq('id', tenantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating stage:', error);
      fetchTenants(); // Revert on error
    }
  };

  const handleDragStart = (e: React.DragEvent, tenantId: string) => {
    setDraggedTenantId(tenantId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedTenantId) {
      updateStage(draggedTenantId, stageId);
      setDraggedTenantId(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading pipeline...</div>;

  return (
    <div className="h-full overflow-x-auto p-6">
      <div className="flex gap-6 min-w-max h-full">
        {STAGES.map(stage => (
          <div 
            key={stage.id} 
            className="w-[320px] flex flex-col h-full max-h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between p-3 mb-3 rounded-xl border ${stage.color} bg-opacity-50`}>
              <span className="font-bold text-sm">{stage.label}</span>
              <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-bold">
                {tenants.filter(t => t.pipeline_stage === stage.id).length}
              </span>
            </div>

            {/* Drop Zone / List */}
            <div className="flex-1 overflow-y-auto pr-1 animate-in fade-in">
              <div className="flex flex-col gap-3 pb-4">
                {tenants
                  .filter(t => t.pipeline_stage === stage.id)
                  .map(tenant => (
                    <div
                      key={tenant.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tenant.id)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{tenant.name || tenant.email}</h4>
                        <button className="text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {tenant.property_address && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{tenant.property_address}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-50">
                        {tenant.lead_score && (
                          <div className={`text-xs font-bold px-2 py-1 rounded bg-gray-50 text-center ${
                             tenant.lead_score >= 8 ? 'text-green-600 bg-green-50' : 
                             tenant.lead_score >= 5 ? 'text-amber-600 bg-amber-50' : 'text-gray-500'
                          }`}>
                            Score: {tenant.lead_score}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                           Last activity: 2h
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
