'use client';

import { useState, useEffect } from 'react';
import { TbSearch, TbFilter, TbCalendar, TbClock, TbCurrencyDollar, TbRefresh } from 'react-icons/tb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Service } from '@/types';

export interface AdvancedFilters {
  search: string;
  status: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled_by_pro' | 'cancelled_by_client';
  dateRange: 'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'past' | 'custom';
  customDateFrom: string;
  customDateTo: string;
  timeOfDay: 'all' | 'morning' | 'afternoon' | 'evening';
  serviceId: string;
  minPrice: string;
  maxPrice: string;
  minDuration: string;
  maxDuration: string;
}

interface AdvancedFiltersComponentProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  services: Service[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdvancedFiltersComponent({
  filters,
  onFiltersChange,
  services,
  isCollapsed = false,
  onToggleCollapse,
}: AdvancedFiltersComponentProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AdvancedFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: AdvancedFilters = {
      search: '',
      status: 'all',
      dateRange: 'all',
      customDateFrom: '',
      customDateTo: '',
      timeOfDay: 'all',
      serviceId: '',
      minPrice: '',
      maxPrice: '',
      minDuration: '',
      maxDuration: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.status !== 'all') count++;
    if (localFilters.dateRange !== 'all') count++;
    if (localFilters.timeOfDay !== 'all') count++;
    if (localFilters.serviceId) count++;
    if (localFilters.minPrice || localFilters.maxPrice) count++;
    if (localFilters.minDuration || localFilters.maxDuration) count++;
    return count;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center">
            <TbFilter className="w-5 h-5 mr-2" />
            Filtros Avanzados
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </CardTitle>
          {onToggleCollapse && (
            <Button onClick={onToggleCollapse} variant="ghost" size="sm" className="text-gray-500">
              {isCollapsed ? 'Expandir' : 'Contraer'}
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
          {/* Primera fila - Búsqueda y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TbSearch className="inline w-4 h-4 mr-1" />
                Buscar
              </label>
              <div className="relative">
                <TbSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, servicio, email, teléfono..."
                  value={localFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled_by_pro">Canceladas por mí</option>
                <option value="cancelled_by_client">Canceladas por cliente</option>
              </select>
            </div>
          </div>

          {/* Segunda fila - Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TbCalendar className="inline w-4 h-4 mr-1" />
                Período
              </label>
              <select
                value={localFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="tomorrow">Mañana</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="past">Fechas pasadas</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </div>

            {localFilters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                  <Input
                    type="date"
                    value={localFilters.customDateFrom}
                    onChange={(e) => handleFilterChange('customDateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                  <Input
                    type="date"
                    value={localFilters.customDateTo}
                    onChange={(e) => handleFilterChange('customDateTo', e.target.value)}
                  />
                </div>
              </>
            )}

            {localFilters.dateRange !== 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TbClock className="inline w-4 h-4 mr-1" />
                  Horario
                </label>
                <select
                  value={localFilters.timeOfDay}
                  onChange={(e) => handleFilterChange('timeOfDay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Todo el día</option>
                  <option value="morning">Mañana (6:00-12:00)</option>
                  <option value="afternoon">Tarde (12:00-18:00)</option>
                  <option value="evening">Noche (18:00-24:00)</option>
                </select>
              </div>
            )}
          </div>

          {/* Tercera fila - Servicio */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
              <select
                value={localFilters.serviceId}
                onChange={(e) => handleFilterChange('serviceId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los servicios</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration_minutes}min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuarta fila - Filtros de precio y duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TbCurrencyDollar className="inline w-4 h-4 mr-1" />
                Rango de precio
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={localFilters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={localFilters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TbClock className="inline w-4 h-4 mr-1" />
                Duración (minutos)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={localFilters.minDuration}
                  onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={localFilters.maxDuration}
                  onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Botón para limpiar filtros */}
          <div className="flex justify-end">
            <Button onClick={clearAllFilters} variant="outline" disabled={getActiveFiltersCount() === 0}>
              <TbRefresh className="w-4 h-4 mr-2" />
              Limpiar filtros ({getActiveFiltersCount()})
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
