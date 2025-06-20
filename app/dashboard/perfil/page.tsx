'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  TbUser,
  TbPhone,
  TbMapPin,
  TbBrandInstagram,
  TbBrandWhatsapp,
  TbBrandFacebook,
  TbPhoto,
  TbDeviceFloppy,
  TbLink,
} from 'react-icons/tb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ui/image-upload';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { Professional } from '@/types';
import Image from 'next/image';

interface ProfileForm {
  name: string;
  slug: string;
  bio: string;
  phone: string;
  location: string;
  map_embed_url: string;
  instagram: string;
  whatsapp: string;
  facebook: string;
}

interface ProfileImage {
  url: string;
  alt: string;
}

export default function PerfilPage() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    slug: '',
    bio: '',
    phone: '',
    location: '',
    map_embed_url: '',
    instagram: '',
    whatsapp: '',
    facebook: '',
  });
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadProfessional = useCallback(async () => {
    try {
      const { professional, error } = await getCurrentProfessional();
      if (error || !professional) throw error;

      setProfessional(professional);
      setFormData({
        name: professional.name || '',
        slug: professional.slug || '',
        bio: professional.bio || '',
        phone: professional.phone || '',
        location: professional.location || '',
        map_embed_url: professional.map_embed_url || '',
        instagram: professional.social_links?.instagram || '',
        whatsapp: professional.social_links?.whatsapp || '',
        facebook: professional.social_links?.facebook || '',
      });
      setImages(professional.profile_images || []);
    } catch (error) {
      console.error('Error loading professional:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfessional();
  }, [loadProfessional]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si es el slug, validar en tiempo real con debounce
    if (name === 'slug') {
      setSlugError('');
      // Limpiar timeout anterior si existe
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
      // Validar después de 500ms de inactividad
      slugTimeoutRef.current = setTimeout(() => {
        validateAndSetSlug(value);
      }, 500);
    }

    // Si es el nombre y el slug está vacío, generar slug automáticamente
    if (name === 'name' && (!formData.slug || formData.slug === generateSlugFromName(formData.name))) {
      const newSlug = generateSlugFromName(value);
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: newSlug,
      }));

      // Validar el nuevo slug generado
      if (newSlug) {
        if (slugTimeoutRef.current) {
          clearTimeout(slugTimeoutRef.current);
        }
        slugTimeoutRef.current = setTimeout(() => {
          validateAndSetSlug(newSlug);
        }, 500);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!professional) throw new Error('No professional found');

      // Validar que no haya errores en el slug antes de enviar
      if (slugError) {
        alert('Corrige el error en el slug antes de continuar');
        setSubmitting(false);
        return;
      }

      // Verificar disponibilidad del slug una vez más antes de guardar
      if (formData.slug !== professional.slug) {
        const isSlugAvailable = await checkSlugAvailability(formData.slug);
        if (!isSlugAvailable) {
          setSlugError('Este slug ya está en uso por otro profesional');
          setSubmitting(false);
          return;
        }
      }

      const updateData = {
        name: formData.name,
        slug: formData.slug,
        bio: formData.bio || undefined,
        phone: formData.phone,
        location: formData.location || undefined,
        map_embed_url: formData.map_embed_url || undefined,
        social_links: {
          instagram: formData.instagram || undefined,
          whatsapp: formData.whatsapp || undefined,
          facebook: formData.facebook || undefined,
        },
        profile_images: images,
      };

      const { error } = await supabase.from('professionals').update(updateData).eq('id', professional.id);

      if (error) throw error;

      // Actualizar el estado local
      setProfessional((prev) => (prev ? ({ ...prev, ...updateData } as Professional) : null));

      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagesUpload = (urls: string[]) => {
    const newImages: ProfileImage[] = urls.map((url) => ({
      url,
      alt: 'Imagen del perfil',
    }));
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getPublicUrl = () => {
    const slug = formData.slug || professional?.slug;
    if (!slug) return '';
    return `${window.location.origin}/${slug}`;
  };

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/-+/g, '-'); // Remover guiones duplicados
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug || slug.trim() === '') return false;

    // Si es el mismo slug actual del profesional, es válido
    if (professional && slug === professional.slug) return true;

    try {
      const { error } = await supabase.from('professionals').select('id').eq('slug', slug).single();

      if (error && error.code === 'PGRST116') {
        // No se encontró ningún registro, el slug está disponible
        return true;
      }

      if (error) {
        console.error('Error checking slug:', error);
        return false;
      }

      // Si se encontró un registro, el slug ya existe
      return false;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  };

  const validateAndSetSlug = async (newSlug: string) => {
    setCheckingSlug(true);
    setSlugError('');

    if (!newSlug || newSlug.trim() === '') {
      setSlugError('El slug es requerido');
      setCheckingSlug(false);
      return;
    }

    // Validar formato del slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(newSlug)) {
      setSlugError('El slug solo puede contener letras minúsculas, números y guiones');
      setCheckingSlug(false);
      return;
    }

    const isAvailable = await checkSlugAvailability(newSlug);

    if (!isAvailable) {
      setSlugError('Este slug ya está en uso por otro profesional');
    }

    setCheckingSlug(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Configura tu información pública</p>
      </div>

      {/* Public URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbLink className="w-5 h-5 mr-2" />
            Tu Página Pública
          </CardTitle>
          <CardDescription>Esta es la URL que puedes compartir con tus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Input value={getPublicUrl()} readOnly className="flex-1 bg-gray-50" />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(getPublicUrl());
                alert('URL copiada al portapapeles');
              }}
              variant="outline">
              Copiar
            </Button>
            <Button onClick={() => window.open(getPublicUrl(), '_blank')} variant="outline">
              Ver página
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Tu información de contacto y descripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                <div className="relative">
                  <TbPhone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+56 9 1234 5678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL personalizada (slug) *</label>
              <div className="relative">
                <TbLink className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="tu-nombre-unico"
                  className={`pl-10 ${
                    slugError ? 'border-red-500'
                    : checkingSlug ? 'border-yellow-500'
                    : ''
                  }`}
                  required
                />
                {checkingSlug && (
                  <div className="absolute right-3 top-3">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              {slugError && <p className="text-red-500 text-sm mt-1">{slugError}</p>}
              {!slugError && !checkingSlug && formData.slug && (
                <p className="text-green-600 text-sm mt-1">✓ Slug disponible</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Tu URL será: {process.env.NEXT_PUBLIC_APP_URL || 'https://turnate.cl'}/{formData.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción / Bio</label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Cuéntales a tus clientes sobre ti y tu experiencia..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
            <CardDescription>Información sobre dónde atiendes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <div className="relative">
                <TbMapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Calle Ejemplo 123, Comuna, Ciudad"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del mapa embebido (Google Maps)
              </label>
              <Input
                name="map_embed_url"
                value={formData.map_embed_url}
                onChange={handleInputChange}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Ve a Google Maps, busca tu ubicación, haz clic en &quot;Compartir&quot; → &quot;Incorporar un mapa&quot;
                y copia la URL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
            <CardDescription>Enlaces a tus perfiles de redes sociales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                <div className="relative">
                  <TbBrandInstagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@tu_usuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                <div className="relative">
                  <TbBrandWhatsapp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+56912345678"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                <div className="relative">
                  <TbBrandFacebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="Tu página de Facebook"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Perfil</CardTitle>
            <CardDescription>Agrega imágenes que se mostrarán en tu página pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload de imágenes */}
            <ImageUpload
              onUpload={handleImagesUpload}
              multiple={true}
              maxFiles={6}
              existingImages={images.map((img) => img.url)}
              folderPath={`professionals/${professional?.id || 'temp'}`}
            />

            {/* Image gallery */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        size="sm"
                        variant="destructive">
                        ×
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 truncate">{image.alt}</p>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <TbPhoto className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No has agregado imágenes aún</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="px-8">
            <TbDeviceFloppy className="w-4 h-4 mr-2" />
            {submitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
