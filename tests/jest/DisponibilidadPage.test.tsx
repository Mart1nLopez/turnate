import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import DisponibilidadPage from '@/app/dashboard/disponibilidad/page';
import * as supabaseLib from '@/lib/supabase';
import { toast } from 'sonner'; // CORRECCIÓN: Importa 'toast' para verificar errores

// --- Mocks ---

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentProfessional: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: () => Promise.resolve(true),
    ConfirmDialog: () => <div data-testid="confirm-dialog" />,
  }),
}));
// Mocks de componentes de UI
jest.mock('@/components/ui/time-selector', () => ({
  TimeSelector: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
    <>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        data-testid="time-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  ),
}));
jest.mock('@/components/ui/minute-selector', () => ({
  MinuteSelector: ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => (
     <>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        data-testid="minute-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  ),
}));

// --- Datos de Prueba ---

const mockProfessional = { id: 'prof-1', name: 'Juan' };
const mockAvailability = {
  id: 'availability-1',
  professional_id: 'prof-1',
  day_of_week: 1, // Lunes
  time_blocks: [{ start_time: '09:00', end_time: '18:00' }],
  break_minutes: 15,
  advance_hours: 2,
  cancel_hours: 2,
  is_available: true,
  created_at: new Date().toISOString(),
};

// Helper para crear mocks de Supabase
function createSupabaseFromMock({ list = [mockAvailability], singleData = mockAvailability } = {}) {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: list, error: null }),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: singleData, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  return mockChain;
}

beforeEach(() => {
  jest.clearAllMocks();
  (supabaseLib.getCurrentProfessional as jest.Mock).mockResolvedValue({ professional: mockProfessional });
  (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock());
});

describe('DisponibilidadPage - CRUD', () => {

  it('puede crear una disponibilidad (Create)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock({ list: [] }));
    const insertMock = createSupabaseFromMock();
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(insertMock);

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument());

    // 1. Abre el formulario
    const crearBtn = screen.getByRole('button', { name: /agregar horario/i });
    fireEvent.click(crearBtn);

    // 2. Selecciona un día
    await waitFor(() => {
      // CORRECCIÓN: Busca por el label asociado al select
      const selectDia = screen.getByLabelText(/Día de la semana \*/i);
      fireEvent.change(selectDia, { target: { value: '1' } }); // Lunes
    });

    // 3. Envía el formulario
    const submitBtn = screen.getByRole('button', { name: /crear disponibilidad/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(insertMock.insert).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Disponibilidad creada exitosamente');
    });
  });

  it('muestra las disponibilidades del backend al cargar (Read)', async () => {
    const mockAvailability2 = { ...mockAvailability, id: 'availability-2', day_of_week: 2, time_blocks: [{ start_time: '10:00', end_time: '17:00' }] };
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [mockAvailability, mockAvailability2] }));

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument());

    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText(/09:00 - 18:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 - 17:00/)).toBeInTheDocument();
  });

  it('puede editar una disponibilidad (Update)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock()); // Carga inicial
    const updateMock = createSupabaseFromMock(); // Mock para Update
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(updateMock);

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.getByText('Lunes')).toBeInTheDocument());

    // Click en botón "Editar"
    const editarBtn = screen.getByLabelText(/editar disponibilidad/i);
    fireEvent.click(editarBtn);

    // Cambia las horas de aviso
    // CORRECCIÓN: El label tiene un '*' al final en el HTML
    const advanceHoursInput = screen.getByLabelText(/anticipación mínima para agendar \(horas\) \*/i);
    fireEvent.change(advanceHoursInput, { target: { value: '4' } });

    // Click en el botón de submit (Actualizar)
    const actualizarBtn = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(actualizarBtn);

    await waitFor(() => {
      expect(updateMock.update).toHaveBeenCalledWith(expect.objectContaining({ advance_hours: 4 }));
      expect(toast.success).toHaveBeenCalledWith('Disponibilidad actualizada exitosamente');
    });
  });

  it('puede eliminar una disponibilidad (Delete)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock()); // Carga inicial
    const deleteMock = createSupabaseFromMock(); // Mock para Delete
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(deleteMock);

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.getByText('Lunes')).toBeInTheDocument());

    // Busca el botón eliminar usando aria-label
    const eliminarBtn = screen.getByLabelText(/eliminar disponibilidad/i);
    fireEvent.click(eliminarBtn);

    await waitFor(() => {
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Disponibilidad eliminada exitosamente');
    });
  });

  it('muestra mensaje de vacío si no hay disponibilidades (Validation)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [] }));

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument());
    
    expect(screen.getByText(/no tienes horarios configurados/i)).toBeInTheDocument();
  });

  it('valida que no se pueda crear disponibilidad duplicada para el mismo día (Validation)', async () => {
    // Carga inicial con Lunes (day_of_week: 1) ya ocupado
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [mockAvailability] }));

    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument());

    // Abre el formulario
    const crearBtn = screen.getByRole('button', { name: /agregar horario/i });
    fireEvent.click(crearBtn);

    // CORRECCIÓN: Verifica que el día ocupado ("Lunes") no esté en el select.
    // El componente `getAvailableDays` filtra los días ya usados.
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Lunes' })).not.toBeInTheDocument();
      // Y que el día "Martes" (que está libre) sí esté
      expect(screen.getByRole('option', { name: 'Martes' })).toBeInTheDocument();
    });
  });

  it('valida bloques de tiempo (hora inicio < hora fin) (Validation)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [] }));
    render(<DisponibilidadPage />);
    await waitFor(() => expect(screen.queryByText(/cargando disponibilidad/i)).not.toBeInTheDocument());

    // Abre el formulario
    const crearBtn = screen.getByRole('button', { name: /agregar horario/i });
    fireEvent.click(crearBtn);

    // Selecciona un día (Martes)
    const selectDia = screen.getByLabelText(/Día de la semana \*/i);
    fireEvent.change(selectDia, { target: { value: '2' } });

    // CORRECCIÓN: Busca los selectores de tiempo por su label (gracias al mock mejorado)
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '18:00' } });
      fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '09:00' } });
    });

    // Limpia mocks para verificar que no se llama a insert
    (supabaseLib.supabase.from as jest.Mock).mockClear();

    // Click en submit
    const submitBtn = screen.getByRole('button', { name: /crear disponibilidad/i });
    fireEvent.click(submitBtn);

    // CORRECCIÓN: La validación ahora muestra un toast de error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('La hora de inicio debe ser anterior a la hora de fin en todos los bloques');
    });
    // Y no debe llamar a la BD
    expect(supabaseLib.supabase.from).not.toHaveBeenCalled();
  });
});