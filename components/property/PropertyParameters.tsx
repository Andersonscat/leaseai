'use client';

import { useState } from 'react';
import { PropertyParameters, Evidence } from '@/types/property-parameters';
import { 
  ChevronDown, ChevronUp, AlertTriangle, HelpCircle, Info, 
  Check, X, Edit2, Save, RefreshCw 
} from 'lucide-react';

interface Props {
  data: PropertyParameters;
  onSave?: (newData: PropertyParameters) => Promise<void>;
  onRefresh?: () => Promise<void>; // Triggers AI re-extraction
  isLoading?: boolean;
}

export default function PropertyParametersView({ data, onSave, onRefresh, isLoading }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>('summary');
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState<PropertyParameters>(data);

  // Sync local data if props change (and not editing)
  if (data !== localData && !editMode) {
      setLocalData(data);
  }

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(localData);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setLocalData(data);
    setEditMode(false);
  };

  const updateField = (path: string, value: any) => {
    const parts = path.split('.');
    setLocalData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  // Helper to render a field with evidence
  const Field = ({ 
    label, 
    value, 
    path, 
    unit = '',
    placeholder = 'Unknown',
    options,
    type = 'text',
    isBoolean = false
  }: { 
    label: string, 
    value: any, 
    path: string, 
    unit?: string, 
    placeholder?: string,
    options?: string[],
    type?: 'text' | 'number' | 'date',
    isBoolean?: boolean
  }) => {
    
    // Find evidence
    const evidenceKey = path; 
    const quote = localData.audit?.evidence?.[evidenceKey];
    
    // Handle display value
    let displayValue: any = value;
    if (isBoolean) {
        displayValue = value === true ? 'Yes' : (value === false ? 'No' : null);
    } else if (value === null || value === undefined) {
        displayValue = null;
    }

    // Input renderer
    const renderInput = () => {
      if (isBoolean) {
        return (
          <select 
            value={value === true ? 'true' : (value === false ? 'false' : '')}
            onChange={(e) => {
              const v = e.target.value;
              updateField(path, v === 'true' ? true : (v === 'false' ? false : undefined));
            }}
            className="text-sm border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-black outline-none w-full"
          >
            <option value="">Unknown</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      }

      if (options) {
        return (
          <select 
            value={value || ''}
            onChange={(e) => updateField(path, e.target.value || undefined)}
            className="text-sm border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-black outline-none w-full"
          >
            <option value="">{placeholder}</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      return (
        <div className="flex items-center">
            <input 
            type={type}
            value={value || ''}
            onChange={(e) => updateField(path, type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={placeholder}
            className="text-sm border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-black outline-none w-full"
            />
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
        </div>
      );
    };

    return (
      <div className="flex flex-col py-2 border-b border-gray-50 last:border-0">
        <div className="flex items-center justify-between min-h-[32px]">
          <span className="text-sm text-gray-500 font-medium w-1/3 mr-2">{label}</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            {editMode ? (
               <div className="w-full max-w-[200px]">
                  {renderInput()}
               </div>
            ) : (
                <>
                <span className={`text-sm font-semibold text-right ${!displayValue ? 'text-gray-300 italic' : 'text-gray-900'}`}>
                {displayValue !== null ? `${displayValue}${!isBoolean ? unit : ''}` : placeholder}
                </span>
                {quote && (
                    <div className="group relative flex-shrink-0">
                        <Info className="w-3.5 h-3.5 text-blue-400 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <p className="font-bold mb-1 text-gray-300">Source Evidence:</p>
                        "{quote}"
                        </div>
                    </div>
                )}
                </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between py-4 hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <span className="font-bold text-gray-900 text-base">{title}</span>
        </div>
        {activeSection === id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {activeSection === id && (
         <div className="pb-6 px-2 animate-in slide-in-from-top-1 duration-200">
           {children}
         </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Property Parameters</h3>
        <div className="flex gap-2">
          {onRefresh && !editMode && (
            <button 
              onClick={onRefresh} 
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" 
              title="Re-analyze Description"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onSave && (
              editMode ? (
                <>
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                </>
              ) : (
                <button 
                  onClick={() => setEditMode(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  title="Edit Parameters"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )
          )}
        </div>
      </div>

      {/* Conflicts & Unknowns Alert (Group K) */}
      {(localData.audit?.conflicts?.length > 0 || localData.audit?.unknowns?.length > 0) && !editMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-800 text-sm mb-2">Attention Needed</h4>
              
              {localData.audit.conflicts.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-1">Conflicts:</p>
                  <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                    {localData.audit.conflicts.map((c, i) => (
                      <li key={i}>{c.field}: {c.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {localData.audit.unknowns.length > 0 && (
                 <div>
                    <p className="text-xs font-bold text-amber-700 uppercase mb-1">Missing Data:</p>
                    <div className="flex flex-wrap gap-2">
                      {localData.audit.unknowns.slice(0, 8).map((u, i) => (
                        <span key={i} className="px-2 py-1 bg-white border border-amber-200 text-amber-800 text-xs rounded-md">
                          {u}
                        </span>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sections A-J */}
      <div className="grid gap-2">
         {/* A: Identity */}
         <Section id="identity" title="Identity & Type" icon={Info}>
            <Field label="Type" path="identity.type" value={localData.identity?.type} options={['apartment', 'condo', 'townhouse', 'sfh', 'unknown']} />
            <Field label="Managed By" path="identity.managed_by" value={localData.identity?.managed_by} options={['owner', 'pm', 'hoa', 'unknown']} />
            <Field label="Unit Number" path="identity.unit_number" value={localData.identity?.unit_number} />
         </Section>

        {/* B: Pricing */}
        <Section id="pricing" title="Pricing & Fees" icon={HelpCircle}>
           <Field label="Monthly Rent" path="pricing.rent_monthly" value={localData.pricing?.rent_monthly} unit="$" type="number" />
           <Field label="Security Deposit" path="pricing.security_deposit" value={localData.pricing?.security_deposit} unit="$" type="number" />
           <Field label="Application Fee" path="pricing.application_fee_per_adult" value={localData.pricing?.application_fee_per_adult} unit="$" type="number" />
           <Field label="Holding Deposit" path="pricing.holding_deposit" value={localData.pricing?.holding_deposit} unit="$" type="number" />
           <Field label="Holding Policy" path="pricing.holding_deposit_policy" value={localData.pricing?.holding_deposit_policy} options={['refundable', 'non-refundable', 'applies_to_deposit', 'unknown']} />
        </Section>

        {/* D: Layout */}
        <Section id="layout" title="Layout & Living" icon={Info}>
           <Field label="Bedrooms" path="layout.beds" value={localData.layout?.beds} type="number" />
           <Field label="Bathrooms" path="layout.baths" value={localData.layout?.baths} type="number" />
           <Field label="Square Ft" path="layout.sqft" value={localData.layout?.sqft} unit=" sqft" type="number" />
           <Field label="Storage Notes" path="layout.storage_notes" value={localData.layout?.storage_notes} />
        </Section>
        
        {/* C: Availability */}
        <Section id="availability" title="Availability & Terms" icon={Check}>
           <Field label="Available Date" path="availability.available_date" value={localData.availability?.available_date} type="date" />
           <Field label="Available Now" path="availability.available_now" value={localData.availability?.available_now} isBoolean />
           <Field label="Min Lease" path="availability.lease_term_min_months" value={localData.availability?.lease_term_min_months} unit=" months" type="number" />
           <Field label="Short Term Allowed" path="availability.sublease_allowed" value={localData.availability?.sublease_allowed} isBoolean />
           <Field label="Smoking Allowed" path="availability.smoking_allowed" value={localData.availability?.smoking_allowed} isBoolean />
        </Section>
        
        {/* H: Pets */}
        <Section id="pets" title="Pet Policy" icon={Info}>
           <Field label="Pets Allowed" path="pets.allowed" value={localData.pets?.allowed} isBoolean />
           <Field label="Cats Allowed" path="pets.cats_allowed" value={localData.pets?.cats_allowed} isBoolean />
           <Field label="Dogs Allowed" path="pets.dogs_allowed" value={localData.pets?.dogs_allowed} isBoolean />
           <Field label="Pet Fee (1x)" path="pets.pet_fee_one_time" value={localData.pets?.pet_fee_one_time} unit="$" type="number" />
           <Field label="Pet Rent (Mo)" path="pets.pet_rent_monthly" value={localData.pets?.pet_rent_monthly} unit="$" type="number" />
        </Section>

        {/* G: Amenities & Parking */}
         <Section id="amenities" title="Amenities & Parking" icon={Info}>
           <Field label="Parking Type" path="amenities_access.parking_type" value={localData.amenities_access?.parking_type} options={['garage', 'carport', 'assigned', 'street', 'uncovered', 'none']} />
           <Field label="Parking Spaces" path="amenities_access.parking_spaces" value={localData.amenities_access?.parking_spaces} type="number" />
           <Field label="Laundry" path="amenities_access.laundry_type" value={localData.amenities_access?.laundry_type} options={['in-unit', 'shared', 'hookups', 'none', 'unknown']} />
           <Field label="W/D Included" path="amenities_access.washer_dryer_included" value={localData.amenities_access?.washer_dryer_included} isBoolean />
        </Section>

        {/* E: Condition */}
        <Section id="condition" title="Condition & Furnishing" icon={Info}>
            <Field label="Furnished" path="condition.furnished" value={localData.condition?.furnished} isBoolean />
            <Field label="Flooring" path="condition.flooring" value={localData.condition?.flooring} options={['hardwood', 'carpet', 'tile', 'laminate', 'mixed', 'unknown']} />
             <Field label="Remodeled" path="condition.remodeled" value={localData.condition?.remodeled} isBoolean />
        </Section>

        {/* J: Screening */}
        <Section id="screening" title="Screening Criteria" icon={Check}>
            <Field label="Income Multiplier" path="screening.income_multiple" value={localData.screening?.income_multiple} type="number" />
            <Field label="Min Credit Score" path="screening.credit_score_min" value={localData.screening?.credit_score_min} type="number" />
            <Field label="Background Check" path="screening.background_check_required" value={localData.screening?.background_check_required} isBoolean />
        </Section>
      </div>

      {localData.audit?.questions_to_ask_agent?.length > 0 && (
         <div className="mt-6 border-t pt-4">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Questions for Landlord:</h4>
            <ul className="space-y-2">
               {localData.audit.questions_to_ask_agent.map((q, i) => (
                 <li key={i} className="flex gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{q.question}</span>
                 </li>
               ))}
            </ul>
         </div>
      )}
    </div>
  );
}
