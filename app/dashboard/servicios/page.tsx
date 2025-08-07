'use client';

import { useState } from 'react';
import { TbPlus, TbEdit, TbTrash, TbCurrencyDollar, TbClock, TbPhoto, TbX } from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { getCurrentProfessional } from '@/lib/supabase';
import { useServices } from '@/hooks/useServices';
import { uploadServiceImage, deleteImageFromStorage } from '@/lib/storage';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImageUploadWithCrop } from '@/components/ui/image-upload-with-crop';
import { toast } from 'sonner';

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  image_url: string;
}

export default function ServiciosPage() {
  const { services, loading, error: loadError, createService, updateService, deleteService } = useServices();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState<ServiceForm>({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

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
    setNewImageFile(null);
    setRemoveExistingImage(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (files: File[], existingUrls: string[]) => {
    if (files.length > 0) {
      setNewImageFile(files[0]); // Solo tomamos el primer archivo para servicios
      setRemoveExistingImage(false);
    } else if (existingUrls.length === 0 && formData.image_url) {
      // Si no hay archivos nuevos ni URLs existentes, pero había una imagen antes, marcar para eliminar
      setRemoveExistingImage(true);
      setNewImageFile(null);
    } else {
      setNewImageFile(null);
      setRemoveExistingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar campos requeridos
    if (!formData.name || !formData.price || !formData.duration_minutes) {
      toast.error('Por favor completa todos los campos requeridos');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    try {
      const { professional } = await getCurrentProfessional();
      if (!professional) throw new Error('No professional found');

      let finalImageUrl = formData.image_url;

      // Procesar cambios de imagen
      if (newImageFile) {
        // Subir nueva imagen
        console.log('📤 Subiendo nueva imagen de servicio...');
        finalImageUrl = await uploadServiceImage(newImageFile);

        // Eliminar imagen anterior si existe
        if (formData.image_url && editingService) {
          console.log('🗑️ Eliminando imagen anterior...');
          await deleteImageFromStorage(formData.image_url);
        }
      } else if (removeExistingImage && formData.image_url) {
        // Eliminar imagen existente
        console.log('🗑️ Eliminando imagen existente...');
        await deleteImageFromStorage(formData.image_url);
        finalImageUrl = '';
      }

      const serviceData = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        image_url: finalImageUrl || undefined,
        professional_id: professional.id,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
      }

      resetForm();
      toast.success(editingService ? 'Servicio actualizado exitosamente' : 'Servicio creado exitosamente');
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error al guardar el servicio');
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
    setNewImageFile(null);
    setRemoveExistingImage(false);
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    const serviceToDelete = services.find((s) => s.id === serviceId);

    const confirmed = await confirm({
      title: '¿Eliminar este servicio?',
      description:
        'Esta acción eliminará permanentemente el servicio. Las citas existentes que usen este servicio no se verán afectadas.',
      confirmText: 'Eliminar servicio',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteService(serviceId);
      // Eliminar imagen asociada si existe
      if (serviceToDelete?.image_url) {
        await deleteImageFromStorage(serviceToDelete.image_url);
      }
      toast.success('Servicio eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando servicios..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
            <p className="text-gray-600">Gestiona los servicios que ofreces</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <TbPlus className="w-4 h-4 mr-2" />
            <span>Crear Servicio</span>
          </Button>
        </div>
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
                <TbX className="w-4 h-4" />
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
                    <TbCurrencyDollar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="15000"
                      min="0"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duración (minutos) *</label>
                  <div className="relative">
                    <TbClock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="duration_minutes"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      placeholder="30"
                      min="0"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del servicio</label>
                <ImageUploadWithCrop
                  onFilesChange={handleImageChange}
                  multiple={false}
                  maxFiles={1}
                  existingImages={formData.image_url ? [formData.image_url] : []}
                  disabled={submitting}
                  acceptedTypes="image/*"
                  enableCrop={true}
                  cropAspectRatio={1}
                />
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ?
                    'Guardando...'
                  : editingService ?
                    'Actualizar'
                  : 'Crear Servicio'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {services.length === 0 ?
          <div className="col-span-full text-center py-12">
            <TbCurrencyDollar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No tienes servicios creados</p>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <TbPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Crear primer servicio</span>
              <span className="sm:hidden">Crear Servicio</span>
            </Button>
          </div>
        : services.map((service) => (
            <Card key={service.id} className="relative">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden w-full">
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
                  : <div className="flex items-center justify-center w-full h-full">
                      <TbPhoto className="h-12 w-12 text-gray-300" />
                    </div>
                  }
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col min-h-[220px]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>

                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-green-600">
                      <span className="font-bold">{formatCurrency(service.price)}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <TbClock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{service.duration_minutes} min</span>
                    </div>
                  </div>

                  <div className="flex-1" />
                  {/* Actions alineados abajo */}
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(service)} className="flex-1">
                      <TbEdit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label="Eliminar"
                      onClick={() => handleDelete(service.id)}
                      className="sm:w-auto">
                      <TbTrash className="w-4 h-4 sm:mr-0 mr-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
      <ConfirmDialog />
    </div>
  );
}
