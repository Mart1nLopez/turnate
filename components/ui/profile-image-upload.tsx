'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { TbCamera, TbX, TbUser, TbCrop } from 'react-icons/tb';
import { ImageCropper } from './image-cropper';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (file: File | null) => void;
  onRemoveImage: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-40 h-40',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ProfileImageUpload({
  currentImageUrl,
  onImageChange,
  onRemoveImage,
  disabled = false,
  size = 'lg',
}: ProfileImageUploadProps) {
  // Estados para el recorte
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Estados para la vista previa
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo de imagen
  const validateImageFile = useCallback((file: File): boolean => {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return false;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 10MB');
      return false;
    }

    return true;
  }, []);

  // Manejar selección de archivo
  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return;

      if (!validateImageFile(file)) return;

      // Guardar archivo original
      setOriginalFile(file);

      // Crear URL temporal para el cropper
      const tempUrl = URL.createObjectURL(file);
      setTempImageUrl(tempUrl);

      // Abrir modal de recorte
      setShowCropper(true);
    },
    [validateImageFile],
  );

  // Manejar cambio en input de archivo
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // Manejar completado del recorte
  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      // Crear vista previa del archivo recortado
      const previewUrl = URL.createObjectURL(croppedFile);
      setPreview(previewUrl);

      // Notificar cambio
      onImageChange(croppedFile);

      // Cerrar cropper
      setShowCropper(false);

      // Limpiar URL temporal
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl(null);
      }

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [tempImageUrl, onImageChange],
  );

  // Manejar cancelación del recorte
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);

    // Limpiar URL temporal
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }

    // Limpiar archivo original
    setOriginalFile(null);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [tempImageUrl]);

  // Manejar eliminación de imagen
  const handleRemove = useCallback(() => {
    // Limpiar vista previa
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }

    // Limpiar archivo original
    setOriginalFile(null);

    // Notificar eliminación
    onImageChange(null);
    onRemoveImage();

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview, onImageChange, onRemoveImage]);

  // Manejar re-recorte (hacer clic en la imagen)
  const handleRecrop = useCallback(() => {
    if (!originalFile || disabled) return;

    // Crear nueva URL temporal
    const tempUrl = URL.createObjectURL(originalFile);
    setTempImageUrl(tempUrl);

    // Abrir cropper
    setShowCropper(true);
  }, [originalFile, disabled]);

  // Manejar drop de archivo
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect],
  );

  // Manejar drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  // Manejar drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Determinar qué imagen mostrar
  const displayImage = preview || currentImageUrl;
  const canRecrop = originalFile && (preview || currentImageUrl);

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Imagen de perfil */}
        <div
          className={`
            relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-dashed 
            ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30'}
            transition-all duration-200 group
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}>
          {displayImage ?
            <>
              {/* Imagen actual */}
              <Image
                src={displayImage}
                alt="Foto de perfil"
                fill
                className="object-cover"
                sizes={
                  size === 'sm' ? '64px'
                  : size === 'md' ?
                    '96px'
                  : '160px'
                }
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/img/appointments-default.svg';
                }}
              />

              {/* Overlay con controles */}
              {!disabled && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      title="Cambiar imagen">
                      <TbCamera className={`${iconSizes[size]} text-white`} />
                    </button>

                    {canRecrop && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecrop();
                        }}
                        className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        title="Recortar nuevamente">
                        <TbCrop className={`${iconSizes[size]} text-white`} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove();
                      }}
                      className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-full hover:bg-red-600/80 transition-colors"
                      title="Eliminar imagen">
                      <TbX className={`${iconSizes[size]} text-white`} />
                    </button>
                  </div>
                </div>
              )}
            </>
          : /* Placeholder cuando no hay imagen */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <TbUser
                className={`${
                  size === 'sm' ? 'w-6 h-6'
                  : size === 'md' ? 'w-8 h-8'
                  : 'w-12 h-12'
                } mb-1`}
              />
              <TbCamera className={iconSizes[size]} />
            </div>
          }

          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Texto descriptivo */}
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">
            {displayImage ? '' : 'Agregar foto de perfil'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Haz clic o arrastra una imagen aquí
            <br />
            Formatos: PNG, JPG, WebP • Máximo 10MB
            {canRecrop && (
              <>
                <br />
                <span className="text-blue-600">Haz clic en la imagen para recortar nuevamente</span>
              </>
            )}
          </p>
        </div>

        {/* Botones de acción (móvil) */}
        {displayImage && !disabled && (
          <div className="flex space-x-2 sm:hidden">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              Cambiar
            </button>
            {canRecrop && (
              <button
                type="button"
                onClick={handleRecrop}
                className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                Recortar
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Modal de recorte */}
      {tempImageUrl && (
        <ImageCropper
          src={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isOpen={showCropper}
          aspectRatio={1}
        />
      )}
    </>
  );
}
