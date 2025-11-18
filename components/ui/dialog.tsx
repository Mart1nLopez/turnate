'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TbX } from 'react-icons/tb';
import { cn } from '@/lib/utils';

const DialogContext = createContext<{
  onOpenChange: (open: boolean) => void;
} | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogCloseProps {
  children?: React.ReactNode;
  asChild?: boolean;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!mounted) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
          tabIndex={-1}>
          {/* Content */}
          <div className="relative z-10 w-full max-w-md mx-auto">{children}</div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative w-full bg-white rounded-xl shadow-2xl border border-gray-200',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        'dark:bg-gray-900 dark:border-gray-700',
        className,
      )}
      role="dialog"
      aria-modal="true">
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="p-6 pt-8">{children}</div>;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100 pr-8 leading-tight', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-gray-600 dark:text-gray-300 leading-relaxed', className)}>{children}</p>;
}

export function DialogClose({ children, asChild }: DialogCloseProps) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('DialogClose must be used within a Dialog');
  }

  const handleClick = () => {
    context.onOpenChange(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as React.HTMLAttributes<HTMLElement>);
  }

  if (children) {
    return <button onClick={handleClick}>{children}</button>;
  }

  // Default close button
  return (
    <button
      onClick={handleClick}
      className={cn(
        'absolute top-4 right-4 p-1.5 rounded-lg transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200',
        'dark:hover:bg-gray-800 dark:focus:ring-gray-700',
      )}
      aria-label="Cerrar diálogo">
      <TbX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    </button>
  );
}
