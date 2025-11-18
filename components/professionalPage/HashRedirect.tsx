'use client';

import { useEffect } from 'react';

export default function HashRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1); // Quita el '#'
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const type = params.get('type');
      if (access_token && type === 'signup') {
        window.localStorage.setItem('access_token', access_token);
        window.location.replace('/auth/confirmado');
      }
    }
  }, []);

  return null;
}
