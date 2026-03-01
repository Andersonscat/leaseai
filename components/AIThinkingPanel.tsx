import React, { useState, useEffect, useRef } from 'react';
import { Brain, Search, Terminal, Loader2, ChevronDown, Check } from 'lucide-react';

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  description?: string;
  iconType: 'analyze' | 'search' | 'reason' | 'draft';
}

interface AIThinkingPanelProps {
  steps: ThinkingStep[];
  isStatic?: boolean;
}

const TypewriterText: React.FC<{ text: string; delay?: number; isStatic?: boolean }> = ({ text, delay = 10, isStatic = false }) => {
  const [displayedText, setDisplayedText] = useState(isStatic ? text : '');

  useEffect(() => {
    if (isStatic) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, delay);

    return () => clearInterval(timer);
  }, [text, delay, isStatic]);

  return <span>{displayedText}</span>;
};

const AIThinkingPanel: React.FC<AIThinkingPanelProps> = ({ steps, isStatic = false }) => {
  const [isExpanded, setIsExpanded] = useState(!isStatic);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = steps.some(s => s.status === 'active');
  const allCompleted = steps.every(s => s.status === 'completed');

  useEffect(() => {
    if (isActive && !isStatic) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds(prev => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isStatic]);

  const getIcon = (type: ThinkingStep['iconType'], status: ThinkingStep['status']) => {
    const isPending = status === 'pending';
    const isActive = status === 'active';
    const colorClass = isPending ? 'text-gray-300' : isActive ? 'text-indigo-500' : 'text-indigo-400';

    switch (type) {
      case 'analyze': return <Brain className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'search': return <Search className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'reason': return <Terminal className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'draft': return <Loader2 className={`w-3.5 h-3.5 ${colorClass} ${isActive ? 'animate-spin' : ''}`} />;
      default: return null;
    }
  };

  return (
    <div className={`w-full mb-8 flex flex-col items-end px-4 ${!isStatic ? 'animate-message-pop' : ''}`}>
      <div className="w-full max-w-[85%] transition-all duration-300">
        {/* Minimal Toggle Header */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 py-2 text-gray-400 hover:text-gray-600 transition-colors group"
        >
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">
              {allCompleted ? 'Thought process' : isActive ? `Thinking for ${elapsedSeconds}s` : 'Thinking...'}
            </span>
            {isActive && (
              <div className="flex gap-1 items-center">
                <div className="w-0.5 h-0.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-0.5 h-0.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-0.5 h-0.5 bg-indigo-400 rounded-full animate-bounce" />
              </div>
            )}
            {allCompleted && <Check className="w-3 h-3 text-green-500/70" />}
          </div>
        </button>

        {/* Expandable Content (Ghost style) */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
          } overflow-hidden`}
        >
          <div className="pr-2">
            <div className="flex flex-col gap-6 relative">
              {/* Connector line background */}
              <div className="absolute left-[17px] top-6 bottom-6 w-[1px] bg-gray-100" />

              {steps.map((step, index) => {
                const isPending = step.status === 'pending';
                const isActive = step.status === 'active';
                const isCompleted = step.status === 'completed';

                return (
                  <div key={step.id} className={`flex gap-4 items-start transition-opacity duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                    {/* Icon */}
                    <div className={`w-[35px] h-[35px] rounded-lg flex items-center justify-center shrink-0 z-10 transition-all ${
                      isActive ? 'bg-indigo-50/50 scale-110' : isCompleted ? 'bg-white border border-gray-50' : 'bg-transparent'
                    }`}>
                      {getIcon(step.iconType, step.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className={`text-[12px] font-bold mb-1 ${isActive ? 'text-indigo-600' : 'text-gray-900 font-black'}`}>
                        {step.label}
                      </h4>
                      {step.description && !isPending && (
                        <div className="text-[12px] text-gray-500 leading-relaxed font-medium max-h-[80px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                          <TypewriterText text={step.description} isStatic={isStatic} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIThinkingPanel;
