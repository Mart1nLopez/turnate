'use client';

import { useState, useRef, useEffect } from 'react';
import { TbClock, TbChevronUp, TbChevronDown } from 'react-icons/tb';
import { cn } from '@/lib/utils';

interface MinuteSelectorProps {
  value: string | number;
  onChange: (minutes: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  step?: number; // Intervalo de minutos (por defecto 15)
  max?: number; // Máximo de minutos (por defecto 120)
}

export function MinuteSelector({
  value,
  onChange,
  label,
  placeholder = 'Selecciona minutos',
  required = false,
  disabled = false,
  className,
  step = 15,
  max = 120,
}: MinuteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtener el valor actual como string
  const getCurrentMinutes = () => {
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    return numValue.toString();
  };

  const currentMinutes = getCurrentMinutes();

  // Generar un id único para este campo
  const id = `minute-selector-${Math.random().toString(36).substr(2, 9)}`;

  // Función para actualizar los minutos
  const updateMinutes = (newMinutes: string) => {
    onChange(newMinutes);
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

  const formatDisplayMinutes = () => {
    if (!currentMinutes) return placeholder;
    const minutes = parseInt(currentMinutes);
    if (minutes === 0) return 'Sin descanso';
    return `${minutes} minutos`;
  };

  const incrementMinutes = () => {
    const current = parseInt(currentMinutes);
    const nextValue = current + step;
    if (nextValue <= max) {
      updateMinutes(nextValue.toString());
    }
  };

  const decrementMinutes = () => {
    const current = parseInt(currentMinutes);
    const prevValue = current - step;
    if (prevValue >= 0) {
      updateMinutes(prevValue.toString());
    }
  };

  const isAtMax = parseInt(currentMinutes) >= max;
  const isAtMin = parseInt(currentMinutes) <= 0;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
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
          )}
          id={id}>
          <div className="flex items-center">
            <TbClock className="w-4 h-4 mr-2 text-gray-400" />
            <span className={cn('text-sm', !currentMinutes && 'text-gray-400')}>{formatDisplayMinutes()}</span>
          </div>
          <TbChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'transform rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
            <div className="p-4">
              {/* Minute Selector */}
              <div className="text-center">
                <label className="block text-xs font-medium text-gray-500 mb-2">Minutos (intervalos de {step})</label>
                <div className="flex flex-col items-center space-y-1">
                  <button
                    type="button"
                    onClick={incrementMinutes}
                    disabled={isAtMax}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isAtMax ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600',
                    )}>
                    <TbChevronUp className="w-4 h-4" />
                  </button>

                  <div className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 min-w-[80px]">
                    <span className="text-xl font-mono font-semibold text-orange-900">{currentMinutes}</span>
                    <div className="text-xs text-orange-600 mt-1">min</div>
                  </div>

                  <button
                    type="button"
                    onClick={decrementMinutes}
                    disabled={isAtMin}
                    className={cn(
                      'p-1 rounded transition-colors',
                      isAtMin ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600',
                    )}>
                    <TbChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Minute Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2">Opciones comunes</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 15, 30, 45, 60]
                    .filter((min) => min <= max)
                    .map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => {
                          updateMinutes(minutes.toString());
                          setIsOpen(false);
                        }}
                        className={cn(
                          'px-2 py-2 text-xs rounded transition-colors',
                          parseInt(currentMinutes) === minutes ?
                            'bg-orange-200 text-orange-900 font-medium'
                          : 'bg-gray-100 hover:bg-gray-200',
                        )}>
                        {minutes === 0 ? 'Sin' : `${minutes}m`}
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
