'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { TbClock, TbUser, TbMail, TbPhone, TbArrowLeft, TbCheck } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { Professional, Service, Availability, Client, Appointment } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { generateTimeSlots, TimeSlot } from '@/lib/slots';
import Link from 'next/link';

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
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
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
  const [step, setStep] = useState(1); // 1: service, 2: date/time, 3: details, 4: confirmation

  const slug = params.slug as string;
  const preSelectedServiceId = searchParams.get('service');

  const loadData = useCallback(async () => {
    try {
      // Cargar profesional
      const { data: professionalData, error: professionalError } = await supabase
        .from('professionals')
        .select('*')
        .eq('slug', slug)
        .single();

      if (professionalError || !professionalData) {
        router.push('/');
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
        .eq('professional_id', professionalData.id)
        .eq('is_available', true); // Solo disponibilidades activas

      setAvailability(availabilityData || []);

      // Pre-seleccionar servicio si viene en la URL
      if (preSelectedServiceId && servicesData) {
        const preSelected = servicesData.find((s) => s.id === preSelectedServiceId);
        if (preSelected) {
          setSelectedService(preSelected);
          setFormData((prev) => ({ ...prev, serviceId: preSelected.id }));
          setStep(2);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    async (date: string, service: Service) => {
      if (!professional || !availability.length) {
        setTimeSlots([]);
        return;
      }

      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = lunes, etc.

      // Buscar disponibilidad para este día específico
      const dayAvailability = availability.find((av) => av.day_of_week === dayOfWeek);
      if (!dayAvailability) {
        setTimeSlots([]);
        return;
      }

      try {
        // Obtener citas existentes para ese día
        const { data: existingAppointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('professional_id', professional.id)
          .eq('status', 'confirmed')
          .gte('start_time', `${date}T00:00:00`)
          .lte('start_time', `${date}T23:59:59`);

        // Usar la función centralizada para generar slots
        const slots = generateTimeSlots(
          selectedDate,
          dayAvailability,
          (existingAppointments || []) as Appointment[],
          service.duration_minutes,
        );

        setTimeSlots(slots);
      } catch (error) {
        console.error('Error generando slots:', error);
        setTimeSlots([]);
      }
    },
    [professional, availability],
  );

  useEffect(() => {
    if (selectedDate && selectedService) {
      generateTimeSlotsForDay(selectedDate, selectedService);
    }
  }, [selectedDate, selectedService, generateTimeSlotsForDay]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData((prev) => ({ ...prev, serviceId: service.id }));
    setStep(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setFormData((prev) => ({ ...prev, date, time: '' }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData((prev) => ({ ...prev, time }));
    setStep(3);
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
      // Actualizar cliente existente
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
      // Crear nuevo cliente
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

  // Función de validación del formulario
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar datos básicos
    if (!formData.name.trim()) {
      errors.push('El nombre es requerido');
    }

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

    // Validar selecciones
    if (!selectedService) {
      errors.push('Debe seleccionar un servicio');
    }

    if (!formData.date) {
      errors.push('Debe seleccionar una fecha');
    }

    if (!formData.time) {
      errors.push('Debe seleccionar una hora');
    }

    // Validar que la fecha y hora sean futuras
    if (formData.date && formData.time) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      if (selectedDateTime <= now) {
        errors.push('La fecha y hora seleccionadas deben ser futuras');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async () => {
    if (!professional || !selectedService) return;

    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Crear o actualizar cliente
      const client = await createOrUpdateClient();

      // Crear la cita
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000);

      const { data: appointmentData, error } = await supabase
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

      // Enviar email de confirmación
      try {
        // Send mail
        console.log(appointmentData.id);
      } catch (emailError) {
        console.error('Error enviando email de confirmación:', emailError);
        // No falla la cita si el email falla, solo log del error
      }

      setStep(4);
    } catch (error) {
      console.error('Error creating appointment:', error);

      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al crear la cita. Por favor intenta nuevamente.';

      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'Ya tienes una cita agendada en esta fecha y hora.';
        } else if (error.message.includes('conflict')) {
          errorMessage = 'Este horario ya no está disponible. Por favor selecciona otro horario.';
        } else if (error.message.includes('advance')) {
          errorMessage = 'No es posible agendar con tan poca anticipación.';
        }
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();

    // Generar próximos 30 días
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, etc.
      const hasAvailability = availability.some((av) => av.day_of_week === dayOfWeek);

      if (hasAvailability) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando información..." />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
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
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNumber <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {stepNumber < step ?
                      <TbCheck className="w-4 h-4" />
                    : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`h-1 w-16 mx-2 ${stepNumber < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Servicio</span>
              <span>Fecha y Hora</span>
              <span>Datos</span>
              <span>Confirmación</span>
            </div>
          </div>

          {/* Step 1: Service Selection */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona un Servicio</CardTitle>
                <CardDescription>Elige el servicio que necesitas</CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ?
                  <p className="text-gray-500 text-center py-8">No hay servicios disponibles</p>
                : <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                            {service.description && <p className="text-gray-600 text-sm mb-2">{service.description}</p>}
                            <div className="flex items-center text-sm text-gray-500">
                              <TbClock className="h-4 w-4 mr-1" />
                              {service.duration_minutes} minutos
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-green-600 font-bold">
                              {formatCurrency(service.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          )}

          {/* Step 2: Date and Time Selection */}
          {step === 2 && selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona Fecha y Hora</CardTitle>
                <CardDescription>
                  {selectedService.name} - {formatCurrency(selectedService.price)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Fecha</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getAvailableDates()
                      .slice(0, 14)
                      .map((date) => (
                        <button
                          key={date}
                          onClick={() => handleDateSelect(date)}
                          className={`p-3 text-left border rounded-lg transition-all ${
                            selectedDate === date ?
                              'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <div className="font-medium capitalize">{formatDate(date)}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Hora</label>
                    {timeSlots.length === 0 ?
                      <p className="text-gray-500 text-center py-4">No hay horarios disponibles para esta fecha</p>
                    : <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && handleTimeSelect(slot.time)}
                            disabled={!slot.available}
                            className={`p-2 text-sm border rounded-lg transition-all ${
                              selectedTime === slot.time ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : slot.available ? 'border-gray-200 hover:border-gray-300'
                              : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}>
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Client Details */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Tus Datos</CardTitle>
                <CardDescription>Completa tu información para confirmar la cita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <div className="relative">
                      <TbUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tu nombre completo"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <div className="relative">
                      <TbMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <div className="relative">
                      <TbPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+56 9 1234 5678"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Resumen de tu cita</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Servicio:</strong> {selectedService?.name}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {selectedDate && formatDate(selectedDate)}
                      </p>
                      <p>
                        <strong>Hora:</strong> {selectedTime}
                      </p>
                      <p>
                        <strong>Duración:</strong> {selectedService?.duration_minutes} minutos
                      </p>
                      <p>
                        <strong>Precio:</strong> {selectedService && formatCurrency(selectedService.price)}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.email || !formData.phone || submitting}
                    className="w-full">
                    {submitting ? 'Agendando...' : 'Confirmar Cita'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TbCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita Agendada!</h2>
                <p className="text-gray-600 mb-6">Tu cita ha sido confirmada. Recibirás un email con los detalles.</p>

                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-3">Detalles de tu cita</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <strong>Profesional:</strong> {professional.name}
                    </p>
                    <p>
                      <strong>Servicio:</strong> {selectedService?.name}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {selectedDate && formatDate(selectedDate)}
                    </p>
                    <p>
                      <strong>Hora:</strong> {selectedTime}
                    </p>
                    <p>
                      <strong>Duración:</strong> {selectedService?.duration_minutes} minutos
                    </p>
                    <p>
                      <strong>Precio:</strong> {selectedService && formatCurrency(selectedService.price)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/${slug}`}>
                    <Button variant="outline" className="w-full">
                      Volver al perfil
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      // Reset form for new appointment
                      setStep(1);
                      setSelectedService(null);
                      setSelectedDate('');
                      setSelectedTime('');
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        serviceId: '',
                        date: '',
                        time: '',
                      });
                    }}
                    className="w-full">
                    Agendar Otra Cita
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
