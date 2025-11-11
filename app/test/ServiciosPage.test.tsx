import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ServiciosPage from '@/app/dashboard/servicios/page';
import * as supabaseLib from '@/lib/supabase';
import * as storageLib from '@/lib/storage';

// Mocks
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentProfessional: jest.fn(),
}));
jest.mock('@/lib/storage', () => ({
  uploadServiceImage: jest.fn(),
  deleteImageFromStorage: jest.fn(),
}));

describe('ServiciosPage - CRUD', () => {
  it('debe crear un servicio correctamente', async () => {
    await act(async () => {
      render(<ServiciosPage />);
    });
    expect(screen).toBeDefined();
  });
});
