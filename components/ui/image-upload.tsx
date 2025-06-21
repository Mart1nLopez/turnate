'use client';

import { useState, useRef, useCallback } from 'react';
import { TbUpload, TbX, TbPhoto, TbLoader2 } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import { StorageService, validateImageFile, createImagePreview } from '@/lib/storage';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: string[];
  folderPath: string; // Ruta donde se guardarán las imágenes
  className?: string;
}

interface PreviewImage {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function ImageUpload({
  onUpload,
  multiple = false,
  maxFiles = 5,
  existingImages = [],
  folderPath,
  className = '',
}: ImageUploadProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      const totalImages = existingImages.length + previewImages.length + fileArray.length;

      if (totalImages > maxFiles) {
        toast.error(`Máximo ${maxFiles} imágenes permitidas`);
        return;
      }

      const newPreviewImages: PreviewImage[] = [];

      for (const file of fileArray) {
        const validation = validateImageFile(file);

        if (!validation.valid) {
          toast.error(validation.error);
          continue;
        }

        try {
          const preview = await createImagePreview(file);
          newPreviewImages.push({
            file,
            preview,
            uploading: false,
            uploaded: false,
          });
        } catch (error) {
          console.error('Error creating preview:', error);
        }
      }

      setPreviewImages((prev) => [...prev, ...newPreviewImages]);
    },
    [existingImages.length, previewImages.length, maxFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removePreviewImage = useCallback((index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadImages = useCallback(async () => {
    if (previewImages.length === 0) return;

    setUploading(true);

    const imagesToUpload = previewImages.filter((img) => !img.uploaded);

    // Marcar imágenes como subiendo
    setPreviewImages((prev) => prev.map((img) => (!img.uploaded ? { ...img, uploading: true } : img)));

    try {
      const files = imagesToUpload.map((img) => img.file);
      const result = await StorageService.uploadMultipleImages(files, folderPath);

      if (result.success && result.urls) {
        // Actualizar estado de las imágenes subidas
        setPreviewImages((prev) => {
          const updated = [...prev];
          let urlIndex = 0;

          for (let i = 0; i < updated.length; i++) {
            if (!updated[i].uploaded && !updated[i].error) {
              updated[i] = {
                ...updated[i],
                uploading: false,
                uploaded: true,
                url: result.urls![urlIndex],
              };
              urlIndex++;
            }
          }

          return updated;
        });

        // Notificar las URLs al componente padre
        const allUploadedUrls = [...existingImages, ...result.urls];
        onUpload(allUploadedUrls);
      }

      if (result.errors) {
        console.error('Errores subiendo imágenes:', result.errors);

        // Marcar imágenes con error
        setPreviewImages((prev) =>
          prev.map((img) => {
            if (!img.uploaded && result.errors) {
              const errorIndex = imagesToUpload.findIndex((uploadImg) => uploadImg.file === img.file);
              if (errorIndex !== -1 && result.errors[errorIndex]) {
                return {
                  ...img,
                  uploading: false,
                  error: result.errors[errorIndex],
                };
              }
            }
            return img;
          }),
        );
      }
    } catch (error) {
      console.error('Error uploading images:', error);

      // Marcar todas como error
      setPreviewImages((prev) =>
        prev.map((img) =>
          img.uploading ?
            {
              ...img,
              uploading: false,
              error: 'Error subiendo imagen',
            }
          : img,
        ),
      );
    } finally {
      setUploading(false);
    }
  }, [previewImages, folderPath, existingImages, onUpload]);

  const hasUploadedImages = previewImages.some((img) => img.uploaded);
  const hasImagesToUpload = previewImages.some((img) => !img.uploaded && !img.error);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zona de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        <TbPhoto className="w-12 h-12 text-gray-400 mx-auto mb-4" />

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Arrastra imágenes aquí o{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium">
              selecciona archivos
            </button>
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, WebP hasta 5MB
            {multiple && ` (máximo ${maxFiles} imágenes)`}
          </p>
        </div>
      </div>

      {/* Preview de imágenes */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized // Para data URLs de preview
                />

                {/* Overlay de estado */}
                {(image.uploading || image.uploaded || image.error) && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {image.uploading && <TbLoader2 className="w-6 h-6 text-white animate-spin" />}
                    {image.uploaded && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <TbUpload className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {image.error && (
                      <div className="text-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                          <TbX className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-white">{image.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botón eliminar */}
              {!image.uploading && !image.uploaded && (
                <button
                  onClick={() => removePreviewImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <TbX className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botones de acción */}
      {previewImages.length > 0 && (
        <div className="flex gap-2">
          {hasImagesToUpload && (
            <Button onClick={uploadImages} disabled={uploading} className="flex-1">
              {uploading ?
                <>
                  <TbLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              : <>
                  <TbUpload className="w-4 h-4 mr-2" />
                  Subir Imágenes
                </>
              }
            </Button>
          )}

          {hasUploadedImages && (
            <Button variant="outline" onClick={() => setPreviewImages([])}>
              Limpiar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
