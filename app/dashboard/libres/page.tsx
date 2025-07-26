'use client';

import { useState } from 'react';
import { TbCalendarOff, TbPlus, TbEdit, TbTrash, TbCalendar, TbX, TbCheck } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getCurrentProfessional } from '@/lib/supabase';
import { useUnavailableDates } from '@/hooks/useUnavailableDates';
import { UnavailableDate } from '@/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { format, parseISO, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface UnavailableDateForm {
  start_date: string;
  end_date: string;
  reason: string;
}

interface DateRange {
  id: string; // ID del primer elemento del rango
  start_date: string;
  end_date: string;
  reason: string;
  dates: UnavailableDate[]; // Todas las fechas que pertenecen a este rango
  isRange: boolean; // true si es más de un día
}

export default function LibresPage() {
  const {
    unavailableDates,
    loading,
    error: loadError,
    createDates,
    updateDates,
    updateDate,
    deleteDates,
    // reload,
  } = useUnavailableDates();
  const [showForm, setShowForm] = useState(false);
  const [editingDate, setEditingDate] = useState<UnavailableDate | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState<UnavailableDateForm>({
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // unavailableDates y loading ahora vienen del hook

  const resetForm = () => {
    setFormData({
      start_date: '',
      end_date: '',
      reason: '',
    });
    setEditingDate(null);
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Si estamos editando un día individual y cambia start_date, también cambiar end_date
    if (name === 'start_date' && editingDate && (!editingRange || !editingRange.isRange)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        end_date: value, // Mantener ambas fechas iguales para días individuales
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) throw new Error('No professional found');

      // Validar fechas - usar parseISO en lugar de new Date() para evitar problemas de zona horaria
      const startDate = parseISO(formData.start_date + 'T00:00:00');
      const endDate = parseISO(formData.end_date + 'T00:00:00');
      const today = startOfDay(new Date());

      if (isBefore(startDate, today)) {
        toast.error('No puedes agregar días libres en el pasado');
        return;
      }

      if (isAfter(startDate, endDate)) {
        toast.error('La fecha de inicio debe ser anterior o igual a la fecha de fin');
        return;
      }

      if (editingDate) {
        // Verificar si estamos editando un rango o un día individual
        const originalRange = groupedDates.find((range) => range.dates.some((date) => date.id === editingDate.id));

        if (originalRange && originalRange.isRange) {
          // Verificar si las fechas han cambiado o solo el motivo
          const dateIds = originalRange.dates.map((d) => d.id);

          // Verificar si las fechas del rango han cambiado
          const originalStartDate = originalRange.start_date;
          const originalEndDate = originalRange.end_date;
          const newStartDate = format(startDate, 'yyyy-MM-dd');
          const newEndDate = format(endDate, 'yyyy-MM-dd');

          const datesChanged = originalStartDate !== newStartDate || originalEndDate !== newEndDate;

          if (!datesChanged) {
            // Si solo cambió el motivo (o no cambió nada), actualizar directamente
            if (originalRange.reason !== formData.reason) {
              // Solo actualizar el motivo de todas las fechas del rango
              await updateDates(dateIds, { reason: formData.reason });
            }
            // Si no cambió nada, no hacer nada
          } else {
            // Las fechas sí cambiaron, usar la estrategia robusta

            // Generar las nuevas fechas que se quieren crear
            const newDatesToCreate: string[] = [];
            let checkDate = startDate;

            while (checkDate <= endDate) {
              const dateStr = format(checkDate, 'yyyy-MM-dd');
              newDatesToCreate.push(dateStr);
              checkDate = addDays(checkDate, 1);
            }

            // Separar las fechas existentes del rango original de las que están fuera del rango
            const originalDates = originalRange.dates.map((d) => d.date);
            const datesToKeep: string[] = []; // Fechas del rango original que están en el nuevo rango
            const datesToCreate: string[] = []; // Fechas completamente nuevas
            const datesToRemove = originalRange.dates.filter((d) => !newDatesToCreate.includes(d.date)); // Fechas que ya no están en el nuevo rango

            // Clasificar las nuevas fechas
            newDatesToCreate.forEach((dateStr) => {
              if (originalDates.includes(dateStr)) {
                datesToKeep.push(dateStr);
              } else {
                datesToCreate.push(dateStr);
              }
            });

            // Verificar si alguna de las fechas completamente nuevas ya existe en otros rangos
            const conflictingDates = unavailableDates.filter(
              (ud) => datesToCreate.includes(ud.date) && !dateIds.includes(ud.id),
            );

            if (conflictingDates.length > 0) {
              const conflictDatesText = conflictingDates.map((d) => formatDateShort(d.date)).join(', ');
              toast.error(`Las siguientes fechas ya están ocupadas: ${conflictDatesText}`);
              return;
            }

            // PASO 1: Actualizar el motivo de las fechas que se mantienen del rango original
            if (datesToKeep.length > 0) {
              const idsToUpdate = originalRange.dates.filter((d) => datesToKeep.includes(d.date)).map((d) => d.id);

              await updateDates(idsToUpdate, { reason: formData.reason });
            }

            // PASO 2: Crear solo las fechas completamente nuevas
            let newData: UnavailableDate[] = [];
            if (datesToCreate.length > 0) {
              const datesToInsert = datesToCreate.map((dateStr) => ({
                professional_id: professional.id,
                date: dateStr,
                reason: formData.reason,
              }));

              const insertedData = await createDates(datesToInsert.map((d) => ({ date: d.date, reason: d.reason })));
              newData = insertedData;
            }

            // PASO 3: Eliminar las fechas que ya no están en el nuevo rango
            if (datesToRemove.length > 0) {
              const idsToRemove = datesToRemove.map((d) => d.id);
              try {
                await deleteDates(idsToRemove);
              } catch (deleteError) {
                console.error('Error deleting removed dates:', deleteError);
                // ROLLBACK: Si falló la eliminación, intentar eliminar las fechas recién creadas
                if (newData.length > 0) {
                  const newIds = newData.map((d) => d.id);
                  await deleteDates(newIds);
                }
                throw new Error('Error al actualizar el rango. Se ha revertido la operación.');
              }
            }
          }
        } else {
          // EDICIÓN DE DÍA INDIVIDUAL: Verificar si algo ha cambiado antes de actualizar
          const newDate = formData.start_date;
          const newReason = formData.reason;

          // Verificar si algo realmente cambió
          const dateChanged = editingDate.date !== newDate;
          const reasonChanged = editingDate.reason !== newReason;

          if (!dateChanged && !reasonChanged) {
            toast.info('No se han realizado cambios en la fecha o el motivo');
            return;
          } else {
            // Verificar si la nueva fecha ya existe (solo si la fecha cambió)
            if (dateChanged) {
              const existingConflict = unavailableDates.find((ud) => ud.date === newDate && ud.id !== editingDate.id);

              if (existingConflict) {
                toast.error(`La fecha ${formatDateShort(newDate)} ya está marcada como no disponible`);
                return;
              }
            }

            // Si hay cambios y no hay conflictos, proceder con la actualización
            await updateDate(editingDate.id, { date: newDate, reason: newReason });
          }
        }
      } else {
        // Crear nuevas fechas no disponibles (día individual o rango)
        const datesToInsert = [];

        // Usar una implementación más robusta para iterar fechas
        let currentDate = startDate;

        while (currentDate <= endDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');

          // Verificar si la fecha ya existe
          const existingDate = unavailableDates.find((ud) => ud.date === dateStr);

          if (!existingDate) {
            datesToInsert.push({
              professional_id: professional.id,
              date: dateStr,
              reason: formData.reason,
            });
          }

          // Avanzar al siguiente día usando addDays
          currentDate = addDays(currentDate, 1);
        }

        if (datesToInsert.length === 0) {
          toast.error('Todas las fechas seleccionadas ya están marcadas como no disponibles');
          return;
        }

        await createDates(datesToInsert.map((d) => ({ date: d.date, reason: d.reason })));
      }

      resetForm();
      toast.success(editingDate ? 'Día libre actualizado exitosamente' : 'Días libres agregados exitosamente');
    } catch (error) {
      console.error('Error saving unavailable date:', error);

      // Proporcionar mensajes de error más específicos
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error inesperado al guardar los días libres');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (target: UnavailableDate | DateRange) => {
    // Si es un DateRange, usar las fechas de inicio y fin del rango
    if ('isRange' in target) {
      setEditingDate(target.dates[0]); // Guardamos el primer elemento para referencia
      setFormData({
        start_date: target.start_date,
        end_date: target.end_date,
        reason: target.reason || '',
      });
    } else {
      // Si es un UnavailableDate individual
      setEditingDate(target);
      setFormData({
        start_date: target.date,
        end_date: target.date,
        reason: target.reason || '',
      });
    }
    setShowForm(true);
  };

  const handleDeleteRange = async (range: DateRange) => {
    const rangeText =
      range.isRange ?
        `del ${formatDateShort(range.start_date)} al ${formatDateShort(range.end_date)}`
      : `del ${formatDateShort(range.start_date)}`;

    const confirmed = await confirm({
      title: `¿Eliminar ${range.isRange ? 'período' : 'día'} libre?`,
      description: `Esta acción eliminará ${range.isRange ? 'todas las fechas' : 'este día'} ${rangeText} y volverán a estar disponibles para agendamiento.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const dateIds = range.dates.map((d) => d.id);

      await deleteDates(dateIds);
      toast.success(`${range.isRange ? 'Período' : 'Día'} libre eliminado exitosamente`);
    } catch (error) {
      console.error('Error deleting unavailable dates:', error);

      // Proporcionar mensaje de error específico
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error inesperado al eliminar los días libres');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const formatDateShort = (dateString: string) => {
    return format(parseISO(dateString), "d 'de' MMM", { locale: es });
  };

  const formatDateRange = (range: DateRange) => {
    if (range.isRange) {
      return `${formatDateShort(range.start_date)} al ${formatDateShort(range.end_date)}`;
    } else {
      return formatDate(range.start_date);
    }
  };

  const getMinDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Función para agrupar fechas consecutivas en rangos
  const groupConsecutiveDates = (dates: UnavailableDate[]): DateRange[] => {
    if (dates.length === 0) return [];

    const sortedDates = [...dates].sort((a, b) => a.date.localeCompare(b.date));
    const ranges: DateRange[] = [];
    let currentRange: UnavailableDate[] = [sortedDates[0]];

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1].date);
      const currentDate = parseISO(sortedDates[i].date);
      const nextDay = addDays(prevDate, 1);

      // Si la fecha actual es el día siguiente y tiene la misma razón, la agregamos al rango actual
      if (
        format(currentDate, 'yyyy-MM-dd') === format(nextDay, 'yyyy-MM-dd') &&
        sortedDates[i].reason === sortedDates[i - 1].reason
      ) {
        currentRange.push(sortedDates[i]);
      } else {
        // Si no es consecutiva o tiene diferente razón, cerramos el rango actual y empezamos uno nuevo
        ranges.push({
          id: currentRange[0].id,
          start_date: currentRange[0].date,
          end_date: currentRange[currentRange.length - 1].date,
          reason: currentRange[0].reason || '',
          dates: currentRange,
          isRange: currentRange.length > 1,
        });
        currentRange = [sortedDates[i]];
      }
    }

    // Agregar el último rango
    ranges.push({
      id: currentRange[0].id,
      start_date: currentRange[0].date,
      end_date: currentRange[currentRange.length - 1].date,
      reason: currentRange[0].reason || '',
      dates: currentRange,
      isRange: currentRange.length > 1,
    });

    return ranges;
  };

  const groupedDates = groupConsecutiveDates(unavailableDates);

  // Helper para detectar si estamos editando un rango
  const getEditingInfo = () => {
    if (!editingDate) return null;

    const editingRange = groupedDates.find((range) => range.dates.some((date) => date.id === editingDate.id));

    return editingRange;
  };

  const editingRange = getEditingInfo();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando días libres..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{loadError}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Días Libres</h1>
            <p className="text-gray-600">Gestiona los días en los que no estarás disponible</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <TbPlus className="w-4 h-4 mr-2" />
            <span>Agregar Días Libres</span>
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {editingDate ?
                    editingRange?.isRange ?
                      'Editar Período Libre'
                    : 'Editar Día Libre'
                  : 'Agregar Días Libres'}
                </CardTitle>
                <CardDescription>
                  {editingDate ?
                    editingRange?.isRange ?
                      `Modifica el rango del ${formatDateShort(editingRange.start_date)} al ${formatDateShort(editingRange.end_date)}`
                    : 'Modifica los detalles de este día libre'
                  : 'Configura un período donde no estarás disponible'}
                </CardDescription>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingDate && !editingRange?.isRange ? 'Fecha' : 'Fecha de inicio'} *
                  </label>
                  <Input
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                  />
                </div>
                {(!editingDate || editingRange?.isRange) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin *</label>
                    <Input
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      min={formData.start_date || getMinDate()}
                      required
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                <Textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Ej: Vacaciones, día personal, capacitación..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ?
                    'Guardando...'
                  : editingDate ?
                    editingRange?.isRange ?
                      'Actualizar Período'
                    : 'Actualizar'
                  : 'Agregar Días Libres'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Unavailable Dates List */}
      <div className="grid grid-cols-1 gap-4">
        {groupedDates.length === 0 ?
          <Card>
            <CardContent className="text-center py-12">
              <TbCalendarOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">No tienes días libres configurados</p>
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <TbPlus className="w-4 h-4 mr-2" />
                <span>Agregar primer día libre</span>
              </Button>
            </CardContent>
          </Card>
        : groupedDates.map((dateRange) => (
            <Card key={dateRange.id} className="relative">
              <CardContent className="p-6">
                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(dateRange)}
                    className="h-10 w-10 p-0"
                    title={dateRange.isRange ? 'Editar rango completo' : 'Editar día'}>
                    <TbEdit className="w-5 h-5" />
                    <div dangerouslySetInnerHTML={{ __html: '<!-- App web hecha por Lucas Álvarez -->' }} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRange(dateRange)}
                    className="h-10 w-10 p-0"
                    title={dateRange.isRange ? 'Eliminar todo el rango' : 'Eliminar día'}>
                    <TbTrash className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-20">
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <TbCalendar className="h-4 w-4 mr-1" />
                      {dateRange.isRange ? 'Período' : 'Fecha'}
                    </div>
                    <p className="font-medium text-gray-900 capitalize">{formatDateRange(dateRange)}</p>
                    {dateRange.isRange && <p className="text-sm text-gray-500 mt-1">({dateRange.dates.length} días)</p>}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Motivo</div>
                    <p className="font-medium text-gray-900">{dateRange.reason || 'Sin motivo especificado'}</p>
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
            <li>• Los días marcados como libres no aparecerán disponibles en el calendario de agendamiento</li>
            <li>• Puedes agregar días individuales o rangos de fechas completos</li>
            <li>• Las citas ya agendadas en estos días no se verán afectadas</li>
            <li>• Los clientes verán estos días como no disponibles sin mostrar el motivo</li>
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
