'use client';

import { CheckCircle2, Circle, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'complete';
  data?: any;
}

interface AIThinkingStepsProps {
  steps: ThinkingStep[];
  onComplete?: () => void;
}

export default function AIThinkingSteps({ steps, onComplete }: AIThinkingStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Auto-collapse when done (optional enhancement)
  const isAllComplete = steps.every(s => s.status === 'complete');

  return (
    <div className="w-full bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div 
        className="px-4 py-3 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded-full ${isAllComplete ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
             {isAllComplete ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
           </div>
           <div>
             <span className="text-sm font-bold text-gray-900 block">
               {isAllComplete ? 'AI Response Ready' : 'AI Agent Working...'}
             </span>
             {!isAllComplete && (
               <span className="text-xs text-purple-600 font-medium">
                 {steps.find(s => s.status === 'in_progress')?.label || 'Processing...'}
               </span>
             )}
           </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
           {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Steps Body */}
      {isExpanded && (
        <div className="p-2 bg-white">
           <div className="space-y-1">
             {steps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-300 ${
                    step.status === 'in_progress' ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                   {/* Status Icon */}
                   <div className="mt-0.5 shrink-0">
                      {step.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {step.status === 'in_progress' && <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />}
                      {step.status === 'pending' && <Circle className="w-4 h-4 text-gray-200" />}
                   </div>

                   {/* Content */}
                   <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${
                        step.status === 'in_progress' ? 'text-purple-700' : step.status === 'complete' ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      
                      {/* Step Details / Data */}
                      {step.data && step.status === 'complete' && (
                         <div className="mt-1.5 ml-1 pl-2 border-l-2 border-gray-100">
                            {Object.entries(step.data).map(([key, value]) => (
                               <div key={key} className="text-[10px] text-gray-500 mb-0.5 last:mb-0">
                                  <span className="font-semibold text-gray-700 capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
