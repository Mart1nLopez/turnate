'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { TbUpload, TbX, TbCrop } from 'react-icons/tb';
import { ImageCropper } from './image-cropper';

interface ImageUploadProps {
  onFilesChange: (files: File[], existingUrls: string[]) => void;
  onCropperStateChange?: (show: boolean) => void;
  multiple?: boolean;
  maxFiles?: number;
  existingImages?: string[];
  disabled?: boolean;
  acceptedTypes?: string;
  enableCrop?: boolean;
  cropAspectRatio?: number;
}

interface ImagePreview {
  file?: File;
  url?: string;
  preview: string;
  isExisting: boolean;
  originalFile?: File;
}

export function ImageUploadWithCrop({
  onFilesChange,
  multiple = false,
  maxFiles = 6,
  existingImages = [],
  disabled = false,
  acceptedTypes = 'image/*',
  enableCrop = false,
  cropAspectRatio = 1,
  onCropperStateChange,
}: ImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>(() =>
    existingImages.map((url) => ({
      url,
      preview: url,
      isExisting: true,
    })),
  );

  // Estados para el cropper
  const [showCropper, setShowCropper] = useState(false);
  useEffect(() => {
    if (onCropperStateChange) {
      onCropperStateChange(showCropper);
    }
  }, [showCropper, onCropperStateChange]);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [recropIndex, setRecropIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar archivos
  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];

    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Solo se permiten archivos de imagen`);
        continue;
      }

      // Validar tamaño de archivo
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: La imagen debe ser menor a 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, []);

  // Procesar archivo individual (con o sin crop)
  const processFile = useCallback(
    (file: File, isRecrop: boolean = false, targetIndex?: number) => {
      if (enableCrop) {
        // Mostrar cropper
        setPendingFile(file);
        setTempImageUrl(URL.createObjectURL(file));
        setRecropIndex(isRecrop && targetIndex !== undefined ? targetIndex : null);
        setShowCropper(true);
      } else {
        // Agregar directamente sin crop
        const newImagePreview: ImagePreview = {
          file,
          preview: URL.createObjectURL(file),
          isExisting: false,
          originalFile: file,
        };

        if (isRecrop && targetIndex !== undefined) {
          // Reemplazar imagen existente
          const updatedImages = [...images];
          // Limpiar URL anterior si no es existente
          if (!updatedImages[targetIndex].isExisting) {
            URL.revokeObjectURL(updatedImages[targetIndex].preview);
          }
          updatedImages[targetIndex] = newImagePreview;
          setImages(updatedImages);
        } else {
          // Agregar nueva imagen
          setImages((prev) => [...prev, newImagePreview]);
        }
      }
    },
    [enableCrop, images],
  );

  // Manejar selección de archivos
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = validateFiles(fileArray);

      if (validFiles.length === 0) return;

      // Validar número máximo de archivos
      const totalFiles = images.length + validFiles.length;
      if (totalFiles > maxFiles) {
        toast.error(`Máximo ${maxFiles} imágenes permitidas`);
        return;
      }

      // Procesar archivos
      if (enableCrop && validFiles.length === 1) {
        // Si hay crop habilitado y es un solo archivo, mostrar cropper
        processFile(validFiles[0]);
      } else {
        // Procesar múltiples archivos o sin crop
        const newImagePreviews: ImagePreview[] = validFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          isExisting: false,
          originalFile: file,
        }));

        const updatedImages = [...images, ...newImagePreviews];
        setImages(updatedImages);
      }

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images, maxFiles, validateFiles, enableCrop, processFile],
  );

  // Manejar crop completado
  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      if (!pendingFile) return;

      const newImagePreview: ImagePreview = {
        file: croppedFile,
        preview: URL.createObjectURL(croppedFile),
        isExisting: false,
        originalFile: pendingFile,
      };

      if (recropIndex !== null) {
        // Reemplazar imagen existente
        const updatedImages = [...images];
        // Limpiar URL anterior si no es existente
        if (!updatedImages[recropIndex].isExisting) {
          URL.revokeObjectURL(updatedImages[recropIndex].preview);
        }
        updatedImages[recropIndex] = newImagePreview;
        setImages(updatedImages);
      } else {
        // Agregar nueva imagen
        setImages((prev) => [...prev, newImagePreview]);
      }

      // Limpiar estados del cropper
      setShowCropper(false);
      setPendingFile(null);
      setRecropIndex(null);
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl(null);
      }
    },
    [pendingFile, recropIndex, images, tempImageUrl],
  );

  // Manejar cancelación del crop
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setPendingFile(null);
    setRecropIndex(null);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  }, [tempImageUrl]);

  // Manejar eliminación de imagen
  const handleRemoveImage = useCallback(
    (index: number) => {
      const imageToRemove = images[index];

      // Si es un archivo nuevo (no existente), revocar el object URL
      if (!imageToRemove.isExisting && imageToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
    },
    [images],
  );

  // Manejar re-crop de imagen
  const handleRecropImage = useCallback(
    (index: number) => {
      const image = images[index];
      if (image.originalFile) {
        processFile(image.originalFile, true, index);
      } else {
        toast.error('No se puede recortar esta imagen');
      }
    },
    [images, processFile],
  );

  // Efecto para notificar cambios
  useEffect(() => {
    const newFiles = images.filter((img) => !img.isExisting && img.file).map((img) => img.file!);
    const existingUrls = images.filter((img) => img.isExisting && img.url).map((img) => img.url!);
    onFilesChange(newFiles, existingUrls);
  }, [images, onFilesChange]);

  // Manejar drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect],
  );

  // Manejar drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${
              disabled ?
                'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            multiple={multiple && !enableCrop}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />

          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <TbUpload className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Haz clic para subir</span> o arrastra las imágenes aquí
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Formatos soportados: PNG, JPG, WebP • Máximo 10MB por imagen • Hasta {maxFiles} imágenes
                {enableCrop && <br />}
                {enableCrop && 'Las imágenes se recortarán automáticamente'}
              </span>
            </div>
          </div>
        </div>

        {/* Images Preview */}
        {images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Imágenes seleccionadas ({images.length}/{maxFiles})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => {
                // Determinar clase de aspect ratio
                let aspectClass = 'aspect-square';
                if (cropAspectRatio === 1) {
                  aspectClass = 'aspect-square';
                } else if (cropAspectRatio === 16 / 9) {
                  aspectClass = 'aspect-[16/9]';
                } else if (cropAspectRatio === 4 / 3) {
                  aspectClass = 'aspect-[4/3]';
                } else {
                  // Generar clase aspect-[X/Y] con máximo 2 decimales
                  const ratio = cropAspectRatio;
                  let x = 1,
                    y = 1;
                  if (ratio > 1) {
                    x = Math.round(ratio * 100);
                    y = 100;
                  } else {
                    x = 100;
                    y = Math.round((1 / ratio) * 100);
                  }
                  aspectClass = `aspect-[${x}/${y}]`;
                }
                return (
                  <div key={index} className="relative group">
                    <div
                      className={`relative ${aspectClass} bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                      <Image
                        src={image.preview}
                        alt={`Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/img/appointments-default.svg';
                        }}
                      />

                      {/* Overlay gradient for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                      {!image.isExisting && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                          Nuevo
                        </div>
                      )}

                      {!disabled && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {enableCrop && image.originalFile && (
                            <button
                              type="button"
                              onClick={() => handleRecropImage(index)}
                              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-green-600 hover:scale-110 shadow-md"
                              title="Recortar nuevamente">
                              <TbCrop className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-md"
                            title="Eliminar imagen">
                            <TbX className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Image number indicator */}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info */}
        {images.length === 0 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <TbUpload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-1">No hay imágenes subidas</p>
            <p className="text-gray-400 text-xs">Las imágenes se mostrarán en tu página pública como un carrusel</p>
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
          aspectRatio={cropAspectRatio}
        />
      )}
    </>
  );
}
