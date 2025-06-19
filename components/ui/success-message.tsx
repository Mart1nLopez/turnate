import { TbCheck, TbX } from 'react-icons/tb';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function SuccessMessage({ message, onDismiss, className = '' }: SuccessMessageProps) {
  return (
    <div className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg ${className}`}>
      <div className="flex items-start">
        <TbCheck className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-3 text-green-400 hover:opacity-70 transition-opacity">
            <TbX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
