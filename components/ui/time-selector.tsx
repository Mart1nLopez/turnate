'use client';

import { useState, useRef, useEffect } from 'react';
import { TbClock, TbChevronUp, TbChevronDown } from 'react-icons/tb';
import { cn } from '@/lib/utils';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimeSelector({
  value,
  onChange,
  label,
  placeholder = 'Selecciona una hora',
  required = false,
  disabled = false,
  className,
}: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generar opciones de minutos (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'];

  // Extraer horas y minutos del valor actual
  const getCurrentTime = () => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      return { hours: h, minutes: m };
    }
    return { hours: '09', minutes: '00' };
  };

  const { hours: currentHours, minutes: currentMinutes } = getCurrentTime();

  // Función para actualizar el tiempo
  const updateTime = (newHours: string, newMinutes: string) => {
    const timeValue = `${newHours}:${newMinutes}`;
    onChange(timeValue);
  };

  // Cerrar el selector cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayTime = () => {
    if (!currentHours || !currentMinutes) return placeholder;
    const hour24 = parseInt(currentHours);
    const hour12 =
      hour24 === 0 ? 12
      : hour24 > 12 ? hour24 - 12
      : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12.toString().padStart(2, '0')}:${currentMinutes} ${period}`;
  };

  const incrementHour = () => {
    const newHour = (parseInt(currentHours) + 1) % 24;
    updateTime(newHour.toString().padStart(2, '0'), currentMinutes);
  };

  const decrementHour = () => {
    const newHour = parseInt(currentHours) - 1 < 0 ? 23 : parseInt(currentHours) - 1;
    updateTime(newHour.toString().padStart(2, '0'), currentMinutes);
  };

  const incrementMinute = () => {
    const currentIndex = minuteOptions.indexOf(currentMinutes);
    const nextIndex = (currentIndex + 1) % minuteOptions.length;
    updateTime(currentHours, minuteOptions[nextIndex]);
  };

  const decrementMinute = () => {
    const currentIndex = minuteOptions.indexOf(currentMinutes);
    const prevIndex = currentIndex - 1 < 0 ? minuteOptions.length - 1 : currentIndex - 1;
    updateTime(currentHours, minuteOptions[prevIndex]);
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Input Display */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 text-left border border-gray-300 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'flex items-center justify-between',
            'transition-colors duration-200',
            disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
            !disabled && 'bg-white hover:border-gray-400',
          )}>
          <div className="flex items-center">
            <TbClock className="w-4 h-4 mr-2 text-gray-400" />
            <span className={cn('text-sm', (!currentHours || !currentMinutes) && 'text-gray-400')}>
              {formatDisplayTime()}
            </span>
          </div>
          <TbChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'transform rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Hour Selector */}
                <div className="text-center">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Hora</label>
                  <div className="flex flex-col items-center space-y-1">
                    <button
                      type="button"
                      onClick={incrementHour}
                      className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <TbChevronUp className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 min-w-[60px]">
                      <span className="text-lg font-mono font-semibold text-blue-900">{currentHours}</span>
                    </div>

                    <button
                      type="button"
                      onClick={decrementHour}
                      className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <TbChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Minute Selector */}
                <div className="text-center">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Minutos</label>
                  <div className="flex flex-col items-center space-y-1">
                    <button
                      type="button"
                      onClick={incrementMinute}
                      className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <TbChevronUp className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 min-w-[60px]">
                      <span className="text-lg font-mono font-semibold text-green-900">{currentMinutes}</span>
                    </div>

                    <button
                      type="button"
                      onClick={decrementMinute}
                      className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <TbChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Time Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2">Horarios comunes</label>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00', '12:00', '14:00', '18:00'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        const [h, m] = time.split(':');
                        updateTime(h, m);
                        setIsOpen(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
