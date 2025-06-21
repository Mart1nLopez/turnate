'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors
      closeButton
      theme="light"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '0.5rem',
          border: '1px solid hsl(var(--border))',
          fontSize: '0.875rem',
        },
        className: 'font-medium',
      }}
    />
  );
}
