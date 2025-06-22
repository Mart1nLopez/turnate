'use client';

import { useEffect } from 'react';

export default function HashRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.location.replace('/auth/confirmado');
    }
  }, []);

  return null;
}
