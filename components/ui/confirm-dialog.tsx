'use client';

import { useState, useEffect } from 'react';
import { TbX, TbAlertTriangle, TbTrash, TbCalendarExclamation, TbInfoCircle } from 'react-icons/tb';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <TbTrash className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <TbCalendarExclamation className="w-6 h-6 text-orange-600" />;
      case 'info':
        return <TbInfoCircle className="w-6 h-6 text-blue-600" />;
      default:
        return <TbAlertTriangle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive' as const;
      case 'warning':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      tabIndex={-1}>
      <div
        className={cn(
          'relative w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-gray-200',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'dark:bg-gray-900 dark:border-gray-700',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description">
        {/* Close button */}
        {!loading && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-1.5 rounded-lg transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200',
              'dark:hover:bg-gray-800 dark:focus:ring-gray-700',
            )}
            aria-label="Cerrar diálogo">
            <TbX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon and Title */}
          <div className="flex items-start space-x-4 mb-4">
            <div className={cn('flex-shrink-0 p-3 rounded-full', getIconBgColor())}>{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h3
                id="dialog-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-8 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed ml-16">
            {description}
          </p>

          {/* Actions */}
          <div className="flex flex-row justify-center sm:justify-end sm:space-x-3 space-x-3 space-y-0 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none sm:w-auto">
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={getConfirmButtonVariant()}
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 sm:flex-none sm:w-auto">
              {loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para usar el diálogo de confirmación
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning' | 'info';
    onConfirm: () => void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const confirm = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const confirmAsync = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning' | 'info';
    onConfirm: () => Promise<void>;
  }): void => {
    setDialogState({
      ...options,
      isOpen: true,
      onConfirm: async () => {
        setDialogState((prev) => ({ ...prev, loading: true }));
        try {
          await options.onConfirm();
          setDialogState((prev) => ({ ...prev, isOpen: false, loading: false }));
        } catch (error) {
          setDialogState((prev) => ({ ...prev, loading: false }));
          throw error;
        }
      },
    });
  };

  const close = () => {
    if (!dialogState.loading) {
      setDialogState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={close}
      onConfirm={dialogState.onConfirm}
      title={dialogState.title}
      description={dialogState.description}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
      loading={dialogState.loading}
    />
  );

  return {
    confirm,
    confirmAsync,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
