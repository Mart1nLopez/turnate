'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { TbArrowLeft } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { Professional, Service, Availability, Client, UnavailableDate } from '@/types';
import { generateTimeSlots, TimeSlot } from '@/lib/slots';
import { format } from 'date-fns';
import Link from 'next/link';
import ServiceSelector from '@/components/appointment/ServiceSelector';
import DateCalendar from '@/components/appointment/DateCalendar';
import TimeSlotSelector from '@/components/appointment/TimeSlotSelector';
import AppointmentSummary from '@/components/appointment/AppointmentSummary';
import ClientForm from '@/components/appointment/ClientForm';
import { toast } from 'sonner';

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  date: string;
  time: string;
}

export default function AgendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    phone: '',
    serviceId: '',
    date: '',
    time: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: selection, 2: client details

  const slug = params.slug as string;
  const preSelectedServiceId = searchParams.get('service');

  // Scroll suave para móvil
  const scrollToSection = (element: HTMLElement) => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  };

  const loadData = useCallback(async () => {
    try {
      // Cargar profesional
      const { data: professionalData, error: professionalError } = await supabase
        .from('professionals')
        .select('*')
        .eq('slug', slug)
        .single();

      if (professionalError || !professionalData) {
        console.error('Professional not found');
        return;
      }

      setProfessional(professionalData);

      // Cargar servicios
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professionalData.id)
        .order('created_at', { ascending: true });

      setServices(servicesData || []);

      // Cargar disponibilidad
      const { data: availabilityData } = await supabase
        .from('availability')
        .select('*')
        .eq('professional_id', professionalData.id);

      setAvailability(availabilityData || []);

      // Cargar fechas no disponibles
      const { data: unavailableDatesData } = await supabase
        .from('unavailable_dates')
        .select('*')
        .eq('professional_id', professionalData.id);

      setUnavailableDates(unavailableDatesData || []);

      // Pre-seleccionar servicio si viene en la URL
      if (preSelectedServiceId && servicesData) {
        const preSelectedService = servicesData.find((s) => s.id === preSelectedServiceId);
        if (preSelectedService) {
          setSelectedService(preSelectedService);
          setFormData((prev) => ({ ...prev, serviceId: preSelectedService.id }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [slug, preSelectedServiceId, router]);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug, loadData]);

  const generateTimeSlotsForDay = useCallback(
    async (date: Date, service: Service) => {
      if (!professional || !availability.length) {
        setTimeSlots([]);
        return;
      }

      const dayOfWeek = date.getDay();
      const dayAvailability = availability.find((av) => av.day_of_week === dayOfWeek);

      if (!dayAvailability) {
        setTimeSlots([]);
        return;
      }

      try {
        const dateString = date.toISOString().split('T')[0];

        // Obtener citas existentes para este día
        const { data: existingAppointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('professional_id', professional.id)
          .gte('start_time', `${dateString}T00:00:00`)
          .lt('start_time', `${dateString}T23:59:59`)
          .eq('status', 'confirmed');

        // Generar slots usando la función de slots con fechas no disponibles
        const slots = generateTimeSlots(
          date,
          dayAvailability,
          existingAppointments || [],
          service.duration_minutes,
          unavailableDates,
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error('Error generating time slots:', error);
        setTimeSlots([]);
      }
    },
    [professional, availability, unavailableDates],
  );

  useEffect(() => {
    if (selectedDate && selectedService) {
      generateTimeSlotsForDay(selectedDate, selectedService);
    }
  }, [selectedDate, selectedService, generateTimeSlotsForDay]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData((prev) => ({ ...prev, serviceId: service.id }));
    setSelectedTime('');

    // Scroll en móvil al calendario
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const calendarElement = document.getElementById('calendar-section');
        if (calendarElement) scrollToSection(calendarElement);
      }, 100);
    }
  };

  const handleDateSelect = (date: Date) => {
    // Crear una nueva fecha sin problemas de timezone
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(localDate);
    setSelectedTime('');

    // Formatear fecha de manera más segura
    const dateString = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    setFormData((prev) => ({ ...prev, date: dateString, time: '' }));

    // Scroll en móvil a las horas
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const timeSlotsElement = document.getElementById('time-slots-section');
        if (timeSlotsElement) scrollToSection(timeSlotsElement);
      }, 100);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData((prev) => ({ ...prev, time }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkExistingClient = async (email: string) => {
    const { data } = await supabase.from('clients').select('*').eq('email', email).single();
    return data;
  };

  const createOrUpdateClient = async (): Promise<Client> => {
    const existingClient = await checkExistingClient(formData.email);

    if (existingClient) {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingClient.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('El nombre es requerido');
    if (!formData.email.trim()) {
      errors.push('El email es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('El email no tiene un formato válido');
      }
    }
    if (!formData.phone.trim()) {
      errors.push('El teléfono es requerido');
    } else {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.push('El teléfono debe tener al menos 10 dígitos');
      }
    }
    if (!selectedService) errors.push('Debe seleccionar un servicio');
    if (!formData.date) errors.push('Debe seleccionar una fecha');
    if (!formData.time) errors.push('Debe seleccionar una hora');

    if (formData.date && formData.time) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      if (selectedDateTime <= now) {
        errors.push('La fecha y hora seleccionadas deben ser futuras');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async () => {
    if (!professional || !selectedService) return;

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Preparar los datos para enviar
      const dataToSend = {
        clientName: formData.name,
        clientEmail: formData.email,
        clientPhone: formData.phone,
        service: selectedService.name,
        date: formData.date,
        time: formData.time,
        professionalName: professional.name,
        professionalEmail: professional.email,
      };

      console.log('Datos que se envían al Google Apps Script:', dataToSend);

      // Enviar los datos al Google Apps Script
      const res = await fetch(
        'https://script.google.com/macros/s/AKfycbzx8kzMhX3_R3JLlmsXQwcRxfmNa54_Us3017RGmPK00Odg404mMX9sIZk3xPrsQ5oqrw/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        },
      );

      const result = await res.text();
      toast.success('Cita confirmada. Te hemos enviado un correo de confirmación.');
      console.log('Respuesta del script:', result);
    } catch (error) {
      console.error('Error al enviar los datos al script:', error);
      setError('Error al enviar los datos. Por favor intenta nuevamente.');
      setSubmitting(false);
      toast.error('Error al enviar los datos. Por favor intenta nuevamente.');
      return;
    }

    try {
      const client = await createOrUpdateClient();
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000);

      const { error } = await supabase
        .from('appointments')
        .insert({
          professional_id: professional.id,
          service_id: selectedService.id,
          client_id: client.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
        })
        .select()
        .single();

      if (error) throw error;

      // Reset y mostrar éxito
      setStep(1);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime('');
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceId: '',
        date: '',
        time: '',
      });

      toast.success('¡Cita agendada exitosamente!');
      router.push(`/${slug}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      let errorMessage = 'Error al crear la cita. Por favor intenta nuevamente.';

      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'Ya tienes una cita agendada en esta fecha y hora.';
        } else if (error.message.includes('conflict')) {
          errorMessage = 'Este horario ya no está disponible. Por favor selecciona otro horario.';
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Funciones del calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calcular el primer lunes visible
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0=lunes, 6=domingo
    const firstVisible = new Date(firstDayOfMonth);
    firstVisible.setDate(firstDayOfMonth.getDate() - firstDayOfWeek);

    // Calcular el último domingo visible
    const lastDayOfWeek = lastDayOfMonth.getDay() === 0 ? 6 : lastDayOfMonth.getDay() - 1;
    const lastVisible = new Date(lastDayOfMonth);
    lastVisible.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfWeek));

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(firstVisible); d <= lastVisible; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);
      const isCurrentMonth = current.getMonth() === month;
      const dayOfWeek = current.getDay();
      const hasAvailability = availability ? availability.some((av) => av.day_of_week === dayOfWeek) : false;
      const isPast = current < today;
      const isToday = current.getTime() === today.getTime();

      // Verificar si este día está marcado como no disponible
      const dateString = format(current, 'yyyy-MM-dd');
      const isUnavailable = unavailableDates.some((ud) => ud.date === dateString);

      days.push({
        date: current,
        isCurrentMonth,
        isToday,
        isAvailable: isCurrentMonth && hasAvailability && !isPast && !isUnavailable,
      });
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Cambia canContinue a booleano explícito
  const canContinue = Boolean(selectedService && selectedDate && selectedTime);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="lg" text="Cargando información..." />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profesional no encontrado</h1>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/${slug}`}>
                <Button variant="outline" size="sm">
                  <TbArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agendar Cita</h1>
                <p className="text-sm text-gray-600">con {professional.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {step === 1 && (
        <div className="container mx-auto px-4 py-6">
          {/* Desktop Layout - Solo pantallas grandes */}
          <div className="hidden xl:grid xl:grid-cols-[0.5fr_1fr_0.5fr] xl:gap-6">
            {/* Servicios */}
            <ServiceSelector services={services} selectedService={selectedService} onSelect={handleServiceSelect} />
            {/* Calendario */}
            <DateCalendar
              currentMonth={currentMonth}
              getDaysInMonth={getDaysInMonth}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              navigateMonth={navigateMonth}
              formatMonthYear={formatMonthYear}
              selectedService={selectedService}
            />
            {/* Horarios */}
            <TimeSlotSelector
              selectedDate={selectedDate}
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
              onContinue={() => setStep(2)}
              canContinue={canContinue}
            />
          </div>

          {/* Mobile & Tablet Layout */}
          <div className="xl:hidden space-y-6">
            <ServiceSelector services={services} selectedService={selectedService} onSelect={handleServiceSelect} />
            {selectedService && (
              <DateCalendar
                currentMonth={currentMonth}
                getDaysInMonth={getDaysInMonth}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                navigateMonth={navigateMonth}
                formatMonthYear={formatMonthYear}
                selectedService={selectedService}
              />
            )}
            {selectedDate && (
              <TimeSlotSelector
                selectedDate={selectedDate}
                timeSlots={timeSlots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                onContinue={() => setStep(2)}
                canContinue={canContinue}
              />
            )}
          </div>
        </div>
      )}

      {/* Step 2: Detalles del Cliente */}
      {step === 2 && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Resumen de la cita */}
            <AppointmentSummary
              selectedService={selectedService}
              professional={professional}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
            {/* Información del cliente */}
            <ClientForm
              formData={formData}
              onChange={handleInputChange}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  );
}
