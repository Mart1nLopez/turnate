'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { TbUpload, TbX } from 'react-icons/tb';

interface ImageUploadProps {
  onFilesChange: (files: File[], existingUrls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: string[];
  disabled?: boolean;
  acceptedTypes?: string;
}

interface ImagePreview {
  file?: File;
  url?: string;
  preview: string;
  isExisting: boolean;
}

export function ImageUpload({
  onFilesChange,
  multiple = false,
  maxFiles = 6,
  existingImages = [],
  disabled = false,
  acceptedTypes = 'image/*',
}: ImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>(() =>
    existingImages.map((url) => ({
      url,
      preview: url,
      isExisting: true,
    })),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validar número máximo de archivos
    const totalFiles = images.length + fileArray.length;
    if (totalFiles > maxFiles) {
      toast.error(`Máximo ${maxFiles} imágenes permitidas`);
      return;
    }

    // Validar tipos de archivo
    const invalidFiles = fileArray.filter((file) => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño de archivos
    const oversizedFiles = fileArray.filter((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Las imágenes deben ser menores a 10MB');
      return;
    }

    // Crear previews para nuevos archivos
    const newImagePreviews: ImagePreview[] = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    const updatedImages = [...images, ...newImagePreviews];
    setImages(updatedImages);

    // Notificar cambios
    const newFiles = updatedImages.filter((img) => !img.isExisting && img.file).map((img) => img.file!);
    const existingUrls = updatedImages.filter((img) => img.isExisting && img.url).map((img) => img.url!);
    onFilesChange(newFiles, existingUrls);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];

    // Si es un archivo nuevo (no existente), revocar el object URL
    if (!imageToRemove.isExisting && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    // Notificar cambios
    const newFiles = updatedImages.filter((img) => !img.isExisting && img.file).map((img) => img.file!);
    const existingUrls = updatedImages.filter((img) => img.isExisting && img.url).map((img) => img.url!);
    onFilesChange(newFiles, existingUrls);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${disabled ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
          ${!disabled && 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-2">
          <TbUpload className="w-8 h-8 mx-auto text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium">Haz clic para subir</span> o arrastra las imágenes aquí
            <br />
            <span className="text-xs text-gray-500">PNG, JPG, WebP hasta 10MB • Máximo {maxFiles} imágenes</span>
          </div>
        </div>
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Imágenes del carrusel ({images.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative">
                  <Image
                    src={image.preview}
                    alt={`Imagen ${index + 1}`}
                    width={200}
                    height={96}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/img/appointments-default.svg';
                    }}
                  />
                  {!image.isExisting && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                      Nuevo
                    </div>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600">
                      <TbX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {images.length === 0 && (
        <div className="text-center text-gray-500 text-sm">
          No hay imágenes subidas. Las imágenes se mostrarán en tu página pública.
        </div>
      )}
    </div>
  );
}
