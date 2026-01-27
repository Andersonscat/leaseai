'use client';

import { CheckCircle, Loader2, Circle } from 'lucide-react';

interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'complete';
  data?: any;
  duration?: number;
}

interface AIThinkingPanelProps {
  steps: ThinkingStep[];
  isProcessing: boolean;
}

export default function AIThinkingPanel({ steps, isProcessing }: AIThinkingPanelProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold">AI Processing</h3>
          <p className="text-sm text-white/80">
            {isProcessing ? 'Analyzing...' : 'Complete'}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg transition-all duration-300
              ${step.status === 'in_progress' ? 'bg-white/20 animate-pulse' : 'bg-white/10'}
              ${step.status === 'complete' ? 'opacity-100' : ''}
              ${step.status === 'pending' ? 'opacity-50' : ''}
            `}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'complete' && (
                <CheckCircle className="w-5 h-5 text-green-300" />
              )}
              {step.status === 'in_progress' && (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              )}
              {step.status === 'pending' && (
                <Circle className="w-5 h-5 text-white/40" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{step.label}</span>
                {step.duration && step.status === 'complete' && (
                  <span className="text-xs text-white/60">{step.duration}ms</span>
                )}
              </div>

              {/* Additional Data */}
              {step.data && step.status === 'complete' && (
                <div className="mt-2 text-xs text-white/80 space-y-1">
                  {step.data.budget && (
                    <div>💰 Budget: {step.data.budget}</div>
                  )}
                  {step.data.requirements && (
                    <div>📋 Requirements: {step.data.requirements}</div>
                  )}
                  {step.data.propertiesFound !== undefined && (
                    <div>🏠 Found {step.data.propertiesFound} matching properties</div>
                  )}
                  {step.data.propertyAddress && (
                    <div className="text-green-300">→ {step.data.propertyAddress}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isProcessing && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Powered by Gemini AI</span>
            <span>
              {steps.filter(s => s.status === 'complete').length}/{steps.length} steps
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
