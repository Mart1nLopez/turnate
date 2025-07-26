'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CountryInfo, COUNTRIES, validatePhone, sanitizePhoneInput } from '@/lib/phone-validator';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  countryCode?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  allClassName?: string;
  prefixClassName?: string;
  showValidationMessages?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  countryCode = 'CL',
  label,
  required = false,
  error,
  className = '',
  inputClassName = '',
  allClassName = '',
  prefixClassName = '',
  showValidationMessages = true,
  disabled = false,
  ...props
}: PhoneInputProps) {
  const [localValue, setLocalValue] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Obtener la información del país
  const countryInfo: CountryInfo = COUNTRIES[countryCode] || COUNTRIES.CL;

  // Inicializar el valor local a partir del value proporcionado
  useEffect(() => {
    // Si se proporciona un número completo (con prefijo), extraemos solo la parte numérica
    if (value && value.includes('+')) {
      // Para Chile, extraer los últimos 8 dígitos
      if (countryCode === 'CL' && value.includes('+569')) {
        const match = value.match(/\d{8}$/);
        if (match) {
          setLocalValue(match[0]);
        } else {
          // Si no hay match, puede ser porque el número aún no está completo
          const digits = value.replace(/\D/g, '');
          // Eliminar el prefijo 569 si existe
          const withoutPrefix = digits.startsWith('569') ? digits.substring(3) : digits;
          setLocalValue(withoutPrefix.slice(0, 8));
        }
      } else {
        // Método genérico para otros países
        const digits = value.replace(/\D/g, '');
        setLocalValue(digits);
      }
    } else {
      setLocalValue(value);
    }
  }, [value, countryCode]);

  // Función para manejar el cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizePhoneInput(rawValue);

    setLocalValue(sanitizedValue);

    const validation = validatePhone(sanitizedValue, countryCode);
    setValidationError(showValidationMessages && !validation.isValid ? validation.message : undefined);

    // Formato completo para la base de datos: +569 12345678
    let formattedValue = '';
    if (countryCode === 'CL') {
      formattedValue = `+569 ${sanitizedValue}`;
    } else {
      formattedValue = `${countryInfo.dialCode} ${sanitizedValue}`;
    }

    onChange(formattedValue, validation.isValid);
  };

  // Manejo de foco
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);

    if (showValidationMessages && localValue) {
      const validation = validatePhone(localValue, countryCode);
      setValidationError(!validation.isValid ? validation.message : undefined);
    }
  };

  // Función para enfocar el input al hacer clic en el contenedor
  const handleContainerClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  };

  // Determinar el mensaje de error a mostrar
  const errorMessage = error || validationError;

  return (
    <div className={className}>
      {label && (
        <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'flex items-center rounded-md border bg-background overflow-hidden h-10',
          allClassName,
          isFocused ? 'ring-2 ring-ring ring-offset-2' : 'border-input',
          disabled && 'opacity-50 cursor-not-allowed',
          errorMessage ? 'border-red-300' : '',
          'focus-within:outline-none',
        )}
        onClick={handleContainerClick}>
        {/* Prefijo del país con bandera */}
        <div className={cn('flex items-center bg-gray-50 border-r px-3 h-full text-sm text-gray-600', prefixClassName)}>
          <span className="mr-1 text-base">{countryInfo.flag}</span>
          <span className="font-medium">{countryInfo.dialCode}</span>
          {countryCode === 'CL' && <span className="ml-1">9</span>}
        </div>

        {/* Input para el número de teléfono */}
        <Input
          ref={inputRef}
          id="phone-input"
          type="tel"
          placeholder="12345678"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn('border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full', inputClassName)}
          maxLength={8}
          aria-invalid={Boolean(errorMessage)}
          {...props}
        />
      </div>

      {/* Mensaje de error */}
      {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}

export default PhoneInput;
