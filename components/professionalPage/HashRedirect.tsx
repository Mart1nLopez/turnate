'use client';

import { useEffect } from 'react';

export default function HashRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1); // Quita el '#'
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      if (access_token) {
        window.localStorage.setItem('access_token', access_token);
        window.location.replace('/auth/confirmado');
      }
    }
  }, []);

  return null;
}
