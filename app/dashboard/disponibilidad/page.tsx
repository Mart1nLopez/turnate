'use client';

import { useEffect, useState } from 'react';
import { TbClock, TbEdit, TbTrash, TbPlus, TbCalendar, TbX, TbCheck } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { TimeSelector } from '@/components/ui/time-selector';
import { MinuteSelector } from '@/components/ui/minute-selector';
import { getCurrentProfessional } from '@/lib/supabase';
import { useAvailability } from '@/hooks/useAvailability';
import { Availability, TimeBlock } from '@/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface AvailabilityForm {
  day_of_week: number;
  time_blocks: TimeBlock[];
  break_minutes: string;
  advance_hours: string;
  cancel_hours: string;
}

// Días de la semana según JavaScript (0 = domingo, 1 = lunes, etc.)
const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export default function DisponibilidadPage() {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const { availability, loading, loadAvailability, addAvailability, editAvailability, removeAvailability } =
    useAvailability(professionalId || '');
  const [showForm, setShowForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [formData, setFormData] = useState<AvailabilityForm>({
    day_of_week: 1, // Se actualizará dinámicamente
    time_blocks: [{ start_time: '09:00', end_time: '18:00' }],
    break_minutes: '0',
    advance_hours: '1',
    cancel_hours: '2',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { professional } = await getCurrentProfessional();
      if (professional) setProfessionalId(professional.id);
    })();
  }, []);

  useEffect(() => {
    if (professionalId) loadAvailability();
  }, [professionalId, loadAvailability]);

  // Efecto para actualizar el día por defecto cuando cambia la disponibilidad
  useEffect(() => {
    if (!showForm && !editingAvailability) {
      const availableDays = DAYS_OF_WEEK.filter((day) => !availability.map((av) => av.day_of_week).includes(day.value));

      if (availableDays.length > 0 && availableDays[0].value !== formData.day_of_week) {
        setFormData((prev) => ({
          ...prev,
          day_of_week: availableDays[0].value,
        }));
      }
    }
  }, [availability, showForm, editingAvailability, formData.day_of_week]);

  const resetForm = () => {
    const availableDays = DAYS_OF_WEEK.filter(
      (day) =>
        !availability.map((av) => av.day_of_week).includes(day.value) ||
        (editingAvailability && day.value === editingAvailability.day_of_week),
    );
    const defaultDay = availableDays.length > 0 ? availableDays[0].value : 1;

    setFormData({
      day_of_week: defaultDay,
      time_blocks: [{ start_time: '09:00', end_time: '18:00' }],
      break_minutes: '0',
      advance_hours: '2',
      cancel_hours: '2',
    });
    setEditingAvailability(null);
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'day_of_week' ? parseInt(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validar que todos los bloques de tiempo sean válidos
      for (const block of formData.time_blocks) {
        if (block.start_time >= block.end_time) {
          toast.error('La hora de inicio debe ser anterior a la hora de fin en todos los bloques');
          setSubmitting(false);
          return;
        }
      }
      // Validar que no haya superposiciones entre bloques
      const sortedBlocks = [...formData.time_blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
      for (let i = 0; i < sortedBlocks.length - 1; i++) {
        if (sortedBlocks[i].end_time > sortedBlocks[i + 1].start_time) {
          toast.error('Los bloques de horario no pueden superponerse');
          setSubmitting(false);
          return;
        }
      }
      const selectedDayOfWeek = formData.day_of_week;
      // Verificar si ya existe disponibilidad para este día (solo si no estamos editando)
      if (!editingAvailability) {
        const existingAvailability = availability.find((av) => av.day_of_week === selectedDayOfWeek);
        if (existingAvailability) {
          toast.error(`Ya tienes configurada la disponibilidad para ${getDayName(selectedDayOfWeek)}`);
          setSubmitting(false);
          return;
        }
      } else {
        // Si estamos editando, verificar que no haya duplicado con otro registro
        const existingAvailability = availability.find(
          (av) => av.day_of_week === selectedDayOfWeek && av.id !== editingAvailability.id,
        );
        if (existingAvailability) {
          toast.error(`Ya tienes configurada la disponibilidad para ${getDayName(selectedDayOfWeek)}`);
          setSubmitting(false);
          return;
        }
      }
      const availabilityData = {
        day_of_week: selectedDayOfWeek,
        time_blocks: formData.time_blocks,
        break_minutes: parseInt(formData.break_minutes),
        advance_hours: parseInt(formData.advance_hours),
        cancel_hours: parseInt(formData.cancel_hours),
        professional_id: professionalId!,
        is_available: true,
      };
      if (editingAvailability) {
        await editAvailability(editingAvailability.id, availabilityData);
      } else {
        await addAvailability(availabilityData);
      }
      resetForm();
      toast.success(
        editingAvailability ? 'Disponibilidad actualizada exitosamente' : 'Disponibilidad creada exitosamente',
      );
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Error al guardar la disponibilidad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (av: Availability) => {
    setEditingAvailability(av);
    setFormData({
      day_of_week: av.day_of_week,
      time_blocks: av.time_blocks || [{ start_time: av.start_time || '09:00', end_time: av.end_time || '18:00' }],
      break_minutes: av.break_minutes.toString(),
      advance_hours: av.advance_hours.toString(),
      cancel_hours: av.cancel_hours.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (availabilityId: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar configuración de disponibilidad?',
      description:
        'Esta acción eliminará permanentemente esta configuración de disponibilidad. Las citas existentes no se verán afectadas.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await removeAvailability(availabilityId);
      toast.success('Disponibilidad eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Error al eliminar la disponibilidad');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || 'Desconocido';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remover segundos si los hay
  };

  const getAvailableDays = () => {
    const usedDays = availability.map((av) => av.day_of_week);

    const availableDays = DAYS_OF_WEEK.filter(
      (day) => !usedDays.includes(day.value) || (editingAvailability && day.value === editingAvailability.day_of_week),
    );

    return availableDays;
  };

  const addTimeBlock = () => {
    const lastBlock = formData.time_blocks[formData.time_blocks.length - 1];
    const newStartTime = lastBlock ? lastBlock.end_time : '09:00';

    setFormData((prev) => ({
      ...prev,
      time_blocks: [...prev.time_blocks, { start_time: newStartTime, end_time: '18:00' }],
    }));
  };

  const removeTimeBlock = (index: number) => {
    if (formData.time_blocks.length <= 1) {
      toast.error('Debe haber al menos un bloque de horario');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      time_blocks: prev.time_blocks.filter((_, i) => i !== index),
    }));
  };

  const updateTimeBlock = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setFormData((prev) => ({
      ...prev,
      time_blocks: prev.time_blocks.map((block, i) => (i === index ? { ...block, [field]: value } : block)),
    }));
  };

  const formatTimeBlocks = (availability: Availability) => {
    if (availability.time_blocks && availability.time_blocks.length > 0) {
      return availability.time_blocks
        .map((block) => `${formatTime(block.start_time)} - ${formatTime(block.end_time)}`)
        .join('\n');
    }
    // Fallback para datos antiguos
    if (availability.start_time && availability.end_time) {
      return `${formatTime(availability.start_time)} - ${formatTime(availability.end_time)}`;
    }
    return 'No configurado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando disponibilidad..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
            <p className="text-gray-600">Configura tus horarios de atención</p>
          </div>
          {getAvailableDays().length > 0 && (
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <TbPlus className="w-4 h-4 mr-2" />
              <span>Agregar Horario</span>
            </Button>
          )}
        </div>
      </div>

      {/* Availability Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingAvailability ? 'Editar Disponibilidad' : 'Nueva Disponibilidad'}</CardTitle>
                <CardDescription>Configura tus horarios de atención para este día</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <TbX className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-2">
                    Día de la semana *
                  </label>
                  <select
                    id="day_of_week"
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                    {getAvailableDays().map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>{' '}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Horarios de atención *</label>
                  <div className="space-y-4">
                    {formData.time_blocks.map((block, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <TimeSelector
                            label="Hora de inicio"
                            value={block.start_time}
                            onChange={(time) => updateTimeBlock(index, 'start_time', time)}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <TimeSelector
                            label="Hora de fin"
                            value={block.end_time}
                            onChange={(time) => updateTimeBlock(index, 'end_time', time)}
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTimeBlock(index)}
                          disabled={formData.time_blocks.length <= 1}
                          className="mt-6">
                          <TbX className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <Button type="button" variant="default" onClick={addTimeBlock} className="w-auto">
                        <TbPlus className="w-4 h-4 mr-2" />
                        Agregar Bloque
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <MinuteSelector
                    label="Descanso entre citas (minutos)"
                    value={formData.break_minutes}
                    onChange={(minutes) => setFormData((prev) => ({ ...prev, break_minutes: minutes }))}
                    step={15}
                    max={60}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="advance_hours" className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación mínima para agendar (horas) *
                  </label>
                  <Input
                    id="advance_hours"
                    name="advance_hours"
                    type="number"
                    value={formData.advance_hours}
                    onChange={handleInputChange}
                    placeholder="2"
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cancel_hours" className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación mínima para cancelar (horas) *
                  </label>
                  <Input
                    id="cancel_hours"
                    name="cancel_hours"
                    type="number"
                    value={formData.cancel_hours}
                    onChange={handleInputChange}
                    placeholder="2"
                    min="0"
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ?
                    'Guardando...'
                  : editingAvailability ?
                    'Actualizar'
                  : 'Crear Disponibilidad'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Availability List */}
      <div className="grid grid-cols-1 gap-4">
        {availability.length === 0 ?
          <Card>
            <CardContent className="text-center py-12">
              <TbCalendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No tienes horarios configurados</p>
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <TbPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Configurar primer horario</span>
                <span className="sm:hidden">Crear Horario</span>
              </Button>
            </CardContent>
          </Card>
        : availability.map((av) => (
            <Card key={av.id} className="relative">
              <CardContent className="p-6">
                {/* Action buttons in top right corner */}
                <div className="absolute top-4 right-4 flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Editar disponibilidad"
                    data-testid="edit-button"
                    onClick={() => handleEdit(av)}
                    className="h-10 w-10 p-0">
                    <TbEdit className="w-5 h-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    aria-label="Eliminar disponibilidad"
                    data-testid="delete-button"
                    onClick={() => handleDelete(av.id)}
                    className="h-10 w-10 p-0">
                    <TbTrash className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pr-20">
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <TbCalendar className="h-4 w-4 mr-1" />
                      Día
                    </div>
                    <p className="font-medium text-gray-900">{getDayName(av.day_of_week)}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <TbClock className="h-4 w-4 mr-1" />
                      Horario
                    </div>
                    <div className="font-medium text-gray-900 whitespace-pre-line">{formatTimeBlocks(av)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Descanso</div>
                    <p className="font-medium text-gray-900">{av.break_minutes} min</p>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Anticipación agendar</div>
                    <p className="font-medium text-gray-900">{av.advance_hours}h</p>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Anticipación cancelar</div>
                    <p className="font-medium text-gray-900">{av.cancel_hours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbCheck className="w-5 h-5 mr-2 text-green-600" />
            Información importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Los horarios se aplican semanalmente de forma recurrente</li>
            <li>• Puedes configurar múltiples bloques de horario para el mismo día (ej: mañana y tarde)</li>
            <li>• El descanso entre citas se suma automáticamente a la duración del servicio</li>
            <li>• La anticipación mínima evita que los clientes agenden muy cerca de la fecha</li>
            <li>• Los bloques de horario no pueden superponerse</li>
          </ul>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
