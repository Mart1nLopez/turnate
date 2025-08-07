'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { TbX, TbCheck, TbLoader } from 'react-icons/tb';
import { toast } from 'sonner';

interface ImageCropperProps {
  src: string;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
  isOpen: boolean;
  aspectRatio?: number;
}

export function ImageCropper({ src, onCropComplete, onCancel, isOpen, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Función para calcular el crop inicial centrado
  const calculateInitialCrop = useCallback(
    (image: HTMLImageElement): Crop => {
      const { width, height } = image;

      // Calcular dimensiones basadas en el aspect ratio
      let cropWidth: number;
      let cropHeight: number;

      if (aspectRatio === 1) {
        // Cuadrado: usar el menor entre ancho y alto
        const cropSize = Math.min(width, height);
        cropWidth = cropSize;
        cropHeight = cropSize;
      } else if (aspectRatio > 1) {
        // Horizontal: aspect ratio > 1 (ej: 16/9 = 1.78)
        cropHeight = Math.min(height, width / aspectRatio);
        cropWidth = cropHeight * aspectRatio;
      } else {
        // Vertical: aspect ratio < 1 (ej: 9/16 = 0.56)
        cropWidth = Math.min(width, height * aspectRatio);
        cropHeight = cropWidth / aspectRatio;
      }

      // Crear crop centrado
      return centerCrop(
        makeAspectCrop(
          {
            unit: 'px',
            width: cropWidth,
            height: cropHeight,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      );
    },
    [aspectRatio],
  );

  // Manejar carga de imagen
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const image = e.currentTarget;
      const initialCrop = calculateInitialCrop(image);
      setCrop(initialCrop);
      setCompletedCrop(initialCrop);
      setImageLoaded(true);
      setImageError(false);
    },
    [calculateInitialCrop],
  );

  // Manejar error de carga de imagen
  const onImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    toast.error('Error al cargar la imagen');
  }, []);

  // Función para procesar la imagen recortada
  const processImage = useCallback(async (): Promise<File | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calcular la escala entre la imagen mostrada y la imagen real
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Configurar el canvas con las dimensiones del crop escaladas
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Dibujar la imagen recortada en el canvas
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    // Convertir canvas a blob y luego a File
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        0.85, // Calidad 85%
      );
    });
  }, [completedCrop]);

  // Manejar confirmación del recorte
  const handleConfirm = useCallback(async () => {
    if (!completedCrop || processing) return;

    setProcessing(true);
    try {
      const croppedFile = await processImage();
      if (croppedFile) {
        onCropComplete(croppedFile);
      } else {
        toast.error('Error al procesar la imagen');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Error al procesar la imagen');
    } finally {
      setProcessing(false);
    }
  }, [completedCrop, processing, processImage, onCropComplete]);

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    if (!processing) {
      onCancel();
    }
  }, [processing, onCancel]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !processing) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, processing, handleCancel]);

  // Reset estados cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setImageError(false);
      setProcessing(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [isOpen, src]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleCancel} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Recortar Imagen</h2>
          <button
            onClick={handleCancel}
            disabled={processing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar">
            <TbX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-hidden">
          <div className="flex flex-col items-center space-y-4 h-full">
            {/* Instructions */}
            <p className="text-sm text-gray-600 text-center shrink-0">
              Ajusta el área de recorte arrastrando las esquinas.
              {aspectRatio === 1 ?
                ' La imagen se recortará en formato cuadrado.'
              : ` La imagen se recortará con relación ${aspectRatio === 16 / 9 ? '16:9' : `${aspectRatio}:1`}.`}
            </p>

            {/* Image Cropper */}
            <div className="w-full flex justify-center flex-1 min-h-0">
              <div className="flex items-center justify-center w-full h-full">
                {imageError ?
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500 text-sm">Error al cargar la imagen</p>
                  </div>
                : <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspectRatio}
                    minWidth={50}
                    minHeight={50}
                    circularCrop={false}
                    ruleOfThirds>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={src}
                      alt="Imagen a recortar"
                      onLoad={onImageLoad}
                      onError={onImageError}
                      className="max-w-full max-h-full object-contain"
                      style={{
                        maxHeight: 'calc(90vh - 200px)', // Deja espacio para header, footer y padding
                        maxWidth: 'calc(100vw - 100px)', // Máximo ancho responsivo
                      }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                }
              </div>
            </div>

            {/* Loading State */}
            {!imageLoaded && !imageError && (
              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <TbLoader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando imagen...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 shrink-0 rounded-b-xl">
          <button
            onClick={handleCancel}
            disabled={processing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !imageLoaded || !completedCrop}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2">
            {processing ?
              <>
                <TbLoader className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            : <>
                <TbCheck className="w-4 h-4" />
                <span>Confirmar Recorte</span>
              </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
