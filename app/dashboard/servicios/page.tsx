'use client';

import { useEffect, useState, useCallback } from 'react';
import { IconPlus, IconEdit, IconTrash, IconCurrency, IconClock, IconPhoto, IconX } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Service } from '@/types';
import Image from 'next/image';

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  image_url: string;
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceForm>({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) return;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professional.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      image_url: '',
    });
    setEditingService(null);
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      const serviceData = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        image_url: formData.image_url || undefined,
        professional_id: professional.id,
      };

      if (editingService) {
        // Actualizar servicio existente
        const { error } = await supabase.from('services').update(serviceData).eq('id', editingService.id);

        if (error) throw error;

        setServices((prev) =>
          prev.map((service) =>
            service.id === editingService.id ? ({ ...service, ...serviceData } as Service) : service,
          ),
        );
      } else {
        // Crear nuevo servicio
        const { data, error } = await supabase.from('services').insert([serviceData]).select().single();

        if (error) throw error;

        setServices((prev) => [data, ...prev]);
      }

      resetForm();
      alert(editingService ? 'Servicio actualizado exitosamente' : 'Servicio creado exitosamente');
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error al guardar el servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      image_url: service.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) throw error;

      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      alert('Servicio eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error al eliminar el servicio');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando servicios..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600">Gestiona los servicios que ofreces</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <IconPlus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</CardTitle>
                <CardDescription>
                  {editingService ? 'Modifica los datos del servicio' : 'Completa la información del nuevo servicio'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <IconX className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del servicio *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Corte de cabello"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
                  <div className="relative">
                    <IconCurrency className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="15000"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos) *</label>
                  <div className="relative">
                    <IconClock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      placeholder="30"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL de imagen</label>
                  <div className="relative">
                    <IconPhoto className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe tu servicio..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ?
                    'Guardando...'
                  : editingService ?
                    'Actualizar'
                  : 'Crear Servicio'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ?
          <div className="col-span-full text-center py-12">
            <IconCurrency className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No tienes servicios creados</p>
            <Button onClick={() => setShowForm(true)}>
              <IconPlus className="w-4 h-4 mr-2" />
              Crear primer servicio
            </Button>
          </div>
        : services.map((service) => (
            <Card key={service.id} className="relative">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {service.image_url ?
                    <Image
                      src={service.image_url}
                      alt={service.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  : <div className="flex items-center justify-center h-full">
                      <IconPhoto className="h-12 w-12 text-gray-300" />
                    </div>
                  }
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>

                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-green-600">
                      <IconCurrency className="h-4 w-4 mr-1" />
                      <span className="font-bold">{formatCurrency(service.price)}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <IconClock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{service.duration_minutes} min</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(service)} className="flex-1">
                      <IconEdit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
