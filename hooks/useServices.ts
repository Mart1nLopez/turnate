import { useCallback, useEffect, useState } from 'react';
import { getCurrentProfessional } from '@/lib/supabase';
import {
  getServicesByProfessionalId,
  createService as createServiceApi,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi,
  ServiceInput,
} from '@/services/serviceService';
import { Service } from '@/types';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) throw new Error('No professional found');
      setProfessionalId(professional.id);
      const data = await getServicesByProfessionalId(professional.id);
      setServices(data);
    } catch {
      setError('Error cargando servicios');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const createService = async (serviceData: Omit<ServiceInput, 'professional_id'>) => {
    if (!professionalId) throw new Error('No professional found');
    const data = await createServiceApi({ ...serviceData, professional_id: professionalId });
    setServices((prev) => [data, ...prev]);
    return data;
  };

  const updateService = async (serviceId: string, serviceData: Partial<Service>) => {
    await updateServiceApi(serviceId, serviceData);
    setServices((prev) =>
      prev.map((service) => (service.id === serviceId ? ({ ...service, ...serviceData } as Service) : service)),
    );
  };

  const deleteService = async (serviceId: string) => {
    await deleteServiceApi(serviceId);
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    reload: loadServices,
  };
}
