'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TbUser, TbPhone, TbMapPin, TbDeviceFloppy, TbLink, TbQrcode, TbQrcodeOff, TbCopy } from 'react-icons/tb';
import { FaInstagram, FaWhatsapp, FaSquareFacebook, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase, getCurrentProfessional } from '@/lib/supabase';
import { deleteMultipleImages, uploadCarouselImages } from '@/lib/storage';
import { Professional } from '@/types';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

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
  tiktok: string;
  twitter: string;
  youtube: string;
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
    tiktok: '',
    twitter: '',
    youtube: '',
  });
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [nameError, setNameError] = useState<string>('');
  const [slugCharacterError, setSlugCharacterError] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Rutas reservadas que no se pueden usar como slug
  const reservedRoutes = [
    'dashboard',
    'auth',
    'api',
    'review',
    'admin',
    'app',
    'blog',
    'help',
    'support',
    'contact',
    'about',
    'terms',
    'privacy',
    'login',
    'register',
    'logout',
    'profile',
    'settings',
    'config',
    'setup',
    'demo',
    'test',
    'www',
    'mail',
    'email',
    'ftp',
    'static',
    'assets',
    'public',
    'home',
    'index',
    'sitemap',
    'robots',
    'favicon',
    'manifest',
  ];

  const loadProfessional = useCallback(async () => {
    try {
      // Obtener el usuario autenticado para logs
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('🔍 Usuario autenticado:', user?.id);

      const { professional, error } = await getCurrentProfessional();
      if (error || !professional) throw error;

      console.log('👤 Profesional cargado:', {
        professionalId: professional.id,
        userId: user?.id,
        areEqual: professional.id === user?.id,
      });

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
        tiktok: professional.social_links?.tiktok || '',
        twitter: professional.social_links?.twitter || '',
        youtube: professional.social_links?.youtube || '',
      });
      setImages(professional.carrusel_images || []);
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

    // Validar límite de caracteres para el nombre
    if (name === 'name') {
      if (value.length > 30) {
        setNameError('El nombre no puede exceder los 30 caracteres');
        toast.error('El nombre no puede exceder los 30 caracteres');
        return; // No actualizar el estado si excede el límite
      } else {
        setNameError('');
      }
    }

    // Validar límite de caracteres para el slug
    if (name === 'slug') {
      if (value.length > 25) {
        setSlugCharacterError('El slug no puede exceder los 25 caracteres');
        toast.error('El slug no puede exceder los 25 caracteres');
        return; // No actualizar el estado si excede el límite
      } else {
        setSlugCharacterError('');
      }
    }

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
      console.log('🚀 Iniciando actualización del perfil...');

      if (!professional) throw new Error('No professional found');

      console.log('👤 Profesional encontrado:', professional.id);
      console.log('📷 Nuevas imágenes a subir:', newImageFiles.length);
      console.log('🖼️ Imágenes existentes:', images.length);

      // Validar que no haya errores en el slug antes de enviar
      if (slugError || slugCharacterError) {
        toast.error('Corrige los errores en el slug antes de continuar');
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

      // Subir nuevas imágenes si las hay
      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        console.log('🎠 Subiendo', newImageFiles.length, 'nuevas imágenes de carrusel...');
        newImageUrls = await uploadCarouselImages(newImageFiles);
        console.log('✅ Imágenes de carrusel subidas exitosamente:', newImageUrls);
      }

      // Determinar qué imágenes eliminar (las que estaban antes pero ya no están)
      const currentImageUrls = professional.carrusel_images?.map((img) => img.url) || [];
      const keptImageUrls = images.map((img) => img.url);
      const imagesToDelete = currentImageUrls.filter((url) => !keptImageUrls.includes(url));

      console.log('🗑️ Imágenes a eliminar:', imagesToDelete.length);

      // Eliminar imágenes que ya no están
      if (imagesToDelete.length > 0) {
        await deleteMultipleImages(imagesToDelete);
      }

      // Combinar imágenes existentes con las nuevas
      const allImages = [...images, ...newImageUrls.map((url) => ({ url, alt: 'Imagen del perfil' }))];

      console.log('💾 Total de imágenes finales:', allImages.length);

      const updateData = {
        name: formData.name,
        slug: formData.slug,
        bio: formData.bio || null,
        phone: formData.phone,
        location: formData.location || null,
        map_embed_url: formData.map_embed_url || null,
        social_links: {
          instagram: formData.instagram || null,
          whatsapp: formData.whatsapp || null,
          facebook: formData.facebook || null,
          tiktok: formData.tiktok || null,
          twitter: formData.twitter || null,
          youtube: formData.youtube || null,
        },
        carrusel_images: allImages,
      };

      console.log('💾 Actualizando base de datos...');
      const { error } = await supabase.from('professionals').update(updateData).eq('id', professional.id);

      if (error) throw error;

      // Actualizar el estado local
      setProfessional((prev) => (prev ? ({ ...prev, ...updateData } as Professional) : null));
      setImages(allImages);
      setNewImageFiles([]);

      console.log('✅ Perfil actualizado exitosamente');
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImagesChange = (files: File[], existingUrls: string[]) => {
    // Actualizar archivos nuevos
    setNewImageFiles(files);

    // Actualizar imágenes existentes
    const existingImages: ProfileImage[] = existingUrls.map((url) => ({
      url,
      alt: 'Imagen del perfil',
    }));
    setImages(existingImages);
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

    // Validar que no sea una ruta reservada
    if (reservedRoutes.includes(newSlug.toLowerCase())) {
      setSlugError('Este slug está reservado y no se puede usar');
      setCheckingSlug(false);
      return;
    }

    const isAvailable = await checkSlugAvailability(newSlug);

    if (!isAvailable) {
      setSlugError('Este slug ya está en uso por otro profesional');
    }

    setCheckingSlug(false);
  };

  // Función para descargar el QR como imagen PNG
  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const img = new window.Image();
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    img.onload = function () {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = 'qr-turnate.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
  };

  // Copiar el QR al portapapeles como imagen PNG
  const handleCopyQR = async () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const img = new window.Image();
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    img.onload = async function () {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
            toast.success('QR copiado al portapapeles como imagen');
          } catch {
            toast.error('No se pudo copiar la imagen. Usa Chrome, Edge o navegadores modernos.');
          }
        }, 'image/png');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
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
          <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
            <div className="flex-1 flex items-center space-x-3">
              <Input value={getPublicUrl()} readOnly className="flex-1 bg-gray-50" />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(getPublicUrl());
                  toast.success('URL copiada al portapapeles');
                }}
                variant="outline">
                <TbCopy className="w-4 h-4 mr-2" />
                Link
              </Button>
              <Button onClick={() => window.open(getPublicUrl(), '_blank')} variant="default">
                Ver página
              </Button>
            </div>
            <Button
              className="text-xl text-blue-700 hover:text-blue-800"
              variant="outline"
              type="button"
              onClick={() => setShowQR((prev) => !prev)}>
              {showQR ?
                <TbQrcodeOff />
              : <>
                  <TbQrcode />
                </>
              }
            </Button>
          </div>
          {showQR && (
            <div className="flex flex-col items-center mt-4">
              <span className="text-xs text-gray-500 mb-1">Presiona el QR para copiarlo</span>
              <div
                ref={qrRef}
                style={{
                  background: 'white',
                  padding: 16,
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #0001',
                }}
                onClick={handleCopyQR}
                title="Copiar QR al portapapeles">
                <QRCode
                  value={getPublicUrl()}
                  size={192}
                  style={{ height: 'auto', maxWidth: '100%', width: '192px' }}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs px-3 py-1 h-7"
                onClick={handleDownloadQR}
                type="button">
                Descargar Imagen
              </Button>
            </div>
          )}
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
                    placeholder="Tu nombre"
                    className={`pl-10 ${nameError ? 'border-red-500' : ''}`}
                    maxLength={30}
                    required
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div>{nameError && <p className="text-red-500 text-sm">{nameError}</p>}</div>
                  <p className={`text-xs ${formData.name.length > 25 ? 'text-orange-500' : 'text-gray-500'}`}>
                    {formData.name.length}/30 caracteres
                  </p>
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
                    slugError || slugCharacterError ? 'border-red-500'
                    : checkingSlug ? 'border-yellow-500'
                    : ''
                  }`}
                  maxLength={25}
                  required
                />
                {checkingSlug && (
                  <div className="absolute right-3 top-3">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start mt-1">
                <div className="flex flex-col">
                  {(slugError || slugCharacterError) && (
                    <p className="text-red-500 text-sm">{slugError || slugCharacterError}</p>
                  )}
                  {!slugError && !slugCharacterError && !checkingSlug && formData.slug && (
                    <p className="text-green-600 text-sm">✓ Slug disponible</p>
                  )}
                </div>
                <p className={`text-xs ${formData.slug.length > 15 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {formData.slug.length}/25 caracteres
                </p>
              </div>
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
                placeholder='&lt;iframe src="https://www.google.com/maps/embed?pb=..."&gt;&lt;/iframe&gt;'
              />
              <p className="text-xs text-gray-500 mt-1">
                Ve a Google Maps, busca tu ubicación, haz clic en &quot;Compartir&quot; → &quot;Incorporar un mapa&quot;
                y selecciona &quot;Copiar HTML&quot;.
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
                  <FaInstagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                  <FaWhatsapp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                  <FaSquareFacebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="Tu página de Facebook"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                <div className="relative">
                  <FaTiktok className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleInputChange}
                    placeholder="@tu_usuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                <div className="relative">
                  <FaXTwitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="@usuario o enlace"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                <div className="relative">
                  <FaYoutube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleInputChange}
                    placeholder="Canal o enlace"
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
            <ImageUpload
              onFilesChange={handleImagesChange}
              multiple={true}
              maxFiles={6}
              existingImages={images.map((img) => img.url)}
            />
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
