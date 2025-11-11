import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import DisponibilidadPage from '@/app/dashboard/disponibilidad/page';
import * as supabaseLib from '@/lib/supabase';

// Mock de Supabase
jest.mock('@/lib/supabase', () => ({
  getCurrentProfessional: jest.fn(),
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [] }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      }),
    }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

const mockSupabase = supabaseLib.supabase as any;

describe('DisponibilidadPage - CRUD', () => {
  beforeEach(() => {
    (supabaseLib.getCurrentProfessional as jest.Mock).mockResolvedValue({
      professional: { id: 'prof-1' },
    });
  });

  it('debe crear una disponibilidad correctamente', async () => {
    render(<DisponibilidadPage />);

    // Esperar a que se quite el loading
    await waitFor(() =>
      expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument()
    );

    // Abrir formulario
    const addButton =
      screen.queryByText(/agregar horario/i) ||
      screen.queryByText(/configurar primer horario/i);
    expect(addButton).toBeTruthy();
    await act(async () => {
      fireEvent.click(addButton!);
    });

    // Seleccionar "Lunes"
    const selectDia = screen.getByLabelText(/día de la semana/i);
    await act(async () => {
      fireEvent.change(selectDia, { target: { value: '1' } }); // valor "1" = Lunes
    });

    // Simular selección de hora (usando los botones visibles del componente)
    const btnInicio = screen.getByRole('button', { name: /09:00 AM/i });
    const btnFin = screen.getByRole('button', { name: /06:00 PM/i });

    await act(async () => {
      fireEvent.click(btnInicio);
      fireEvent.click(btnFin);
    });

    // Simular clic en guardar
    const guardarBtn =
      screen.queryByText(/crear disponibilidad/i) ||
      screen.queryByText(/guardar/i);
    expect(guardarBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(guardarBtn!);
    });

    // Validar llamadas a la API
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('availability');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });
});
