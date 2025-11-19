'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getProfessionalProfile,
  updateProfessionalProfile,
  removeProfileImage as removeProfileImageFromDB,
  checkSlugAvailability as checkSlugAvailabilityService,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
} from '@/services/professionalService';
import { deleteMultipleImages, deleteImageFromStorage, uploadCarouselImages, uploadProfileImage } from '@/lib/storage';
import { generateSlugWithRandomSuffix } from '@/lib/utils';
import { Professional } from '@/types';

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

interface UseProfileReturn {
  // Estado principal
  professional: Professional | null;
  loading: boolean;
  submitting: boolean;

  // Formulario
  formData: ProfileForm;
  setFormData: React.Dispatch<React.SetStateAction<ProfileForm>>;

  // Imágenes
  images: ProfileImage[];
  newImageFiles: File[];
  profileImageFile: File | null;
  removeProfileImage: boolean;
  currentProfileImageUrl: string | undefined;

  // Validaciones
  slugError: string;
  checkingSlug: boolean;
  nameError: string;
  slugCharacterError: string;

  // QR
  showQR: boolean;
  setShowQR: React.Dispatch<React.SetStateAction<boolean>>;
  qrRef: React.RefObject<HTMLDivElement | null>;

  // Google
  isSyncedWithGoogle: boolean;
  handleGoogleSync: () => Promise<void>;
  handleGoogleDisconnect: (
    confirm: (options: {
      title: string;
      description: string;
      variant?: 'default' | 'destructive' | 'warning' | 'info';
    }) => Promise<boolean>,
  ) => Promise<void>;

  // Cropper
  showCropper: boolean;
  setShowCropper: React.Dispatch<React.SetStateAction<boolean>>;

  // Funciones
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleImagesChange: (files: File[], existingUrls: string[]) => void;
  handleProfileImageChange: (file: File | null) => void;
  handleRemoveProfileImage: () => void;
  getPublicUrl: () => string;
  handleDownloadQR: () => void;
  handleCopyQR: () => Promise<void>;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
}

// Rutas reservadas que no se pueden usar como slug
const RESERVED_ROUTES = [
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
  'confirmado',
];

export function useProfile(): UseProfileReturn {
  // Cropper
  const [showCropper, setShowCropper] = useState(false);
  // Estado principal
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Formulario
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

  // Imágenes
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<string | undefined>(undefined);

  // Validaciones
  const [slugError, setSlugError] = useState<string>('');
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [nameError, setNameError] = useState<string>('');
  const [slugCharacterError, setSlugCharacterError] = useState<string>('');

  // QR
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Google Calendar
  const [isSyncedWithGoogle, setIsSyncedWithGoogle] = useState(false);

  // Cargar profesional
  const loadProfessional = useCallback(async () => {
    try {
      const professional = await getProfessionalProfile();
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
      setCurrentProfileImageUrl(professional.profile_image);
      setIsSyncedWithGoogle(Boolean(professional.google_refresh_token));
    } catch (error) {
      console.error('Error loading professional:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfessional();
  }, [loadProfessional]);

  // Iniciar conexión con Google
  const handleGoogleSync = async () => {
    setSubmitting(true);
    toast.info('Redirigiendo a Google para conectar tu calendario...');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('is_connecting_google', 'true');
    }

    try {
      await connectGoogleCalendar();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Error al conectar con Google: ' + message);
      setSubmitting(false);
      // Si falla, limpiamos la marca por si acaso
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('is_connecting_google');
      }
    }
    // El usuario será redirigido por Supabase
  };

  // Para desconectar Google
  const handleGoogleDisconnect = async (
    confirm: (options: {
      title: string;
      description: string;
      variant?: 'default' | 'destructive' | 'warning' | 'info';
    }) => Promise<boolean>,
  ) => {
    if (!professional) {
      toast.error('No se pudo cargar el perfil. Intenta recargar la página.');
      return;
    }

    const confirmed = await confirm({
      title: 'Desconectar Google Calendar',
      description: '¿Estás seguro de que quieres desconectar tu Google Calendar? Tus citas ya no se sincronizarán.',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      await disconnectGoogleCalendar(professional.id);
      // Actualiza el estado local
      setProfessional((prev) => (prev ? { ...prev, google_refresh_token: null } : null));
      setIsSyncedWithGoogle(false);
      toast.success('Google Calendar desconectado exitosamente.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Error al desconectar: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  // Validar slug
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
    if (RESERVED_ROUTES.includes(newSlug.toLowerCase())) {
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

  // Verificar disponibilidad del slug
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (professional && slug === professional.slug) return true;
    return await checkSlugAvailabilityService(slug, professional?.id);
  };

  // Manejar cambios en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validar límite de caracteres para el nombre
    if (name === 'name') {
      if (value.length > 30) {
        setNameError('El nombre no puede exceder los 30 caracteres');
        toast.error('El nombre no puede exceder los 30 caracteres');
        return;
      } else {
        setNameError('');
      }
    }

    // Validar límite de caracteres para el slug
    if (name === 'slug') {
      if (value.length > 25) {
        setSlugCharacterError('El slug no puede exceder los 25 caracteres');
        toast.error('El slug no puede exceder los 25 caracteres');
        return;
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
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
      slugTimeoutRef.current = setTimeout(() => {
        validateAndSetSlug(value);
      }, 500);
    }

    // Si es el nombre y el slug está vacío, generar slug automáticamente
    if (name === 'name' && (!formData.slug || formData.slug === generateSlugWithRandomSuffix(formData.name))) {
      const newSlug = generateSlugWithRandomSuffix(value);
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

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!professional) throw new Error('No professional found');

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
        newImageUrls = await uploadCarouselImages(newImageFiles);
      }

      // Manejar imagen de perfil
      let finalProfileImageUrl = professional.profile_image;

      if (profileImageFile) {
        // Subir nueva imagen de perfil
        finalProfileImageUrl = await uploadProfileImage(profileImageFile);

        // Eliminar imagen de perfil anterior si existe
        if (professional.profile_image) {
          await deleteImageFromStorage(professional.profile_image);
        }
      } else if (removeProfileImage && professional.profile_image) {
        // Eliminar imagen de perfil existente
        await deleteImageFromStorage(professional.profile_image);
        finalProfileImageUrl = undefined;
      }

      // Determinar qué imágenes eliminar (las que estaban antes pero ya no están)
      const currentImageUrls = professional.carrusel_images?.map((img) => img.url) || [];
      const keptImageUrls = images.map((img) => img.url);
      const imagesToDelete = currentImageUrls.filter((url) => !keptImageUrls.includes(url));

      // Eliminar imágenes que ya no están
      if (imagesToDelete.length > 0) {
        await deleteMultipleImages(imagesToDelete);
      }

      // Combinar imágenes existentes con las nuevas
      const allImages = [...images, ...newImageUrls.map((url) => ({ url, alt: 'Imagen del perfil' }))];

      const updateData = {
        name: formData.name,
        slug: formData.slug,
        bio: formData.bio || undefined,
        phone: formData.phone,
        location: formData.location || undefined,
        map_embed_url: formData.map_embed_url || undefined,
        profile_image: finalProfileImageUrl,
        social_links: {
          instagram: formData.instagram || undefined,
          whatsapp: formData.whatsapp || undefined,
          facebook: formData.facebook || undefined,
          tiktok: formData.tiktok || undefined,
          twitter: formData.twitter || undefined,
          youtube: formData.youtube || undefined,
        },
        carrusel_images: allImages,
      };

      await updateProfessionalProfile(professional.id, updateData);

      // Si se marcó para eliminar la imagen de perfil y no hay una nueva imagen, eliminar de la BD
      if (removeProfileImage && !profileImageFile) {
        await removeProfileImageFromDB(professional.id);
        updateData.profile_image = undefined;
      }

      setProfessional((prev) => (prev ? ({ ...prev, ...updateData } as Professional) : null));
      setImages(allImages);
      setNewImageFiles([]);
      setProfileImageFile(null);
      setRemoveProfileImage(false);
      setCurrentProfileImageUrl(removeProfileImage && !profileImageFile ? undefined : finalProfileImageUrl);

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cambios en imágenes del carrusel
  const handleImagesChange = useCallback((files: File[], existingUrls: string[]) => {
    setNewImageFiles(files);
    const existingImages: ProfileImage[] = existingUrls.map((url) => ({
      url,
      alt: 'Imagen del perfil',
    }));
    setImages(existingImages);
  }, []);

  // Manejar cambio en imagen de perfil
  const handleProfileImageChange = useCallback(
    (file: File | null) => {
      setProfileImageFile(file);
      setRemoveProfileImage(false);
      if (file) {
        setCurrentProfileImageUrl(professional?.profile_image);
      }
    },
    [professional?.profile_image],
  );

  // Manejar eliminación de imagen de perfil
  const handleRemoveProfileImage = useCallback(() => {
    setProfileImageFile(null);
    setRemoveProfileImage(true);
    setCurrentProfileImageUrl(undefined);
  }, []);

  // Obtener URL pública
  const getPublicUrl = () => {
    const slug = professional?.slug;
    if (!slug) return '';
    return `${window.location.origin}/${slug}`;
  };

  // Descargar QR
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
        downloadLink.download = `qr-${professional?.slug}-turnate.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
  };

  // Copiar QR al portapapeles
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

  return {
    // Estado principal
    professional,
    loading,
    submitting,

    // Formulario
    formData,
    setFormData,

    // Imágenes
    images,
    newImageFiles,
    profileImageFile,
    removeProfileImage,
    currentProfileImageUrl,

    // Validaciones
    slugError,
    checkingSlug,
    nameError,
    slugCharacterError,

    // QR
    showQR,
    setShowQR,
    qrRef,

    // Google
    isSyncedWithGoogle,
    handleGoogleSync,
    handleGoogleDisconnect,

    // Cropper
    showCropper,
    setShowCropper,

    // Funciones
    handleInputChange,
    handleSubmit,
    handleImagesChange,
    handleProfileImageChange,
    handleRemoveProfileImage,
    getPublicUrl,
    handleDownloadQR,
    handleCopyQR,
    checkSlugAvailability,
  };
}
