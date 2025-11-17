import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ServiciosPage from '@/app/dashboard/servicios/page';
import * as supabaseLib from '@/lib/supabase';
import * as storageLib from '@/lib/storage';
import { toast } from 'sonner'; 
import { error } from 'console';

// --- Mocks ---

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  getCurrentProfessional: jest.fn(),
}));
jest.mock('@/lib/storage', () => ({
  uploadServiceImage: jest.fn(),
  deleteImageFromStorage: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: () => Promise.resolve(true), // Simula que el usuario siempre confirma
    ConfirmDialog: () => <div data-testid="confirm-dialog" />,
  }),
}));

jest.mock('@/components/ui/image-upload-with-crop', () => ({
  ImageUploadWithCrop: ({ onFilesChange, existingImages }: { onFilesChange: (files: File[], existingImages: string[]) => void; existingImages: string[] }) => (
    <div data-testid="image-upload-with-crop">
      {/* Simula un input de archivo para poder probar la subida */}
      <input
        type="file"
        data-testid="file-input"
        onChange={(e) => onFilesChange(e.target.files ? [e.target.files[0]] : [], existingImages)}
      />
      {/* Simula la eliminación de la imagen existente */}
      <button
        onClick={() => onFilesChange([], [])}
        data-testid="remove-image-btn"
      >
        Eliminar
      </button>
      {existingImages && existingImages.length > 0 && <span>{existingImages[0]}</span>}
    </div>
  ),
}));

// --- Datos de Prueba ---

const mockProfessional = { id: 'prof-1', name: 'Juan' };
const mockService = {
  id: 'service-1',
  name: 'Corte',
  description: 'Corte de cabello',
  price: 10000,
  duration_minutes: 30,
  image_url: 'http://ejemplo.com/imagen.png',
  professional_id: 'prof-1',
  created_at: new Date().toISOString(),
};

// Helper para crear mocks de Supabase
function createSupabaseFromMock({ list = [mockService], singleData = mockService } = {}) {
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
  // Mock por defecto para la carga inicial de datos
  (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock());
});

describe('ServiciosPage - CRUD', () => {
  
  it('puede crear un servicio (Create)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock({ list: [] }));

    // Mockea la llamada de INSERCIÓN que ocurrirá después
    const insertMock = createSupabaseFromMock({ singleData: mockService });
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(insertMock);

    render(<ServiciosPage />);
    
    // Espera que termine de cargar (y muestre la vista de "vacío")
    await waitFor(() => expect(screen.getByText(/no tienes servicios creados/i)).toBeInTheDocument());

    // 1. Abre el formulario (usamos regex para que coincida con "Crear primer servicio")
    const abrirFormBtn = screen.getByRole('button', { name: /crear (servicio|primer servicio)/i });
    fireEvent.click(abrirFormBtn);

    // 2. Llena los campos
    await fireEvent.change(screen.getByPlaceholderText(/ej: corte de cabello/i), { target: { value: 'Corte' } });
    await fireEvent.change(screen.getByPlaceholderText('15000'), { target: { value: '10000' } });
    await fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '30' } });

    // 3. Envía el formulario (ahora buscamos el botón de submit)
    const submitBtn = screen.getByRole('button', { name: 'Crear Servicio' });
    fireEvent.click(submitBtn);

    // 4. Verifica que se llamó a Supabase y se mostró el toast
    await waitFor(() => {
      expect(insertMock.insert).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Servicio creado exitosamente');
    });
  });

  it('muestra los servicios del backend al cargar (Read)', async () => {
    const mockService2 = { ...mockService, id: 'service-2', name: 'Peinado', price: 15000 };
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [mockService, mockService2] }));

    render(<ServiciosPage />);
    await waitFor(() => expect(screen.queryByText(/cargando servicios/i)).not.toBeInTheDocument());

    expect(screen.getByText('Corte')).toBeInTheDocument();
    expect(screen.getByText('Peinado')).toBeInTheDocument();
    
    expect(screen.getByText('$10.000')).toBeInTheDocument();
    expect(screen.getByText('$15.000')).toBeInTheDocument();
  });

  it('puede editar un servicio (Update)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock()); // Carga inicial
    const updateMock = createSupabaseFromMock(); // Mock para Update
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(updateMock);

    render(<ServiciosPage />);
    await waitFor(() => expect(screen.getByText('Corte')).toBeInTheDocument());

    // Click en botón "Editar"
    const editarBtn = screen.getByRole('button', { name: /editar/i });
    fireEvent.click(editarBtn);

    // Cambia el nombre
    const nombreInput = screen.getByPlaceholderText(/ej: corte de cabello/i);
    fireEvent.change(nombreInput, { target: { value: 'Corte y Barba' } });

    // Click en el botón de submit (Actualizar)
    const actualizarBtn = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(actualizarBtn);

    // Espera que se llame a update y se muestre el toast
    await waitFor(() => {
      expect(updateMock.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Corte y Barba' }));
      expect(toast.success).toHaveBeenCalledWith('Servicio actualizado exitosamente');
    });
  });

  it('puede eliminar un servicio (Delete)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(createSupabaseFromMock()); // Carga inicial
    const deleteMock = createSupabaseFromMock(); // Mock para Delete
    (supabaseLib.supabase.from as jest.Mock).mockReturnValueOnce(deleteMock);

    render(<ServiciosPage />);
    await waitFor(() => expect(screen.getByText('Corte')).toBeInTheDocument());

    // Busca el botón eliminar por aria-label
    const eliminarBtn = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(eliminarBtn);

    // Espera que se llame a delete, se borre la imagen y se muestre el toast
    await waitFor(() => {
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(storageLib.deleteImageFromStorage).toHaveBeenCalledWith(mockService.image_url);
      expect(toast.success).toHaveBeenCalledWith('Servicio eliminado exitosamente');
    });
  });
  
  it('muestra mensaje de vacío si no hay servicios (Validation)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [] }));

    render(<ServiciosPage />);
    await waitFor(() => expect(screen.queryByText(/cargando servicios/i)).not.toBeInTheDocument());

    expect(screen.getByText(/no tienes servicios creados/i)).toBeInTheDocument();
  });

  it('no permite crear servicio si faltan campos (Validation)', async () => {
    (supabaseLib.supabase.from as jest.Mock).mockReturnValue(createSupabaseFromMock({ list: [] }));

    render(<ServiciosPage />);
    await waitFor(() => expect(screen.queryByText(/cargando servicios/i)).not.toBeInTheDocument());

    // Abre el formulario
    const abrirFormBtn = screen.getByRole('button', { name: /crear (servicio|primer servicio)/i });
    fireEvent.click(abrirFormBtn);

    // Deja el campo nombre vacío, llena los demás
    fireEvent.change(screen.getByPlaceholderText('15000'), { target: { value: '10000' } });
    fireEvent.change(screen.getByPlaceholderText('30'), { target: { value: '30' } });

    // Limpia el mock de 'from' para asegurarnos de que no se llame
    (supabaseLib.supabase.from as jest.Mock).mockClear();

    // Click en submit
    const submitBtn = screen.getByRole('button', { name: /añadir servicios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(error);
    });
    
    // Verifica que NO se llamó a supabase
    expect(supabaseLib.supabase.from).not.toHaveBeenCalled();
  });
});