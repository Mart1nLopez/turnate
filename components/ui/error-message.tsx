import { IconAlertCircle, IconX } from '@tabler/icons-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning';
}

export default function ErrorMessage({ message, onDismiss, className = '', variant = 'error' }: ErrorMessageProps) {
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  const iconColor = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
  };

  return (
    <div className={`border px-4 py-3 rounded-lg ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start">
        <IconAlertCircle className={`w-5 h-5 ${iconColor[variant]} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className={`ml-3 ${iconColor[variant]} hover:opacity-70 transition-opacity`}>
            <IconX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
