import React from 'react';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  // Explicitly typing onChange to be compatible with standard input handlers
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MoneyInput({ className = "", ...props }: MoneyInputProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-gray-500 font-medium">$</span>
      </div>
      <input
        type="number"
        className={`w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-base text-black placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
