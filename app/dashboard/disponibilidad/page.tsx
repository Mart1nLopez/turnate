'use client';

import { useEffect, useState, useCallback } from 'react';
import { TbClock, TbEdit, TbTrash, TbPlus, TbCalendar, TbX, TbCheck } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { TimeSelector } from '@/components/ui/time-selector';
import { MinuteSelector } from '@/components/ui/minute-selector';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Availability } from '@/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface AvailabilityForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
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
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState<AvailabilityForm>({
    day_of_week: 1, // Lunes por defecto
    start_time: '09:00',
    end_time: '18:00',
    break_minutes: '0',
    advance_hours: '1',
    cancel_hours: '2',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAvailability = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('is_available', true) // Solo disponibilidades activas
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const resetForm = () => {
    setFormData({
      day_of_week: 1, // Lunes por defecto
      start_time: '09:00',
      end_time: '18:00',
      break_minutes: '0',
      advance_hours: '2',
      cancel_hours: '2',
    });
    setEditingAvailability(null);
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) throw new Error('No professional found');

      // Validar horarios
      if (formData.start_time >= formData.end_time) {
        toast.error('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }

      const selectedDayOfWeek = parseInt(formData.day_of_week.toString());

      // Verificar si ya existe disponibilidad para este día (solo si no estamos editando)
      if (!editingAvailability) {
        const existingAvailability = availability.find((av) => av.day_of_week === selectedDayOfWeek);

        if (existingAvailability) {
          toast.error(`Ya tienes configurada la disponibilidad para ${getDayName(selectedDayOfWeek)}`);
          return;
        }
      } else {
        // Si estamos editando, verificar que no haya duplicado con otro registro
        const existingAvailability = availability.find(
          (av) => av.day_of_week === selectedDayOfWeek && av.id !== editingAvailability.id,
        );

        if (existingAvailability) {
          toast.error(`Ya tienes configurada la disponibilidad para ${getDayName(selectedDayOfWeek)}`);
          return;
        }
      }

      const availabilityData = {
        day_of_week: selectedDayOfWeek,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_minutes: parseInt(formData.break_minutes),
        advance_hours: parseInt(formData.advance_hours),
        cancel_hours: parseInt(formData.cancel_hours),
        professional_id: professional.id,
        is_available: true, // Agregar campo is_available
      };

      if (editingAvailability) {
        // Actualizar disponibilidad existente
        const { error } = await supabase.from('availability').update(availabilityData).eq('id', editingAvailability.id);

        if (error) throw error;

        setAvailability((prev) =>
          prev.map((av) => (av.id === editingAvailability.id ? ({ ...av, ...availabilityData } as Availability) : av)),
        );
      } else {
        // Crear nueva disponibilidad
        const { data, error } = await supabase.from('availability').insert([availabilityData]).select().single();

        if (error) throw error;

        setAvailability((prev) => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week));
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
      start_time: av.start_time,
      end_time: av.end_time,
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
      const { error } = await supabase.from('availability').delete().eq('id', availabilityId);

      if (error) throw error;

      setAvailability((prev) => prev.filter((av) => av.id !== availabilityId));
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
    return DAYS_OF_WEEK.filter(
      (day) => !usedDays.includes(day.value) || (editingAvailability && day.value === editingAvailability.day_of_week),
    );
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Día de la semana *</label>
                  <select
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
                  <TimeSelector
                    label="Hora de inicio"
                    value={formData.start_time}
                    onChange={(time) => setFormData((prev) => ({ ...prev, start_time: time }))}
                    required
                  />
                </div>

                <div>
                  <TimeSelector
                    label="Hora de fin"
                    value={formData.end_time}
                    onChange={(time) => setFormData((prev) => ({ ...prev, end_time: time }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación mínima para agendar (horas) *
                  </label>
                  <Input
                    name="advance_hours"
                    type="number"
                    value={formData.advance_hours}
                    onChange={handleInputChange}
                    placeholder="2"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anticipación mínima para cancelar (horas) *
                  </label>
                  <Input
                    name="cancel_hours"
                    type="number"
                    value={formData.cancel_hours}
                    onChange={handleInputChange}
                    placeholder="2"
                    min="0"
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
                  <Button size="sm" variant="outline" onClick={() => handleEdit(av)} className="h-10 w-10 p-0">
                    <TbEdit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(av.id)} className="h-10 w-10 p-0">
                    <TbTrash className="w-4 h-4" />
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
                    <p className="font-medium text-gray-900">
                      {formatTime(av.start_time)} - {formatTime(av.end_time)}
                    </p>
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
            <li>• El descanso entre citas se suma automáticamente a la duración del servicio</li>
            <li>• La anticipación mínima evita que los clientes agenden muy cerca de la fecha</li>
            <li>• Puedes tener un día configurado por vez (edita para cambiar horarios)</li>
          </ul>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
