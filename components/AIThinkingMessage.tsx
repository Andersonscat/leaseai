'use client';

import { Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIThinkingMessageProps {
  steps: {
    id: string;
    label: string;
    status: 'pending' | 'in_progress' | 'complete';
    data?: any;
  }[];
  isProcessing: boolean;
}

export default function AIThinkingMessage({ steps, isProcessing }: AIThinkingMessageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Animate through steps
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800); // Change step every 800ms

    return () => clearInterval(interval);
  }, [isProcessing, steps.length]);

  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex justify-end mb-2">
      <div className="text-right">
        {/* Simple text lines showing AI thinking */}
        <div className="text-sm text-orange-600 italic space-y-1">
          {isProcessing ? (
            <>
              {steps.slice(0, currentStepIndex + 1).map((step) => (
                <div key={step.id} className="animate-pulse">
                  {step.label}...
                </div>
              ))}
            </>
          ) : (
            <div className="text-gray-400">
              AI processed in {steps.length} steps
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
