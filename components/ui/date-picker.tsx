import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfToday, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, label, placeholder = "Select date", className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Parse initial value or default to today for view
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date(); // T12:00:00 to avoid timezone shifts
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = startOfToday();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset view to selected date or today when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(value ? new Date(value + 'T12:00:00') : new Date());
    }
  }, [isOpen, value]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isPrevMonthDisabled = isSameMonth(currentMonth, today) || isBefore(currentMonth, today);

  const onDateClick = (day: Date) => {
    // Return YYYY-MM-DD
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Display value
  const displayValue = value ? format(new Date(value + 'T12:00:00'), 'MMM d, yyyy') : '';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Input Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border-2 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? 'border-black ring-2 ring-black/5' : 'border-gray-200 hover:border-gray-400'
        }`}
      >
        <span className={displayValue ? "text-black" : "text-gray-400"}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="w-5 h-5 text-gray-500" />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[300px] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-lg text-black">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); prevMonth(); }}
                disabled={isPrevMonthDisabled}
                className={`p-1 rounded-full transition-colors ${
                  isPrevMonthDisabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); nextMonth(); }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const isSelected = value === dateString;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);
              const isPastDate = isBefore(day, today);

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={(e) => { e.stopPropagation(); onDateClick(day); }}
                  disabled={!isCurrentMonth || isPastDate}
                  className={`
                    h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${!isCurrentMonth ? 'text-gray-300 invisible' : ''}
                    ${isPastDate ? 'text-gray-300 cursor-not-allowed line-through decoration-gray-300' : ''}
                    ${isSelected && !isPastDate
                      ? 'bg-black text-white shadow-md transform scale-105' 
                      : !isPastDate ? 'text-gray-700 hover:bg-gray-100' : ''
                    }
                    ${isTodayDate && !isSelected && !isPastDate ? 'text-blue-600 font-bold bg-blue-50' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
