import { useEffect, useState } from 'react';
import {
  getProfessionalBySlug,
  getServicesByProfessionalId,
  getAvailabilityByProfessionalId,
  getUnavailableDatesByProfessionalId,
} from '@/services/appointmentService';
import { Professional, Service, Availability, UnavailableDate } from '@/types';

interface UseProfessionalBookingResult {
  professional: Professional | null;
  services: Service[];
  availability: Availability[];
  unavailableDates: UnavailableDate[];
  selectedService: Service | null;
  setSelectedService: (service: Service | null) => void;
  loading: boolean;
  error: string | null;
}

export function useProfessionalBooking(
  slug: string,
  preSelectedServiceId?: string | null,
): UseProfessionalBookingResult {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const professionalData = await getProfessionalBySlug(slug);
        setProfessional(professionalData);

        const servicesData = await getServicesByProfessionalId(professionalData.id);
        setServices(servicesData);

        const availabilityData = await getAvailabilityByProfessionalId(professionalData.id);
        setAvailability(availabilityData);

        const unavailableDatesData = await getUnavailableDatesByProfessionalId(professionalData.id);
        setUnavailableDates(unavailableDatesData);

        // Preselección de servicio
        if (preSelectedServiceId && servicesData) {
          const preSelected = servicesData.find((s) => s.id === preSelectedServiceId);
          if (preSelected) setSelectedService(preSelected);
        }
      } catch {
        setError('Error cargando datos del profesional');
        setProfessional(null);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadData();
  }, [slug, preSelectedServiceId]);

  return {
    professional,
    services,
    availability,
    unavailableDates,
    selectedService,
    setSelectedService,
    loading,
    error,
  };
}
